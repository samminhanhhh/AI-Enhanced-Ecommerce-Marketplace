import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setSelectedIds(res.data.items.map((i) => i.cart_item_id));
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
      fetchCart();
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCheckout = () => {
    localStorage.setItem('selected_cart_items', JSON.stringify(selectedIds));
    navigate('/checkout');
  };

  // Chỉ tính tổng tiền của các sản phẩm ĐÃ TICK
  const totalAmount = items
    .filter((item) => selectedIds.includes(item.cart_item_id))
    .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 700, margin: '30px auto', padding: '0 20px' }}>
      <h2>Giỏ hàng của tôi</h2>

      {items.length === 0 && <p>Giỏ hàng đang trống.</p>}

      {items.map((item) => (
        <div key={item.cart_item_id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #444', padding: '12px 0' }}>
          <input
            type="checkbox"
            checked={selectedIds.includes(item.cart_item_id)}
            onChange={() => toggleSelect(item.cart_item_id)}
          />

          {item.image ? (
            <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 4 }} />
          ) : (
            <div style={{ width: 70, height: 70, background: '#333', borderRadius: 4 }} />
          )}

          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold' }}>
              {item.name} {item.variant_name && <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)' }}>({item.variant_name})</span>}
            </p>
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
          <button
            disabled={selectedIds.length === 0}
            onClick={handleCheckout}
            style={{ padding: '10px 20px', fontSize: 16 }}
          >
            Tiến hành đặt hàng ({selectedIds.length} sản phẩm)
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;