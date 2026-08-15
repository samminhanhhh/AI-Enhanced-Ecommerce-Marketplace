import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Register() {
  // useState: "hộp lưu trữ" giá trị, khi giá trị thay đổi, giao diện tự vẽ lại
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'buyer'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate(); // dùng để chuyển trang bằng code

  // Hàm chạy mỗi khi người dùng gõ vào 1 ô input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm chạy khi bấm nút "Đăng ký"
  const handleSubmit = async (e) => {
    e.preventDefault(); // ngăn trang bị load lại (hành vi mặc định của form HTML)
    setError('');
    try {
      await api.post('/users/register', formData);
      alert('Đăng ký thành công! Mời bạn đăng nhập.');
      navigate('/login'); // chuyển sang trang đăng nhập
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h2>Đăng ký tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Họ tên" onChange={handleChange} required /><br /><br />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required /><br /><br />
        <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} required /><br /><br />
        <select name="role" onChange={handleChange}>
          <option value="buyer">Người mua</option>
          <option value="seller">Người bán</option>
        </select><br /><br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Đăng ký</button>
      </form>
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </div>
  );
}

export default Register;