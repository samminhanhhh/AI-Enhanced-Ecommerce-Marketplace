const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Helper: lấy hoặc tạo cuộc trò chuyện giữa buyer và seller
function getOrCreateConversation(buyerId, sellerId, callback) {
  db.query('SELECT id FROM conversations WHERE buyer_id = ? AND seller_id = ?', [buyerId, sellerId], (err, existing) => {
    if (err) return callback(err);
    if (existing.length > 0) return callback(null, existing[0].id);
    db.query('INSERT INTO conversations (buyer_id, seller_id) VALUES (?, ?)', [buyerId, sellerId], (err, result) => {
      if (err) return callback(err);
      callback(null, result.insertId);
    });
  });
}

// Helper: tự động gửi 1 tin nhắn "hệ thống" vào cuộc trò chuyện buyer-seller
function sendSystemMessage(buyerId, sellerId, senderId, content) {
  getOrCreateConversation(buyerId, sellerId, (err, conversationId) => {
    if (err) return console.error('Lỗi tạo hội thoại:', err);
    db.query('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)', [conversationId, senderId, content], (err) => {
      if (err) console.error('Lỗi gửi tin nhắn hệ thống:', err);
    });
  });
}

// Helper: lấy danh sách seller liên quan tới 1 đơn hàng (đơn có thể gồm nhiều shop)
function getSellerIdsForOrder(orderId, callback) {
  db.query(
    `SELECT DISTINCT p.seller_id FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
    [orderId],
    (err, results) => {
      if (err) return callback(err);
      callback(null, results.map((r) => r.seller_id));
    }
  );
}

// POST - Đặt hàng (checkout) - dùng TRANSACTION + khóa FOR UPDATE để chống race condition
// khi nhiều người mua cùng đặt một sản phẩm gần như đồng thời (xem giải trình ở cuối file).
const MAX_ORDER_RETRIES = 3; // số lần tự thử lại tối đa nếu 2 giao dịch giẫm chân nhau gây deadlock

router.post('/', verifyToken, (req, res) => {
  const { payment_method, shipping_address, selected_item_ids } = req.body;
  if (!payment_method || !shipping_address || !selected_item_ids || selected_item_ids.length === 0) {
    return res.status(400).json({ message: 'Vui lòng chọn sản phẩm và điền đủ thông tin' });
  }

  attemptPlaceOrder(
    { userId: req.user.id, payment_method, shipping_address, selected_item_ids },
    res,
    MAX_ORDER_RETRIES
  );
});

function attemptPlaceOrder(orderInput, res, retriesLeft) {
  const { userId, payment_method, shipping_address, selected_item_ids } = orderInput;

  // Lấy connection riêng để dùng transaction (không dùng chung pool query thông thường)
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Lỗi server' });
      }

      // Bước 1: Lấy giỏ hàng + KHÓA các dòng sản phẩm liên quan (FOR UPDATE)
      //
      // FOR UPDATE khiến MySQL khóa các dòng "products" được SELECT cho đến khi transaction này
      // commit/rollback. Nếu người mua thứ 2 cũng đặt sản phẩm này gần như cùng lúc, request của
      // họ sẽ phải CHỜ transaction thứ nhất kết thúc rồi mới được đọc/khóa dòng, và sẽ thấy đúng
      // tồn kho MỚI NHẤT (không phải tồn kho cũ trước khi người thứ nhất trừ) — nhờ đó tránh được
      // tình trạng cả 2 giao dịch cùng đọc "còn hàng" rồi cùng trừ kho, dẫn đến bán vượt tồn kho.
      //
      // ORDER BY p.id ASC: đảm bảo mọi giao dịch luôn khóa các sản phẩm theo đúng 1 thứ tự cố định
      // (id tăng dần), giảm khả năng 2 giao dịch khóa chéo nhau gây deadlock khi đơn hàng có nhiều
      // sản phẩm trùng nhau.
      const getCartSql = `SELECT ci.id AS cart_item_id, ci.product_id, ci.variant_id, ci.quantity, p.stock, p.name,
              (p.price + IFNULL(pv.price_extra, 0)) AS price
              FROM cart_items ci
              JOIN carts c ON ci.cart_id = c.id
              JOIN products p ON ci.product_id = p.id
              LEFT JOIN product_variants pv ON ci.variant_id = pv.id
              WHERE c.user_id = ? AND ci.id IN (?)
              ORDER BY p.id ASC
              FOR UPDATE`;
      connection.query(getCartSql, [userId, selected_item_ids], (err, cartItems) => {
        if (err) return handleOrderError(err, connection, res, orderInput, retriesLeft);

        if (cartItems.length === 0) {
          connection.rollback(() => connection.release());
          return res.status(400).json({ message: 'Giỏ hàng trống, không thể đặt hàng' });
        }

        // Bước 2: Kiểm tra tồn kho đủ không.
        // Vì bước 1 đã dùng FOR UPDATE, giá trị item.stock ở đây chắc chắn là tồn kho mới nhất
        // tại thời điểm khóa được cấp — không còn là dữ liệu "cũ" có thể bị người khác vừa đổi.
        for (const item of cartItems) {
          if (item.quantity > item.stock) {
            connection.rollback(() => connection.release());
            return res.status(400).json({ message: `Sản phẩm "${item.name}" không đủ hàng tồn kho` });
          }
        }

        // Bước 3: Tính tổng tiền
        const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Bước 4: Tạo đơn hàng
        const createOrderSql = `INSERT INTO orders (user_id, total_amount, payment_method, shipping_address)
                                VALUES (?, ?, ?, ?)`;
        connection.query(createOrderSql, [userId, totalAmount, payment_method, shipping_address], (err, orderResult) => {
          if (err) return handleOrderError(err, connection, res, orderInput, retriesLeft);

          const orderId = orderResult.insertId;

          // Bước 5: Tạo order_items + trừ tồn kho cho từng sản phẩm
          let completed = 0;
          let hasError = false;

          cartItems.forEach((item) => {
            const insertItemSql = `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price_at_purchase)
                       VALUES (?, ?, ?, ?, ?)`;
            connection.query(insertItemSql, [orderId, item.product_id, item.variant_id || null, item.quantity, item.price], (err) => {
              if (err) {
                if (!hasError) { hasError = true; handleOrderError(err, connection, res, orderInput, retriesLeft); }
                return;
              }

              const updateStockSql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
              connection.query(updateStockSql, [item.quantity, item.product_id], (err) => {
                if (err) {
                  if (!hasError) { hasError = true; handleOrderError(err, connection, res, orderInput, retriesLeft); }
                  return;
                }

                completed++;
                // Khi đã xử lý xong HẾT các sản phẩm trong giỏ
                if (completed === cartItems.length && !hasError) {
                  // Bước 6: Xóa giỏ hàng sau khi đặt thành công
                  const clearCartSql = `DELETE FROM cart_items WHERE id IN (?)`;
                  connection.query(clearCartSql, [selected_item_ids], (err) => {
                    if (err) return handleOrderError(err, connection, res, orderInput, retriesLeft);

                    // Bước 7: TẤT CẢ THÀNH CÔNG -> lưu thật vào database, giải phóng khóa FOR UPDATE
                    connection.commit((err) => {
                      connection.release();
                      if (err) return res.status(500).json({ message: 'Lỗi server' });
                      res.status(201).json({ message: 'Đặt hàng thành công', orderId, totalAmount });
                    });
                  });
                }
              });
            });
          });
        });
      });
    });
  });
}

// Hàm phụ trợ: hủy transaction (giải phóng mọi khóa FOR UPDATE đang giữ), giải phóng connection,
// và TỰ ĐỘNG THỬ LẠI toàn bộ giao dịch nếu nguyên nhân lỗi là deadlock (2 giao dịch khóa chéo nhau) —
// vì trong trường hợp đó dữ liệu không hề sai, chỉ là MySQL buộc phải hủy 1 trong 2 giao dịch để
// tránh treo vĩnh viễn, nên thử lại là hợp lý thay vì báo lỗi ngay cho người dùng.
function handleOrderError(err, connection, res, orderInput, retriesLeft) {
  connection.rollback(() => {
    connection.release();
    console.error(err);

    const isDeadlock = err && (err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213);
    if (isDeadlock && retriesLeft > 0) {
      console.warn(`Deadlock khi đặt hàng, tự động thử lại (còn ${retriesLeft} lần)...`);
      return attemptPlaceOrder(orderInput, res, retriesLeft - 1);
    }

    res.status(500).json({ message: 'Lỗi khi đặt hàng, đã hủy giao dịch' });
  });
}

// GET - Xem danh sách đơn hàng của tôi
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });

    // Đánh dấu đã xem - reset badge thông báo (không cần chờ kết quả)
    db.query('UPDATE orders SET buyer_notified = TRUE WHERE user_id = ?', [req.user.id], () => {});

    res.json(results);
  });
});

// GET - Đếm số đơn hàng có cập nhật mới mà buyer chưa xem (dùng cho badge)
router.get('/buyer/unseen-count', verifyToken, (req, res) => {
  db.query('SELECT COUNT(*) AS count FROM orders WHERE user_id = ? AND buyer_notified = FALSE', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ count: results[0].count });
  });
});

// GET - Đơn hàng có chứa sản phẩm của seller đang đăng nhập (CHỈ hiện đúng phần sản phẩm của mình trong đơn)
router.get('/seller', verifyToken, checkRole(['seller']), (req, res) => {
  const sellerId = req.user.id;


  const ordersSql = `SELECT o.id, o.created_at, o.payment_method, o.payment_status,
                 o.shipping_status, o.shipping_address, o.total_amount,
                 o.return_reason, o.return_image_url,
                 u.name AS customer_name, u.phone AS customer_phone
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 WHERE EXISTS (
                   SELECT 1 FROM order_items oi
                   JOIN products p ON oi.product_id = p.id
                   WHERE oi.order_id = o.id AND p.seller_id = ?
                 )
                 ORDER BY o.created_at DESC`;


  db.query(ordersSql, [sellerId], (err, orders) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (orders.length === 0) return res.json([]);


    const orderIds = orders.map((o) => o.id);
    const itemsSql = `SELECT oi.order_id, oi.quantity, oi.price_at_purchase, p.name
                      FROM order_items oi
                      JOIN products p ON oi.product_id = p.id
                      WHERE oi.order_id IN (?) AND p.seller_id = ?`;


    db.query(itemsSql, [orderIds, sellerId], (err, items) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });


      const result = orders.map((o) => ({
        ...o,
        items: items.filter((i) => i.order_id === o.id)
      }));
      res.json(result);
    });
  });
});


// GET - Đếm số đơn hàng đang "chờ xác nhận" chứa sản phẩm của seller (dùng cho badge thông báo)
router.get('/seller/pending-count', verifyToken, checkRole(['seller']), (req, res) => {
  const sql = `SELECT COUNT(DISTINCT o.id) AS count
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.id
              JOIN products p ON oi.product_id = p.id
              WHERE p.seller_id = ? AND o.shipping_status IN ('pending', 'return_requested')`;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ count: results[0].count });
  });
});

// GET - Xem chi tiết 1 đơn hàng (kèm danh sách sản phẩm trong đơn)
router.get('/:id', verifyToken, (req, res) => {
  db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, orders) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (orders.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const itemsSql = `SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`;
    db.query(itemsSql, [req.params.id], (err, items) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ ...orders[0], items });
    });
  });
});

// PUT - Cập nhật trạng thái đơn hàng (CHỈ seller/admin)
router.put('/:id/status', verifyToken, checkRole(['seller', 'admin']), (req, res) => {
  const { shipping_status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

  if (!validStatuses.includes(shipping_status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }
    db.query('UPDATE orders SET shipping_status = ?, buyer_notified = FALSE WHERE id = ?', [shipping_status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Đã cập nhật trạng thái đơn hàng' });
  });
});

// PUT - Buyer tự hủy đơn (CHỈ khi đơn còn "chờ xác nhận")
router.put('/:id/cancel', verifyToken, (req, res) => {
  const orderId = req.params.id;
  db.query('SELECT user_id, shipping_status FROM orders WHERE id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (results[0].user_id !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền hủy đơn này' });
    if (results[0].shipping_status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn khi còn ở trạng thái chờ xác nhận' });
    }
    db.query('UPDATE orders SET shipping_status = ? WHERE id = ?', ['cancelled', orderId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Đã hủy đơn hàng' });
    });
  });
});

// PUT - Buyer yêu cầu trả hàng (CHỈ khi đơn "đã giao"), kèm ảnh bằng chứng
router.put('/:id/request-return', verifyToken, upload.single('image'), (req, res) => {
  const { reason } = req.body;
  const orderId = req.params.id;
  if (!reason || reason.trim() === '') return res.status(400).json({ message: 'Vui lòng chọn lý do trả hàng' });

  db.query('SELECT user_id, shipping_status FROM orders WHERE id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (results[0].user_id !== req.user.id) return res.status(403).json({ message: 'Bạn không có quyền thao tác đơn này' });
    if (results[0].shipping_status !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ có thể yêu cầu trả hàng khi đơn đã được giao' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    db.query(
      'UPDATE orders SET shipping_status = ?, return_reason = ?, return_image_url = ? WHERE id = ?',
      ['return_requested', reason, imageUrl, orderId],
      (err) => {
        if (err) return res.status(500).json({ message: 'Lỗi server' });

        // Gửi tin nhắn tự động cho TẤT CẢ seller có sản phẩm trong đơn này
        getSellerIdsForOrder(orderId, (err, sellerIds) => {
          if (!err) {
            sellerIds.forEach((sellerId) => {
              sendSystemMessage(
                req.user.id, sellerId, req.user.id,
                `🔔 Tôi đã gửi yêu cầu trả hàng cho đơn #${orderId}. Lý do: ${reason}`
              );
            });
          }
        });

        res.json({ message: 'Đã gửi yêu cầu trả hàng' });
      }
    );
  });
});

// PUT - Seller/Admin duyệt yêu cầu trả hàng
router.put('/:id/review-return', verifyToken, checkRole(['seller', 'admin']), (req, res) => {
  const { approved } = req.body;
  const orderId = req.params.id;
  const sellerId = req.user.id;

  db.query('SELECT user_id FROM orders WHERE id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const buyerId = results[0].user_id;

    const newShippingStatus = approved ? 'returned' : 'delivered';
    const newPaymentStatus = approved ? 'refunded' : undefined;

    const sql = newPaymentStatus
      ? 'UPDATE orders SET shipping_status = ?, payment_status = ?, buyer_notified = FALSE WHERE id = ?'
      : 'UPDATE orders SET shipping_status = ?, buyer_notified = FALSE WHERE id = ?';
    const params = newPaymentStatus ? [newShippingStatus, newPaymentStatus, orderId] : [newShippingStatus, orderId];

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });

      const messageContent = approved
        ? `Yêu cầu trả hàng cho đơn #${orderId} đã được chấp nhận. Tiền sẽ được hoàn lại (mô phỏng).`
        : `Yêu cầu trả hàng cho đơn #${orderId} đã bị từ chối.`;
      sendSystemMessage(buyerId, sellerId, sellerId, messageContent);

      res.json({ message: approved ? 'Đã chấp nhận trả hàng và hoàn tiền (mô phỏng)' : 'Đã từ chối yêu cầu trả hàng' });
    });
  });
});

module.exports = router;