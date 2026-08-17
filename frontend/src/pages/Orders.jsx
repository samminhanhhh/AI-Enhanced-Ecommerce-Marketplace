import { useState, useEffect } from 'react';
import api from '../api/axios';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy'
};

const paymentLabels = {
  cod: 'Tiền mặt (COD)',
  bank_transfer: 'Chuyển khoản',
  momo: 'Momo'
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đơn hàng của tôi</h2>

      {orders.length === 0 && <p>Bạn chưa có đơn hàng nào.</p>}

      {orders.map((order) => (
        <div key={order.id} style={{ border: '1px solid #444', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <p style={{ fontWeight: 'bold' }}>Đơn hàng #{order.id}</p>
          <p>Tổng tiền: {Number(order.total_amount).toLocaleString('vi-VN')}đ</p>
          <p>Thanh toán: {paymentLabels[order.payment_method]}</p>
          <p>Trạng thái: <strong>{statusLabels[order.shipping_status]}</strong></p>
          <p style={{ fontSize: 13, color: '#aaa' }}>
            Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Orders;