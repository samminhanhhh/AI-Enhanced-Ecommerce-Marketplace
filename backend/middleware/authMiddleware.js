const jwt = require('jsonwebtoken');

// Middleware 1: Kiểm tra đã đăng nhập chưa (có token hợp lệ không)
function verifyToken(req, res, next) {
  // Token thường được gửi kèm trong header dạng: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    // Lưu thông tin user đã giải mã được vào req, để các bước sau dùng
    req.user = decoded; // decoded = { id, role }
    next(); // Cho phép đi tiếp
  });
}

// Middleware 2: Kiểm tra vai trò (dùng SAU verifyToken)
// allowedRoles là 1 mảng, ví dụ: ['seller', 'admin']
function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole };