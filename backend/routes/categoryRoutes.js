const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

router.post('/', verifyToken, checkRole(['admin']), (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên danh mục' });
  db.query('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)', [name, description || null, icon || '📦'], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.status(201).json({ message: 'Tạo danh mục thành công', categoryId: result.insertId });
  });
});

// PUT - Sửa danh mục (admin)
router.put('/:id', verifyToken, checkRole(['admin']), (req, res) => {
  const { name, description, icon } = req.body;
  db.query('UPDATE categories SET name=?, description=?, icon=? WHERE id=?', [name, description, icon, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: 'Cập nhật danh mục thành công' });
  });
});

// DELETE - Xóa danh mục (admin) - chặn nếu vẫn còn sản phẩm dùng danh mục này
router.delete('/:id', verifyToken, checkRole(['admin']), (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM products WHERE category_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results[0].total > 0) {
      return res.status(409).json({ message: `Không thể xóa - vẫn còn ${results[0].total} sản phẩm thuộc danh mục này` });
    }
    db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Đã xóa danh mục' });
    });
  });
});

module.exports = router;