import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role !== 'seller') return;

    const fetchCount = () => {
      api.get('/orders/seller/pending-count')
        .then((res) => setPendingCount(res.data.count))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // kiểm tra lại mỗi 30 giây
    return () => clearInterval(interval); // dọn dẹp khi rời trang, tránh rò rỉ bộ nhớ
  }, []);

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login'; // tải lại toàn bộ trang, xóa sạch mọi state cũ (kể cả chatbot)
};

  const linkStyle = { color: 'var(--text)', fontWeight: 500, fontSize: 14 };

  return (
    <nav style={{
      padding: '14px 32px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      gap: 24,
      alignItems: 'center',
      background: 'var(--surface)'
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>🛍️ ShopSmart</Link>
      <Link to="/products" style={linkStyle}>Sản phẩm</Link>
      {user?.role === 'seller' && <Link to="/add-product" style={linkStyle}>Đăng bán</Link>}
      {user?.role === 'seller' && (
        <Link to="/seller-orders" style={{ ...linkStyle, position: 'relative' }}>
          Đơn hàng cửa hàng
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute', top: -8, right: -16,
              background: 'var(--danger)', color: 'white',
              borderRadius: '50%', fontSize: 11, padding: '1px 6px'
            }}>
              {pendingCount}
            </span>
          )}
        </Link>
      )}
      {user?.role === 'buyer' && <Link to="/cart" style={linkStyle}>Giỏ hàng</Link>}
      {user?.role === 'buyer' && <Link to="/orders" style={linkStyle}>Đơn hàng của tôi</Link>}
      {user?.role === 'admin' && <Link to="/admin" style={linkStyle}>Quản trị</Link>}
      {user && <Link to="/messages" style={linkStyle}>Tin nhắn</Link>}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <Link to="/profile" style={linkStyle}>Hồ sơ</Link>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {user.name} <span style={{ color: 'var(--primary)' }}>({user.role})</span>
            </span>
            <button onClick={handleLogout} style={{ background: 'var(--surface-hover)', color: 'var(--text)' }}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Đăng nhập</Link>
            <button onClick={() => navigate('/register')}>Đăng ký</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;