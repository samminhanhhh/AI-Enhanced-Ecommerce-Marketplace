// Import thư viện Express vừa cài
const express = require('express');
const db = require('./db');

// Tạo một "ứng dụng" Express - đây sẽ là server của mình
const app = express();

// Chọn cổng (port) để server lắng nghe - giống như "địa chỉ nhà"
const PORT = 5000;

// Tạo một "route" (đường dẫn) đơn giản để kiểm tra server có chạy không
// Khi ai đó truy cập vào "/", server sẽ trả về dòng chữ này
app.get('/', (req, res) => {
  res.send('Server backend đang chạy');
});

// Khởi động server, lắng nghe ở cổng đã chọn
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
