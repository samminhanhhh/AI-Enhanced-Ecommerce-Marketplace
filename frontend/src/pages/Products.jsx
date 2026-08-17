import { useState, useEffect } from 'react';
import api from '../api/axios';

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Hàm gọi API lấy danh sách sản phẩm
  const fetchProducts = async (searchTerm = '') => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: searchTerm ? { search: searchTerm } : {}
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // useEffect: chạy 1 lần khi trang vừa load xong
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 20px' }}>
      <h2>Danh sách sản phẩm</h2>

      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
        <button type="submit" style={{ padding: 8, marginLeft: 10 }}>Tìm</button>
      </form>

      {loading && <p>Đang tải...</p>}
      {!loading && products.length === 0 && <p>Không có sản phẩm nào.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: '1px solid #444', borderRadius: 8, padding: 12 }}>
  {p.primary_image ? (
    <img
      src={`http://localhost:5000${p.primary_image}`}
      alt={p.name}
      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 4 }}
    />
  ) : (
    <div style={{ width: '100%', height: 160, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
      <span style={{ color: '#888', fontSize: 13 }}>Chưa có ảnh</span>
    </div>
  )}
  <h4>{p.name}</h4>
  <p style={{ fontSize: 14, color: '#aaa' }}>{p.category_name}</p>
  <p style={{ fontWeight: 'bold' }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
  <p style={{ fontSize: 13 }}>Còn lại: {p.stock}</p>
  <p style={{ fontSize: 13 }}>Người bán: {p.seller_name}</p>
</div>
        ))}
      </div>
    </div>
  );
}

export default Products;