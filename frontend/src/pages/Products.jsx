import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

function Products() {
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [noExactMatch, setNoExactMatch] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const urlQuery = searchParams.get('q');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchAllProducts = async () => {
    setLoading(true);
    setNoExactMatch(false);
    setIsSearchMode(false);
    try {
      const res = await api.get('/products', {
        params: categoryFilter ? { category_id: categoryFilter } : {}
      });
      setAllProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchSemanticSearch = async (query) => {
    setLoading(true);
    setIsSearchMode(true);
    try {
      const res = await api.get('/products/search/semantic', { params: { q: query } });
      setAllProducts(res.data.results);
      setNoExactMatch(!res.data.exactMatch);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (urlQuery) {
      setSearch(urlQuery);
      fetchSemanticSearch(urlQuery);
    } else {
      fetchAllProducts();
    }
  }, [categoryFilter, urlQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchAllProducts();
      return;
    }
    fetchSemanticSearch(search);
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    try {
      await api.post('/cart/items', { product_id: productId, quantity: 1 });
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Áp dụng sắp xếp - dùng chung cho cả 2 chế độ (duyệt thường / tìm kiếm)
  const sortProducts = (list) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price_desc':
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      case 'newest':
      default:
        return sorted; // giữ nguyên thứ tự gốc (mới nhất từ API, hoặc độ liên quan AI)
    }
  };

  // Nhóm sản phẩm theo danh mục, sắp xếp tên danh mục A-Z
  // CHỈ áp dụng khi đang duyệt bình thường (không lọc category, không tìm kiếm)
  const shouldGroupByCategory = !isSearchMode && !categoryFilter;

  const groupedByCategory = shouldGroupByCategory
    ? Object.entries(
        allProducts.reduce((groups, p) => {
          const key = p.category_name || 'Khác';
          if (!groups[key]) groups[key] = [];
          groups[key].push(p);
          return groups;
        }, {})
      ).sort(([a], [b]) => a.localeCompare(b, 'vi'))
    : null;

  const flatSortedProducts = sortProducts(allProducts);

  // Component thẻ sản phẩm - dùng chung cho mọi chế độ hiển thị
  const ProductCard = ({ p }) => (
    <div
      onClick={() => navigate(`/products/${p.id}`)}
      className="card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {p.primary_image ? (
        <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 14 }} />
      ) : (
        <div style={{ width: '100%', height: 160, background: 'var(--surface-hover)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có ảnh</span>
        </div>
      )}
      <p style={{
        fontWeight: 700, marginTop: 12, marginBottom: 4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', minHeight: 42, fontSize: 15
      }}>
        {p.name}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.category_name}</p>
      <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', marginTop: 6 }}>
        {Number(p.price).toLocaleString('vi-VN')}đ
      </p>
      {p.similarity !== undefined && (
        <span className="badge-ai" style={{ marginBottom: 8 }}>🤖 {(p.similarity * 100).toFixed(0)}% phù hợp</span>
      )}
      {(!user || user.role === 'buyer') && (
        <button onClick={(e) => handleAddToCart(e, p.id)} style={{ width: '100%', marginTop: 'auto', paddingTop: 12 }}>
          Thêm vào giỏ
        </button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      <h2 style={{ textAlign: 'center', fontSize: 32 }}>Danh sách sản phẩm</h2>

      <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm (VD: áo giữ ấm đi biển)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 480 }}
        />
        <button type="submit" className="btn-ai">🔍 Tìm</button>
      </form>

      {/* Sắp xếp - chỉ hiện khi KHÔNG nhóm theo danh mục (vì nhóm theo danh mục thì tự A-Z rồi) */}
      {!shouldGroupByCategory && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ fontSize: 13 }}>
            <option value="newest">Mặc định</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
            <option value="name_asc">Tên: A - Z</option>
          </select>
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>}
      {!loading && allProducts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có sản phẩm nào.</p>}

      {!loading && noExactMatch && allProducts.length > 0 && (
        <div className="card" style={{ background: 'var(--ai-light)', border: 'none', marginBottom: 20, padding: 12, textAlign: 'center' }}>
          <p style={{ color: 'var(--ai)', fontWeight: 600, fontSize: 14, margin: 0 }}>
            🤖 Không tìm thấy kết quả khớp chính xác. Đây là những sản phẩm gần giống nhất:
          </p>
        </div>
      )}

      {/* CHẾ ĐỘ 1: Duyệt thường - nhóm theo danh mục A-Z, mỗi danh mục có sắp xếp riêng */}
      {shouldGroupByCategory && groupedByCategory?.map(([categoryName, products]) => (
        <div key={categoryName} style={{ marginBottom: 40 }}>
          <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
            {categoryName}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {sortProducts(products).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      ))}

      {/* CHẾ ĐỘ 2: Tìm kiếm hoặc lọc theo 1 danh mục cụ thể - danh sách phẳng */}
      {!shouldGroupByCategory && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
          {flatSortedProducts.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

export default Products;