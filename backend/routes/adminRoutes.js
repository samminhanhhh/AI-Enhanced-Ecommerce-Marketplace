const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Áp dụng cho TẤT CẢ route trong file này: phải đăng nhập VÀ phải là admin
router.use(verifyToken, checkRole(['admin']));

// GET - Danh sách tất cả người dùng
router.get('/users', (req, res) => {
  db.query('SELECT id, name, email, role, is_active, created_at FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

// PUT - Khóa/Mở khóa tài khoản người dùng
router.put('/users/:id/toggle-status', (req, res) => {
  db.query('SELECT is_active FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const newStatus = !results[0].is_active;
    db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
    });
  });
});

// GET - Danh sách sản phẩm CHỜ DUYỆT
router.get('/products/pending', (req, res) => {
  const sql = `SELECT p.*, u.name AS seller_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
              FROM products p
              JOIN users u ON p.seller_id = u.id
              WHERE p.status = 'pending'`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

// PUT - Duyệt (hoặc từ chối) sản phẩm
router.put('/products/:id/review', (req, res) => {
  const { status } = req.body; // 'active' (duyệt) hoặc 'inactive' (từ chối)
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }
  db.query('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Đã cập nhật trạng thái sản phẩm' });
  });
});

// GET - Xem tất cả đơn hàng (toàn hệ thống, không lọc theo user)
router.get('/orders', (req, res) => {
  const sql = `SELECT o.*, u.name AS customer_name FROM orders o
              JOIN users u ON o.user_id = u.id
              ORDER BY o.created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

module.exports = router;