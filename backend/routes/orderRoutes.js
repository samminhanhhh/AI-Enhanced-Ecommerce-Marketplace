const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// POST - Đặt hàng (checkout) - dùng TRANSACTION
router.post('/', verifyToken, (req, res) => {
  const { payment_method, shipping_address } = req.body;
  const userId = req.user.id;

  if (!payment_method || !shipping_address) {
    return res.status(400).json({ message: 'Vui lòng chọn phương thức thanh toán và địa chỉ giao hàng' });
  }

  // Lấy connection riêng để dùng transaction (không dùng chung pool query thông thường)
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: 'Lỗi server' });
      }

      // Bước 1: Lấy giỏ hàng + các sản phẩm trong giỏ
      const getCartSql = `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
                          FROM cart_items ci
                          JOIN carts c ON ci.cart_id = c.id
                          JOIN products p ON ci.product_id = p.id
                          WHERE c.user_id = ?`;
      connection.query(getCartSql, [userId], (err, cartItems) => {
        if (err) return rollbackAndError(connection, res, err);

        if (cartItems.length === 0) {
          connection.release();
          return res.status(400).json({ message: 'Giỏ hàng trống, không thể đặt hàng' });
        }

        // Bước 2: Kiểm tra tồn kho đủ không
        for (const item of cartItems) {
          if (item.quantity > item.stock) {
            connection.release();
            return res.status(400).json({ message: `Sản phẩm "${item.name}" không đủ hàng tồn kho` });
          }
        }

        // Bước 3: Tính tổng tiền
        const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Bước 4: Tạo đơn hàng
        const createOrderSql = `INSERT INTO orders (user_id, total_amount, payment_method, shipping_address)
                                VALUES (?, ?, ?, ?)`;
        connection.query(createOrderSql, [userId, totalAmount, payment_method, shipping_address], (err, orderResult) => {
          if (err) return rollbackAndError(connection, res, err);

          const orderId = orderResult.insertId;

          // Bước 5: Tạo order_items + trừ tồn kho cho từng sản phẩm
          let completed = 0;
          let hasError = false;

          cartItems.forEach((item) => {
            const insertItemSql = `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                                   VALUES (?, ?, ?, ?)`;
            connection.query(insertItemSql, [orderId, item.product_id, item.quantity, item.price], (err) => {
              if (err && !hasError) { hasError = true; return rollbackAndError(connection, res, err); }

              const updateStockSql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
              connection.query(updateStockSql, [item.quantity, item.product_id], (err) => {
                if (err && !hasError) { hasError = true; return rollbackAndError(connection, res, err); }

                completed++;
                // Khi đã xử lý xong HẾT các sản phẩm trong giỏ
                if (completed === cartItems.length && !hasError) {
                  // Bước 6: Xóa giỏ hàng sau khi đặt thành công
                  const clearCartSql = `DELETE ci FROM cart_items ci
                                        JOIN carts c ON ci.cart_id = c.id
                                        WHERE c.user_id = ?`;
                  connection.query(clearCartSql, [userId], (err) => {
                    if (err) return rollbackAndError(connection, res, err);

                    // Bước 7: TẤT CẢ THÀNH CÔNG -> lưu thật vào database
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
});

// Hàm phụ trợ: hủy transaction và trả lỗi
function rollbackAndError(connection, res, err) {
  connection.rollback(() => {
    connection.release();
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi đặt hàng, đã hủy giao dịch' });
  });
}

// GET - Xem danh sách đơn hàng của tôi
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
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

  db.query('UPDATE orders SET shipping_status = ? WHERE id = ?', [shipping_status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Đã cập nhật trạng thái đơn hàng' });
  });
});

module.exports = router;