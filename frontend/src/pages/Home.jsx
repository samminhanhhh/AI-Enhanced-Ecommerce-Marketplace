import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/products').then((res) => setFeaturedProducts(res.data.slice(0, 8))); // 8 sản phẩm mới nhất
  }, []);

  const categoryIcons = ['👕', '📱', '🏠', '👗', '👟', '🎒', '💄', '📚'];

  return (
    <div>
      {/* Banner chào mừng */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
        padding: '48px 32px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{ fontSize: 32, margin: 0 }}>🛍️ ShopSmart</h1>
        <p style={{ fontSize: 16, marginTop: 8, opacity: 0.9 }}>
          Mua sắm thông minh — Tìm đúng sản phẩm bạn cần bằng AI
        </p>
        <button
          onClick={() => navigate('/products')}
          style={{ marginTop: 16, background: 'white', color: 'var(--primary)', padding: '12px 28px', fontSize: 15 }}
        >
          Khám phá ngay
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        {/* Danh mục nổi bật */}
        <h3 style={{ marginBottom: 16 }}>Danh mục sản phẩm</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 40 }}>
          {categories.map((c, i) => (
            <div
              key={c.id}
              onClick={() => navigate(`/products?category=${c.id}`)}
              className="card"
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 28 }}>{categoryIcons[i % categoryIcons.length]}</div>
              <p style={{ fontSize: 13, marginTop: 6 }}>{c.name}</p>
            </div>
          ))}
        </div>

        {/* Sản phẩm nổi bật */}
        <h3 style={{ marginBottom: 16 }}>Sản phẩm mới nhất</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {featuredProducts.map((p) => (
            <div key={p.id} className="card" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
              {p.primary_image ? (
                <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <div style={{ width: '100%', height: 130, background: 'var(--surface-hover)', borderRadius: 4 }} />
              )}
              <p style={{ fontSize: 14, marginTop: 6 }}>{p.name}</p>
              <p style={{ fontWeight: 'bold', fontSize: 14 }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;