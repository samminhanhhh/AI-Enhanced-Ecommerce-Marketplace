import { useState, useEffect } from 'react';
import api from '../api/axios';

function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchUsers = () => api.get('/admin/users').then((res) => setUsers(res.data));
  const fetchPendingProducts = () => api.get('/admin/products/pending').then((res) => setPendingProducts(res.data));
  const fetchOrders = () => api.get('/admin/orders').then((res) => setOrders(res.data));

  useEffect(() => {
    fetchUsers();
    fetchPendingProducts();
    fetchOrders();
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

  const tabButtonStyle = (t) => ({
    padding: '8px 16px',
    marginRight: 8,
    background: tab === t ? '#555' : 'transparent',
    border: '1px solid #666',
    cursor: 'pointer'
  });

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 20px' }}>
      <h2>Trang quản trị</h2>

      <div style={{ marginBottom: 20 }}>
        <button style={tabButtonStyle('users')} onClick={() => setTab('users')}>Người dùng</button>
        <button style={tabButtonStyle('products')} onClick={() => setTab('products')}>Sản phẩm chờ duyệt ({pendingProducts.length})</button>
        <button style={tabButtonStyle('orders')} onClick={() => setTab('orders')}>Đơn hàng</button>
      </div>

      {tab === 'users' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
              <th>Tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Hoạt động' : 'Đã khóa'}</td>
                <td>
                  <button onClick={() => handleToggleUser(u.id)}>
                    {u.is_active ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'products' && (
        <div>
          {pendingProducts.length === 0 && <p>Không có sản phẩm nào chờ duyệt.</p>}
          {pendingProducts.map((p) => (
            <div key={p.id} style={{ border: '1px solid #444', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <p style={{ fontWeight: 'bold' }}>{p.name}</p>
              <p style={{ fontSize: 14 }}>{p.description}</p>
              <p>{Number(p.price).toLocaleString('vi-VN')}đ — Người bán: {p.seller_name}</p>
              <button onClick={() => handleReviewProduct(p.id, 'active')} style={{ marginRight: 8 }}>Duyệt</button>
              <button onClick={() => handleReviewProduct(p.id, 'inactive')}>Từ chối</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
              <th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #333' }}>
                <td>#{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{Number(o.total_amount).toLocaleString('vi-VN')}đ</td>
                <td>{o.shipping_status}</td>
                <td>
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
      )}
    </div>
  );
}

export default Admin;