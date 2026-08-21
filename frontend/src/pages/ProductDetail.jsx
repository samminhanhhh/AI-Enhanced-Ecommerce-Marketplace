import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function ProductDetail() {
  const { id } = useParams(); // lấy :id từ URL
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
    api.get(`/products/${id}/similar`).then((res) => setSimilar(res.data)).catch(() => setSimilar([]));
    api.get(`/reviews/product/${id}`).then((res) => setReviews(res.data));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    try {
      await api.post('/cart/items', { product_id: id, quantity: 1 });
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (!product) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {product.primary_image ? (
  <img
    src={`http://localhost:5000${product.primary_image}`}
    alt={product.name}
    style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 8 }}
  />
) : (
  <div style={{ width: 300, height: 300, background: '#333', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#888' }}>Chưa có ảnh</span>
  </div>
)}
        <div>
          <h2>{product.name}</h2>
          <p style={{ color: '#aaa' }}>{product.category_name} — Người bán: {product.seller_name}</p>
          <p style={{ fontSize: 22, fontWeight: 'bold' }}>{Number(product.price).toLocaleString('vi-VN')}đ</p>
          <p>Còn lại: {product.stock}</p>
          <p style={{ marginTop: 12 }}>{product.description}</p>
          {(!user || user.role === 'buyer') && (
            <button onClick={handleAddToCart} style={{ padding: '10px 24px', marginTop: 12 }}>Thêm vào giỏ</button>
          )}
        </div>
      </div>

      {/* Sản phẩm tương tự - dùng lại hạ tầng AI đã có */}
      {similar.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>Sản phẩm tương tự</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {similar.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                style={{ border: '1px solid #444', borderRadius: 8, padding: 10, cursor: 'pointer' }}
              >
                {p.primary_image ? (
                  <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <div style={{ width: '100%', height: 120, background: '#333', borderRadius: 4 }} />
                )}
                <p style={{ fontSize: 14, marginTop: 6 }}>{p.name}</p>
                <p style={{ fontWeight: 'bold', fontSize: 14 }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Đánh giá */}
      <div style={{ marginTop: 40 }}>
        <h3>Đánh giá ({reviews.length})</h3>
        {reviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
        {reviews.map((r) => (
          <div key={r.id} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
            <p style={{ fontWeight: 'bold' }}>{r.user_name} — {'⭐'.repeat(r.rating)}</p>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetail;