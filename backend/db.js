require('dotenv').config();
const mysql = require('mysql2');

// Tạo POOL kết nối (thay vì 1 kết nối đơn) - hỗ trợ nhiều truy vấn đồng thời + transaction
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10
});

// Kiểm tra kết nối ngay khi khởi động server
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Kết nối database THẤT BẠI:', err.message);
    return;
  }
  console.log('Kết nối database THÀNH CÔNG!');
  connection.release(); // trả kết nối test lại về pool
});

module.exports = pool;