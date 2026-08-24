import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ReviewForm from '../components/ReviewForm';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState('');

  const fetchReviews = () => {
    api.get(`/reviews/product/${id}`).then((res) => setReviews(res.data));
  };

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
    api.get(`/products/${id}/similar`).then((res) => setSimilar(res.data)).catch(() => setSimilar([]));
    fetchReviews();
    api.get(`/products/${id}/variants`).then((res) => setVariants(res.data));
  }, [id]);

  const handleAddToCart = async () => {
  if (!user) {
    alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
    return;
  }
  if (variants.length > 0 && !selectedVariant) {
    alert('Vui lòng chọn phân loại sản phẩm');
    return;
  }
  try {
    await api.post('/cart/items', {
      product_id: id,
      variant_id: selectedVariant || undefined,
      quantity: 1
    });
    alert('Đã thêm vào giỏ hàng!');
  } catch (err) {
    alert(err.response?.data?.message || 'Có lỗi xảy ra');
  }
};

  if (!product) return <p style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      <div className="card" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {product.primary_image ? (
          <img src={`http://localhost:5000${product.primary_image}`} alt={product.name} style={{ width: 320, height: 320, objectFit: 'cover', borderRadius: 16 }} />
        ) : (
          <div style={{ width: 320, height: 320, background: 'var(--surface-hover)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Chưa có ảnh</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: 0 }}>{product.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            {product.category_name} — Người bán:{' '}
            <span onClick={() => navigate(`/shop/${product.seller_id}`)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
              {product.seller_name}
            </span>
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 10 }}>
            {Number(product.price).toLocaleString('vi-VN')}đ
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Còn lại: {product.stock}</p>
          <p style={{ marginTop: 14, lineHeight: 1.6 }}>{product.description}</p>
          {variants.length > 0 && (
  <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} style={{ marginBottom: 10, width: '100%' }}>
    <option value="">-- Chọn phân loại --</option>
    {variants.map((v) => (
      <option key={v.id} value={v.id}>
        {v.variant_name} {v.price_extra > 0 ? `(+${Number(v.price_extra).toLocaleString('vi-VN')}đ)` : ''}
      </option>
    ))}
  </select>
)}
          {(!user || user.role === 'buyer') && (
            <button onClick={handleAddToCart} style={{ marginTop: 14, padding: '13px 28px' }}>Thêm vào giỏ</button>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <h3>✨ <span style={{ color: 'var(--ai)' }}>Sản phẩm tương tự</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {similar.map((p) => (
              <div key={p.id} onClick={() => navigate(`/products/${p.id}`)} className="card" style={{ cursor: 'pointer' }}>
                {p.primary_image ? (
                  <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 12 }} />
                ) : (
                  <div style={{ width: '100%', height: 130, background: 'var(--surface-hover)', borderRadius: 12 }} />
                )}
                <p style={{ fontSize: 14, marginTop: 8, fontWeight: 600 }}>{p.name}</p>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 44 }}>
        <h3>Đánh giá ({reviews.length})</h3>

        {user?.role === 'buyer' && <ReviewForm productId={id} onReviewAdded={fetchReviews} />}

        {reviews.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có đánh giá nào.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: 12 }}>
            <p style={{ fontWeight: 700 }}>{r.user_name} — <span style={{ color: 'var(--warning)' }}>{'★'.repeat(r.rating)}</span></p>
            <p style={{ marginTop: 4 }}>{r.comment}</p>
            {r.image_url && (
              <img src={`http://localhost:5000${r.image_url}`} alt="Ảnh đánh giá" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, marginTop: 8 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetail;