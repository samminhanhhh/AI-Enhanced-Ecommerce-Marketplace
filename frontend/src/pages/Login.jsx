import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/users/login', formData);
      // Lưu token vào localStorage - trình duyệt sẽ "nhớ" dù tắt tab
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Đăng nhập thành công!');
      navigate('/'); // về trang chủ
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required /><br /><br />
        <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} required /><br /><br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Đăng nhập</button>
      </form>
      <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
    </div>
  );
}

export default Login;