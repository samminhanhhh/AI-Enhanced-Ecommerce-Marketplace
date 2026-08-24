const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Hàm phụ trợ: lấy cart_id của user, tự tạo mới nếu chưa có
function getOrCreateCart(userId, callback) {
  db.query('SELECT id FROM carts WHERE user_id = ?', [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length > 0) {
      return callback(null, results[0].id); // đã có giỏ hàng, trả về id
    }
    // Chưa có, tạo mới
    db.query('INSERT INTO carts (user_id) VALUES (?)', [userId], (err, result) => {
      if (err) return callback(err);
      callback(null, result.insertId);
    });
  });
}

// GET - Xem giỏ hàng của tôi (kèm chi tiết từng sản phẩm)
router.get('/', verifyToken, (req, res) => {
  getOrCreateCart(req.user.id, (err, cartId) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });

    const sql = `SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id, ci.variant_id,
                p.name, p.price, p.stock, pv.variant_name, pv.price_extra,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                LEFT JOIN product_variants pv ON ci.variant_id = pv.id
                WHERE ci.cart_id = ?`;
    db.query(sql, [cartId], (err, items) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ cartId, items });
    });
  });
});

// POST - Thêm sản phẩm vào giỏ hàng
router.post('/items', verifyToken, (req, res) => {
  const { product_id, variant_id, quantity } = req.body;
  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }

  getOrCreateCart(req.user.id, (err, cartId) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });

    const checkSql = variant_id
      ? 'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?'
      : 'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id IS NULL';
    const checkParams = variant_id ? [cartId, product_id, variant_id] : [cartId, product_id];

    db.query(checkSql, checkParams, (err, existing) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });

      if (existing.length > 0) {
        const newQty = existing[0].quantity + quantity;
        db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id], (err) => {
          if (err) return res.status(500).json({ message: 'Lỗi server' });
          res.json({ message: 'Đã cập nhật số lượng trong giỏ hàng' });
        });
      } else {
        db.query('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
          [cartId, product_id, variant_id || null, quantity], (err) => {
            if (err) return res.status(500).json({ message: 'Lỗi server' });
            res.status(201).json({ message: 'Đã thêm vào giỏ hàng' });
          });
      }
    });
  });
});

// PUT - Cập nhật số lượng 1 sản phẩm trong giỏ
router.put('/items/:id', verifyToken, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Số lượng không hợp lệ' });
  }
  db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Đã cập nhật số lượng' });
  });
});

// DELETE - Xóa 1 sản phẩm khỏi giỏ
router.delete('/items/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  });
});

module.exports = router;