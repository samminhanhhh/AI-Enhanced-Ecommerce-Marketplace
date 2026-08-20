const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// POST - Viết đánh giá cho 1 sản phẩm (CHỈ khi đã từng mua sản phẩm đó)
router.post('/', verifyToken, (req, res) => {
  const { product_id, rating, comment } = req.body;
  const userId = req.user.id;

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ sản phẩm và số sao (1-5)' });
  }

  // Kiểm tra user này đã từng mua sản phẩm này chưa (qua order_items + orders)
  const checkPurchaseSql = `SELECT oi.id FROM order_items oi
                            JOIN orders o ON oi.order_id = o.id
                            WHERE o.user_id = ? AND oi.product_id = ?
                            LIMIT 1`;
  db.query(checkPurchaseSql, [userId, product_id], (err, purchaseResults) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (purchaseResults.length === 0) {
      return res.status(403).json({ message: 'Bạn cần mua sản phẩm này trước khi đánh giá' });
    }

    // Kiểm tra đã review sản phẩm này trước đó chưa (tránh review trùng)
    db.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [userId, product_id], (err, existing) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
      }

      const sql = 'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)';
      db.query(sql, [userId, product_id, rating, comment || null], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi server' });
        res.status(201).json({ message: 'Đánh giá thành công', reviewId: result.insertId });
      });
    });
  });
});

// GET - Xem tất cả đánh giá của 1 sản phẩm
router.get('/product/:productId', (req, res) => {
  const sql = `SELECT r.*, u.name AS user_name FROM reviews r
              JOIN users u ON r.user_id = u.id
              WHERE r.product_id = ?
              ORDER BY r.created_at DESC`;
  db.query(sql, [req.params.productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

module.exports = router;