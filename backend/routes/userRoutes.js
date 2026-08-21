const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// API ĐĂNG KÝ - POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Kiểm tra dữ liệu đầu vào có đủ không
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ tên, email, mật khẩu' });
    }

    // Băm mật khẩu trước khi lưu (KHÔNG BAO GIỜ lưu mật khẩu thô)
    const passwordHash = await bcrypt.hash(password, 10);

    // Câu lệnh SQL thêm user mới vào database
    const sql = 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, passwordHash, role || 'buyer'], (err, result) => {
      if (err) {
        // Nếu email đã tồn tại, MySQL sẽ báo lỗi trùng (unique constraint)
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Email này đã được đăng ký' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
      res.status(201).json({ message: 'Đăng ký thành công', userId: result.insertId });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// API ĐĂNG NHẬP - POST /api/users/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }

    // Không tìm thấy user nào có email này
    if (results.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = results[0];

    // So sánh mật khẩu người dùng nhập với mật khẩu đã băm trong database
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo JWT token - "vé thông hành" chứa id và role của user
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });
});

// API lấy thông tin cá nhân - CẦN đăng nhập mới gọi được
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'Đây là thông tin của bạn', user: req.user });
});

// GET - Xem hồ sơ cá nhân của chính mình
router.get('/me', verifyToken, (req, res) => {
  db.query(
    'SELECT id, name, email, role, phone, address, avatar_url, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      res.json(results[0]);
    }
  );
});

// PUT - Cập nhật hồ sơ cá nhân (tên, số điện thoại, địa chỉ)
router.put('/me', verifyToken, (req, res) => {
  const { name, phone, address } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng nhập tên' });
  }

  db.query(
    'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone || null, address || null, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Cập nhật hồ sơ thành công' });
    }
  );
});

module.exports = router;