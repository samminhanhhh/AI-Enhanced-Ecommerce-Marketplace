import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/me').then((res) => {
      if (res.data.address) setAddress(res.data.address);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/orders', {
        payment_method: paymentMethod,
        shipping_address: address
      });
      alert(`Đặt hàng thành công! Mã đơn hàng: #${res.data.orderId}`);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: '30px auto' }}>
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
        <label><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} /> Thanh toán tiền mặt (COD)</label><br />
        <label><input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value)} /> Chuyển khoản ngân hàng</label><br />
        <label><input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={(e) => setPaymentMethod(e.target.value)} /> Ví Momo</label><br /><br />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 20px' }}>Xác nhận đặt hàng</button>
      </form>
    </div>
  );
}

export default Checkout;