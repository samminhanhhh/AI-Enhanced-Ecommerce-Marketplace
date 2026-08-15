import axios from 'axios';

// Tạo 1 "bản sao" axios đã cấu hình sẵn địa chỉ gốc của backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;
