import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/products').then((res) => setFeaturedProducts(res.data.slice(0, 8)));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* HERO - dải hologram + tiêu đề to + thanh tìm kiếm lớn */}
      <div className="holo-bg" style={{ padding: '72px 24px 64px', textAlign: 'center' }}>
  <h1 style={{
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 72,
    margin: 0,
    color: 'white',
    textShadow: '0 4px 20px rgba(0,0,0,0.15)',
    letterSpacing: 1
  }}>
    🍉SHOPSHOP🍉
  </h1>
  <p style={{ fontSize: 16, marginTop: 12, color: 'white', fontWeight: 600, opacity: 0.95 }}>
    ✨ Tìm điều bạn cần — Mua điều bạn thích ✨
  </p>

  <form onSubmit={handleSearch} style={{ maxWidth: 640, margin: '36px auto 0', display: 'flex', gap: 10 }}>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="VD: áo giữ ấm đi biển, balo chống nước cho laptop..."
      style={{ flex: 1, padding: '17px 22px', fontSize: 15, borderRadius: 999, border: 'none' }}
    />
    <button type="submit" className="btn-ai" style={{ padding: '0 30px', fontSize: 15, borderRadius: 999 }}>
      🔍 Tìm
    </button>
  </form>
</div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        {/* Danh mục */}
        <h3 style={{ marginBottom: 16 }}>Danh mục sản phẩm</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginBottom: 48 }}>
          {categories.map((c, i) => (
            <div
              key={c.id}
              onClick={() => navigate(`/products?category=${c.id}`)}
              className="card"
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 30 }}>{c.icon || '📦'}</div>
              <p style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>{c.name}</p>
            </div>
          ))}
        </div>

        {/* Gợi ý sản phẩm */}
        <h3 style={{ marginBottom: 16 }}>✨ Sản phẩm gợi ý cho bạn</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {featuredProducts.map((p) => (
            <div key={p.id} className="card" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>
              {p.primary_image ? (
                <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: 'var(--surface-hover)', borderRadius: 12 }} />
              )}
              <p style={{ fontSize: 14, marginTop: 10, fontWeight: 600 }}>{p.name}</p>
              <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;