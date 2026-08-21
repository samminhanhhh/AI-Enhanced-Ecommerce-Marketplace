import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function ShopProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    api.get(`/users/${id}/shop`).then((res) => setShop(res.data)).catch(() => setShop(null));
  }, [id]);

  if (!shop) return <p style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '30px auto', padding: '0 20px' }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>🏪 {shop.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          Tham gia từ: {new Date(shop.created_at).toLocaleDateString('vi-VN')}
        </p>
        {shop.phone && <p style={{ fontSize: 14 }}>📞 Liên hệ: {shop.phone}</p>}
        {shop.address && <p style={{ fontSize: 14 }}>📍 Địa chỉ: {shop.address}</p>}
      </div>

      <h3>Sản phẩm đang bán ({shop.products.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {shop.products.map((p) => (
          <div key={p.id} className="card" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
            {p.primary_image ? (
              <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div style={{ width: '100%', height: 120, background: 'var(--surface-hover)', borderRadius: 4 }} />
            )}
            <p style={{ fontSize: 14, marginTop: 6 }}>{p.name}</p>
            <p style={{ fontWeight: 'bold', fontSize: 14 }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShopProfile;