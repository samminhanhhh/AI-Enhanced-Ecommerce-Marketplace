import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';

function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [cartTotal, setCartTotal] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data.address) setAddress(res.data.address);
    });
    // Lấy tổng tiền giỏ hàng để hiện trên mã QR (mô phỏng số tiền cần chuyển)
    api.get('/cart').then((res) => {
  const selectedIds = JSON.parse(localStorage.getItem('selected_cart_items') || '[]');
  const total = res.data.items
    .filter((item) => selectedIds.includes(item.cart_item_id))
    .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  setCartTotal(total);
});
  }, []);

  // Mỗi khi đổi phương thức thanh toán, ẩn QR cũ đi (nếu có), người dùng cần bấm lại nút xác nhận
  const handlePaymentChange = (value) => {
    setPaymentMethod(value);
    setShowQR(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Nếu chọn chuyển khoản/momo và CHƯA hiện QR -> hiện QR trước, chưa tạo đơn vội
    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'momo') && !showQR) {
      setShowQR(true);
      return;
    }

    setSubmitting(true);
    try {
      const selectedIds = JSON.parse(localStorage.getItem('selected_cart_items') || '[]');
const res = await api.post('/orders', {
  payment_method: paymentMethod,
  shipping_address: address,
  selected_item_ids: selectedIds
});
      alert(`Đặt hàng thành công! Mã đơn hàng: #${res.data.orderId}`);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
    setSubmitting(false);
  };

  // Nội dung mã hóa vào QR - mô phỏng cú pháp chuyển khoản thực tế
  const qrValue = `THANHTOAN|SoTien:${cartTotal}|NoiDung:DonHang${Date.now()}|PhuongThuc:${paymentMethod === 'momo' ? 'Momo' : 'ChuyenKhoan'}`;

  return (
    <div style={{ maxWidth: 450, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đặt hàng</h2>
      <form onSubmit={handleSubmit}>
        <label>Địa chỉ giao hàng:</label><br />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          style={{ width: '100%' }}
          required
        /><br /><br />

        <label>Phương thức thanh toán:</label><br />
        <label><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => handlePaymentChange(e.target.value)} /> Thanh toán tiền mặt (COD)</label><br />
        <label><input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => handlePaymentChange(e.target.value)} /> Chuyển khoản ngân hàng</label><br />
        <label><input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={(e) => handlePaymentChange(e.target.value)} /> Ví Momo</label><br /><br />

        {showQR && (paymentMethod === 'bank_transfer' || paymentMethod === 'momo') && (
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>
              Quét mã để {paymentMethod === 'momo' ? 'thanh toán qua Momo' : 'chuyển khoản'}
            </p>
            <div style={{ background: 'white', padding: 16, display: 'inline-block', borderRadius: 8 }}>
              <QRCodeSVG value={qrValue} size={180} />
            </div>
            <p style={{ marginTop: 10, fontSize: 14 }}>Số tiền: <strong>{cartTotal.toLocaleString('vi-VN')}đ</strong></p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              (Đây là mã QR mô phỏng phục vụ demo đồ án, không phải cổng thanh toán thật)
            </p>
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 20px' }} disabled={submitting}>
          {submitting
            ? 'Đang xử lý...'
            : showQR
              ? 'Tôi đã thanh toán, xác nhận đơn hàng'
              : (paymentMethod === 'cod' ? 'Xác nhận đặt hàng' : 'Tạo mã QR thanh toán')}
        </button>
      </form>
    </div>
  );
}

export default Checkout;