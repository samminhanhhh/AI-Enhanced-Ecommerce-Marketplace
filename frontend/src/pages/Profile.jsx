import { useState, useEffect } from 'react';
import api from '../api/axios';

function Profile() {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/users/me').then((res) => {
      const u = res.data;
      setForm({ name: u.name || '', phone: u.phone || '', address: u.address || '' });
      setEmail(u.email);
      setRole(u.role);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/users/me', form);
      // Cập nhật lại localStorage để Navbar hiển thị tên mới ngay lập tức
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, name: form.name }));
      setMessage('Đã lưu thay đổi thành công!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra');
    }
    setSaving(false);
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 450, margin: '30px auto', padding: '0 20px' }}>
      <h2>Hồ sơ cá nhân</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email</p>
        <p>{email}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Vai trò</p>
        <p style={{ textTransform: 'capitalize' }}>{role}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Họ tên</label><br />
        <input name="name" value={form.name} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }} required /><br />

        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Số điện thoại</label><br />
        <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }} /><br />

        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Địa chỉ</label><br />
        <textarea name="address" value={form.address} onChange={handleChange} rows={3} style={{ width: '100%', marginBottom: 12 }} /><br />

        {message && <p style={{ color: message.includes('thành công') ? 'var(--success)' : 'var(--danger)', fontSize: 13 }}>{message}</p>}

        <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>
    </div>
  );
}

export default Profile;