import { useState, useEffect } from 'react';
import api from '../api/axios';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  return_requested: 'Yêu cầu trả hàng',
  returned: 'Đã trả hàng',
  cancelled: 'Đã hủy'
};

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Cần xác nhận' },
  { key: 'return_requested', label: '🔔 Yêu cầu trả hàng' }
];

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = () => {
  api.get('/orders/seller')
    .then((res) => setOrders(res.data))
    .catch((err) => {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi tải đơn hàng cửa hàng');
    });
};


  useEffect(() => {
    fetchOrders();
    setLoading(false);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { shipping_status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleReviewReturn = async (orderId, approved) => {
    try {
      await api.put(`/orders/${orderId}/review-return`, { approved });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu trả hàng');
    }
  };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter((o) => o.shipping_status === activeTab);
  const returnCount = orders.filter((o) => o.shipping_status === 'return_requested').length;

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đơn hàng cửa hàng</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? '' : 'btn-secondary'}
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            {t.label}{t.key === 'return_requested' && returnCount > 0 ? ` (${returnCount})` : ''}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Không có đơn hàng nào trong mục này.</p>}

      {filteredOrders.map((o) => (
        <div key={o.id} className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700 }}>Đơn #{o.id} — Khách hàng: {o.customer_name} ({o.customer_phone || 'chưa có SĐT'})</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Địa chỉ: {o.shipping_address}</p>

          <div style={{ margin: '8px 0' }}>
            {o.items.map((item, i) => (
              <p key={i} style={{ fontSize: 14 }}>
                {item.name} × {item.quantity} — {Number(item.price_at_purchase).toLocaleString('vi-VN')}đ
              </p>
            ))}
          </div>

          {o.shipping_status === 'return_requested' ? (
            <div style={{ marginTop: 10, background: 'var(--ai-light)', padding: 12, borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ai)' }}>Lý do trả hàng: {o.return_reason}</p>
              {o.return_image_url && (
                <img src={`http://localhost:5000${o.return_image_url}`} alt="Bằng chứng" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 6, marginBottom: 8 }} />
              )}
              <div>
                <button onClick={() => handleReviewReturn(o.id, true)} style={{ marginRight: 8 }}>✓ Chấp nhận & Hoàn tiền</button>
                <button onClick={() => handleReviewReturn(o.id, false)} className="btn-secondary">✕ Từ chối</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13 }}>Trạng thái:</span>
              <select value={o.shipping_status} onChange={(e) => handleUpdateStatus(o.id, e.target.value)}>
                {Object.entries(statusLabels)
                  .filter(([key]) => !['return_requested', 'returned'].includes(key))
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SellerOrders;