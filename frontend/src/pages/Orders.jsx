import { useState, useEffect } from 'react';
import api from '../api/axios';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Chờ lấy hàng',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  return_requested: 'Đang yêu cầu trả hàng',
  returned: 'Đã trả hàng',
  cancelled: 'Đã hủy'
};

const paymentLabels = { cod: 'Tiền mặt (COD)', bank_transfer: 'Chuyển khoản', momo: 'Momo' };

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Chờ lấy hàng' },
  { key: 'shipping', label: 'Chờ giao hàng' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'return_requested', label: 'Trả hàng' },
  { key: 'cancelled', label: 'Đã hủy' }
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [returnReason, setReturnReason] = useState({});
  const [returnData, setReturnData] = useState({});

  const fetchOrders = () => {
    api.get('/orders').then((res) => setOrders(res.data));
  };

  useEffect(() => {
    fetchOrders();
    setLoading(false);
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Hủy đơn hàng này?')) return;
    await api.put(`/orders/${id}/cancel`);
    fetchOrders();
  };

  const handleRequestReturn = async (id) => {
  const data = returnData[id];
  if (!data?.reason) { alert('Vui lòng chọn lý do trả hàng'); return; }

  const formData = new FormData();
  formData.append('reason', data.reason);
  if (data.image) formData.append('image', data.image);

  await api.put(`/orders/${id}/request-return`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  fetchOrders();
};

  const filteredOrders = activeTab === 'all' ? orders : orders.filter((o) => o.shipping_status === activeTab);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 750, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đơn hàng của tôi</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? '' : 'btn-secondary'}
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Không có đơn hàng nào.</p>}

      {filteredOrders.map((order) => (
        <div key={order.id} className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700 }}>Đơn hàng #{order.id}</p>
          <p>Tổng tiền: {Number(order.total_amount).toLocaleString('vi-VN')}đ</p>
          <p>Thanh toán: {paymentLabels[order.payment_method]}</p>
          <p>Trạng thái: <span className="badge-ai">{statusLabels[order.shipping_status]}</span></p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
          </p>

          {order.shipping_status === 'pending' && (
            <button onClick={() => handleCancel(order.id)} className="btn-secondary" style={{ marginTop: 8 }}>
              Hủy đơn
            </button>
          )}

          {order.shipping_status === 'delivered' && (
  <div style={{ marginTop: 10 }}>
    <select
      value={returnData[order.id]?.reason || ''}
      onChange={(e) => setReturnData({ ...returnData, [order.id]: { ...returnData[order.id], reason: e.target.value } })}
      style={{ marginRight: 8, marginBottom: 8 }}
    >
      <option value="">-- Chọn lý do trả hàng --</option>
      <option value="Hàng lỗi/hỏng">Hàng lỗi/hỏng</option>
      <option value="Sai mẫu mã">Sai mẫu mã (size, màu...)</option>
      <option value="Vỡ/bể trong quá trình vận chuyển">Vỡ/bể trong quá trình vận chuyển</option>
      <option value="Không đúng mô tả">Không đúng mô tả sản phẩm</option>
      <option value="Khác">Lý do khác</option>
    </select>
    <br />
    <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ảnh bằng chứng (không bắt buộc): </label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setReturnData({ ...returnData, [order.id]: { ...returnData[order.id], image: e.target.files[0] } })}
    />
    <br />
    <button onClick={() => handleRequestReturn(order.id)} className="btn-secondary" style={{ marginTop: 8 }}>
      Gửi yêu cầu trả hàng
    </button>
  </div>
)}

          {order.shipping_status === 'return_requested' && (
  <div style={{ marginTop: 6 }}>
    <p style={{ fontSize: 13, color: 'var(--warning)' }}>Lý do trả hàng: {order.return_reason}</p>
    {order.return_image_url && (
      <img src={`http://localhost:5000${order.return_image_url}`} alt="Bằng chứng" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 6 }} />
    )}
  </div>
)}
        </div>
      ))}
    </div>
  );
}

export default Orders;