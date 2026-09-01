import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
  if (!user) return;

  const fetchCount = () => {
    const endpoint = user.role === 'seller' ? '/orders/seller/pending-count' : user.role === 'buyer' ? '/orders/buyer/unseen-count' : null;
    if (!endpoint) return;
    api.get(endpoint).then((res) => setPendingCount(res.data.count)).catch(() => {});
  };

  fetchCount();
  const interval = setInterval(fetchCount, 15000); // 15s cho cảm giác gần real-time hơn
  return () => clearInterval(interval);
}, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav style={{
      padding: '16px 32px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      gap: 28,
      alignItems: 'center',
      background: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: 17,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  lineHeight: 1
}}>
  <span style={{ fontSize: 28 }}>🍉</span>
  <span style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    <span style={{ color: 'var(--ai)' }}>SHOP</span>
    <span style={{ color: 'var(--primary)' }}>SHOP</span>
  </span>
</Link>
      <Link to="/products" className="nav-link">Sản phẩm</Link>
      {user?.role === 'seller' && <Link to="/add-product" className="nav-link">Đăng bán</Link>}
      {user?.role === 'seller' && <Link to="/my-products" className="nav-link">Sản phẩm của tôi</Link>}
      {user?.role === 'seller' && (
        <Link to="/seller-orders" className="nav-link" style={{ position: 'relative' }}>
          Đơn hàng cửa hàng
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: -18,
              background: 'var(--danger)', color: 'white',
              borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px'
            }}>
              {pendingCount}
            </span>
          )}
        </Link>
      )}
      {user?.role === 'buyer' && <Link to="/cart" className="nav-link">Giỏ hàng</Link>}
      {user?.role === 'buyer' && (
  <Link to="/orders" className="nav-link" style={{ position: 'relative' }}>
    Đơn hàng của tôi
    {pendingCount > 0 && (
      <span style={{
        position: 'absolute', top: -8, right: -18,
        background: 'var(--danger)', color: 'white',
        borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px'
      }}>
        {pendingCount}
      </span>
    )}
  </Link>
)}
      {user?.role === 'admin' && <Link to="/admin" className="nav-link">Quản trị</Link>}
      {user && <Link to="/messages" className="nav-link">Tin nhắn</Link>}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        {user ? (
          <>
            <Link to="/profile" className="nav-link">Hồ sơ</Link>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {user.name} <span className="badge-ai">{user.role}</span>
            </span>
            <button onClick={handleLogout} className="btn-secondary">Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Đăng nhập</Link>
            <button onClick={() => navigate('/register')}>Đăng ký</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;