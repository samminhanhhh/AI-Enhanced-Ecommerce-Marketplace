const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// GET tất cả danh mục - AI CŨNG XEM ĐƯỢC, không cần đăng nhập
router.get('/', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.json(results);
  });
});

// POST tạo danh mục mới - CHỈ ADMIN được tạo
router.post('/', verifyToken, checkRole(['admin']), (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Vui lòng nhập tên danh mục' });
  }
  const sql = 'INSERT INTO categories (name, description) VALUES (?, ?)';
  db.query(sql, [name, description || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.status(201).json({ message: 'Tạo danh mục thành công', categoryId: result.insertId });
  });
});

module.exports = router;