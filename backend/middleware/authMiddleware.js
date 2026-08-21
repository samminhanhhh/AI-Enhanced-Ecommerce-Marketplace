const jwt = require('jsonwebtoken');
const db = require('../db');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = decoded;

    // Cập nhật thời gian hoạt động gần nhất - không cần chờ kết quả (fire and forget)
    db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [decoded.id], () => {});

    next();
  });
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole };