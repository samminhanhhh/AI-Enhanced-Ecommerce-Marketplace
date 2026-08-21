import { useState, useEffect } from 'react';
import api from '../api/axios';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/orders/seller').then((res) => setOrders(res.data));
  };

  useEffect(() => {
    fetchOrders();
    setLoading(false);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    await api.put(`/orders/${orderId}/status`, { shipping_status: newStatus });
    fetchOrders();
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đơn hàng cửa hàng</h2>

      {orders.length === 0 && <p>Chưa có đơn hàng nào chứa sản phẩm của bạn.</p>}

      {orders.map((o) => (
        <div key={o.id} className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 600 }}>Đơn #{o.id} — Khách hàng: {o.customer_name} ({o.customer_phone || 'chưa có SĐT'})</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Địa chỉ: {o.shipping_address}</p>

          <div style={{ margin: '8px 0' }}>
            {o.items.map((item, i) => (
              <p key={i} style={{ fontSize: 14 }}>
                {item.name} × {item.quantity} — {Number(item.price_at_purchase).toLocaleString('vi-VN')}đ
              </p>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>Trạng thái:</span>
            <select value={o.shipping_status} onChange={(e) => handleUpdateStatus(o.id, e.target.value)}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SellerOrders;