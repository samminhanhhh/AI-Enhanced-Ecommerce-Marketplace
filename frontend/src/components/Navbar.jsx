import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={{ padding: 16, borderBottom: '1px solid #444', display: 'flex', gap: 16, alignItems: 'center' }}>
      <Link to="/">Trang chủ</Link>
      <Link to="/products">Sản phẩm</Link>
      {user?.role === 'seller' && <Link to="/add-product">Đăng bán</Link>}

      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: 10 }}>Xin chào, {user.name} ({user.role})</span>
            <button onClick={handleLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: 10 }}>Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;