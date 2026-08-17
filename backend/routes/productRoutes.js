const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// POST - Đăng sản phẩm mới (CHỈ seller)
router.post('/', verifyToken, checkRole(['seller']), (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const seller_id = req.user.id; // lấy từ token, KHÔNG tin dữ liệu người dùng tự gửi lên

  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ tên, giá, danh mục' });
  }

  const sql = `INSERT INTO products (seller_id, category_id, name, description, price, stock, status)
               VALUES (?, ?, ?, ?, ?, ?, 'active')`;
  db.query(sql, [seller_id, category_id, name, description || null, price, stock || 0], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.status(201).json({ message: 'Đăng sản phẩm thành công', productId: result.insertId });
  });
});


// GET - Xem chi tiết 1 sản phẩm theo id
router.get('/:id', (req, res) => {
  const sql = `SELECT p.*, c.name AS category_name, u.name AS seller_name
             FROM products p
             JOIN categories c ON p.category_id = c.id
             JOIN users u ON p.seller_id = u.id
             WHERE p.id = ?`;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(results[0]);
  });
});

// PUT - Sửa sản phẩm (CHỈ seller SỞ HỮU sản phẩm đó)
router.put('/:id', verifyToken, checkRole(['seller']), (req, res) => {
  const { name, description, price, stock } = req.body;
  const productId = req.params.id;

  // Bước 1: kiểm tra sản phẩm này có đúng của seller đang đăng nhập không
  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa sản phẩm này' });
    }

    // Bước 2: nếu đúng chủ, cho phép sửa
    const sql = 'UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?';
    db.query(sql, [name, description, price, stock, productId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Cập nhật sản phẩm thành công' });
    });
  });
});

// DELETE - Xóa sản phẩm (CHỈ seller SỞ HỮU sản phẩm đó)
router.delete('/:id', verifyToken, checkRole(['seller']), (req, res) => {
  const productId = req.params.id;

  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này' });
    }

    db.query('DELETE FROM products WHERE id = ?', [productId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Xóa sản phẩm thành công' });
    });
  });
});

// POST - Upload ảnh cho 1 sản phẩm (CHỈ seller sở hữu)
router.post('/:id/images', verifyToken, checkRole(['seller']), upload.single('image'), (req, res) => {
  const productId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }

  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm ảnh cho sản phẩm này' });
    }

    // Kiểm tra sản phẩm này đã có ảnh nào chưa - nếu chưa, ảnh này sẽ là ảnh chính
    db.query('SELECT COUNT(*) AS total FROM product_images WHERE product_id = ?', [productId], (err, countResult) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      const isFirstImage = countResult[0].total === 0;

      const imageUrl = `/uploads/${req.file.filename}`;
      db.query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
        [productId, imageUrl, isFirstImage],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Lỗi server' });
          res.status(201).json({ message: 'Upload ảnh thành công', imageUrl });
        }
      );
    });
  });
});

// GET - Xem danh sách sản phẩm (có kèm ảnh đại diện)
router.get('/', (req, res) => {
  const { category_id, search } = req.query;

  let sql = `SELECT p.*, c.name AS category_name, u.name AS seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
             FROM products p
             JOIN categories c ON p.category_id = c.id
             JOIN users u ON p.seller_id = u.id
             WHERE p.status = 'active'`;
  const params = [];

  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (search) {
    sql += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.json(results);
  });
});

module.exports = router;