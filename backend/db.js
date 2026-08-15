// Nạp các biến bí mật từ file .env
require('dotenv').config();

const mysql = require('mysql2');

// Tạo kết nối tới MySQL bằng thông tin trong file .env
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Thử kết nối, báo kết quả ra Terminal
connection.connect((err) => {
  if (err) {
    console.error('Kết nối database THẤT BẠI:', err.message);
    return;
  }
  console.log('Kết nối database THÀNH CÔNG!');
});

module.exports = connection;