import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/items/${cartItemId}`, { quantity: newQty });
      fetchCart(); // tải lại giỏ hàng để cập nhật giao diện
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      await api.delete(`/cart/items/${cartItemId}`);
      fetchCart();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  // Tính tổng tiền từ danh sách items hiện có
  const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', padding: '0 20px' }}>
      <h2>Giỏ hàng của tôi</h2>

      {items.length === 0 && <p>Giỏ hàng đang trống.</p>}

      {items.map((item) => (
        <div key={item.cart_item_id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #444', padding: '12px 0' }}>
          {item.image ? (
            <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 4 }} />
          ) : (
            <div style={{ width: 70, height: 70, background: '#333', borderRadius: 4 }} />
          )}

          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold' }}>{item.name}</p>
            <p>{Number(item.price).toLocaleString('vi-VN')}đ</p>
          </div>

          <div>
            <button onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}>-</button>
            <span style={{ margin: '0 10px' }}>{item.quantity}</span>
            <button onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}>+</button>
          </div>

          <button onClick={() => handleRemove(item.cart_item_id)} style={{ color: 'red' }}>Xóa</button>
        </div>
      ))}

      {items.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <p style={{ fontSize: 18, fontWeight: 'bold' }}>
            Tổng cộng: {totalAmount.toLocaleString('vi-VN')}đ
          </p>
          <button onClick={() => navigate('/checkout')} style={{ padding: '10px 20px', fontSize: 16 }}>
            Tiến hành đặt hàng
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;