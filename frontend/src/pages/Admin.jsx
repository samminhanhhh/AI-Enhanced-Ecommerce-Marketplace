import { useState, useEffect } from 'react';
import api from '../api/axios';

function Admin() {
  const [tab, setTab] = useState('users');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [users, setUsers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchUsers = () => api.get('/admin/users').then((res) => setUsers(res.data));
  const fetchCategories = () => api.get('/categories').then((res) => setCategories(res.data));
  const fetchPendingProducts = () => api.get('/admin/products/pending').then((res) => setPendingProducts(res.data));
  const fetchOrders = () => api.get('/admin/orders').then((res) => setOrders(res.data));

  useEffect(() => {
    fetchUsers();
    fetchPendingProducts();
    fetchOrders();
    fetchCategories();
  }, []);

  const handleToggleUser = async (id) => {
    await api.put(`/admin/users/${id}/toggle-status`);
    fetchUsers();
  };

  const handleReviewProduct = async (id, status) => {
    await api.put(`/admin/products/${id}/review`, { status });
    fetchPendingProducts();
  };

  const handleUpdateOrderStatus = async (id, shipping_status) => {
    await api.put(`/orders/${id}/status`, { shipping_status });
    fetchOrders();
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    await api.post('/categories', newCategory);
    setNewCategory({ name: '', description: '' });
    fetchCategories();
  };

  const tabButtonStyle = (t) => ({
    padding: '9px 18px',
    marginRight: 8,
    borderRadius: 999,
    background: tab === t ? 'var(--ai)' : 'var(--surface)',
    color: tab === t ? 'white' : 'var(--text)',
    border: `1.5px solid ${tab === t ? 'var(--ai)' : 'var(--border)'}`,
    boxShadow: tab === t ? '0 4px 14px rgba(155, 126, 240, 0.3)' : 'none',
    fontSize: 13
  });

  const thStyle = { padding: '10px 8px', fontSize: 13, color: 'var(--text-muted)' };
  const tdStyle = { padding: '10px 8px', fontSize: 14 };

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 20px' }}>
      <h2>Trang quản trị</h2>

      <div style={{ marginBottom: 24 }}>
        <button style={tabButtonStyle('users')} onClick={() => setTab('users')}>Người dùng</button>
        <button style={tabButtonStyle('products')} onClick={() => setTab('products')}>Sản phẩm chờ duyệt ({pendingProducts.length})</button>
        <button style={tabButtonStyle('orders')} onClick={() => setTab('orders')}>Đơn hàng</button>
        <button style={tabButtonStyle('categories')} onClick={() => setTab('categories')}>Danh mục</button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--border)' }}>
                <th style={thStyle}>Tên</th><th style={thStyle}>Email</th><th style={thStyle}>Vai trò</th><th style={thStyle}>Trạng thái</th><th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>{u.name}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}><span className="badge-ai">{u.role}</span></td>
                  <td style={tdStyle}>{u.is_active ? '🟢 Hoạt động' : '⛔ Đã khóa'}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleToggleUser(u.id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                      {u.is_active ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <div>
          {pendingProducts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Không có sản phẩm nào chờ duyệt.</p>}
          {pendingProducts.map((p) => (
            <div key={p.id} className="card" style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 700 }}>{p.name}</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{p.description}</p>
              <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{Number(p.price).toLocaleString('vi-VN')}đ — Người bán: {p.seller_name}</p>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handleReviewProduct(p.id, 'active')} style={{ marginRight: 8 }}>✓ Duyệt</button>
                <button onClick={() => handleReviewProduct(p.id, 'inactive')} className="btn-secondary">✕ Từ chối</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--border)' }}>
                <th style={thStyle}>Mã đơn</th><th style={thStyle}>Khách hàng</th><th style={thStyle}>Tổng tiền</th><th style={thStyle}>Trạng thái</th><th style={thStyle}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>#{o.id}</td>
                  <td style={tdStyle}>{o.customer_name}</td>
                  <td style={tdStyle}>{Number(o.total_amount).toLocaleString('vi-VN')}đ</td>
                  <td style={tdStyle}>{o.shipping_status}</td>
                  <td style={tdStyle}>
                    <select value={o.shipping_status} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}>
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipping">Đang giao</option>
                      <option value="delivered">Đã giao</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <form onSubmit={handleCreateCategory} className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Thêm danh mục mới</p>
            <input
              placeholder="Tên danh mục"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              style={{ marginRight: 8, marginBottom: 8 }}
            />
            <input
              placeholder="Mô tả (không bắt buộc)"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              style={{ marginRight: 8, marginBottom: 8 }}
            />
            <button type="submit">Thêm danh mục</button>
          </form>

          {categories.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 10 }}>
              <p style={{ fontWeight: 700 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;