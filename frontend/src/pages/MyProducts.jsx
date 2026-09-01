import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useState, useEffect, useRef } from 'react';

const statusLabels = { pending: 'Chờ duyệt', active: 'Đang bán', inactive: 'Bị từ chối', paused: 'Tạm ngưng bán' };

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ variant_name: '', price_extra: 0 });
  const navigate = useNavigate();
  const [uploadingImageFor, setUploadingImageFor] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingProductId, setUploadingProductId] = useState(null);

  const fetchProducts = () => api.get('/products/mine').then((res) => setProducts(res.data));
  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description, price: p.price, stock: p.stock });
  };

  const handleSaveEdit = async (id) => {
    await api.put(`/products/${id}`, editForm);
    setEditingId(null);
    fetchProducts();
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const res = await api.get(`/products/${id}/variants`);
    setVariants(res.data);
  };

  const handleAddVariant = async (productId) => {
    if (!newVariant.variant_name.trim()) return;
    await api.post(`/products/${productId}/variants`, newVariant);
    setNewVariant({ variant_name: '', price_extra: 0 });
    const res = await api.get(`/products/${productId}/variants`);
    setVariants(res.data);
  };

  const handleDeleteVariant = async (variantId, productId) => {
    await api.delete(`/products/variants/${variantId}`);
    const res = await api.get(`/products/${productId}/variants`);
    setVariants(res.data);
  };

  const handleToggleSale = async (id) => {
    try {
      const res = await api.put(`/products/${id}/toggle-sale`);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: res.data.status } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleAddImages = async (productId, files) => {
  if (!files || files.length === 0) return;
  setUploadingImageFor(productId);
  try {
    for (const file of files) {
      const imgForm = new FormData();
      imgForm.append('image', file);
      await api.post(`/products/${productId}/images`, imgForm, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    fetchProducts();
    alert(`Đã thêm ${files.length} ảnh!`);
  } catch (err) {
    alert('Có lỗi khi thêm ảnh');
  }
  setUploadingImageFor(null);
};

  return (
    <div style={{ maxWidth: 800, margin: '30px auto', padding: '0 20px' }}>
      <h2>Sản phẩm của tôi</h2>
      {products.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Bạn chưa đăng sản phẩm nào.</p>}
      {products.map((p) => (
        <div key={p.id} className="card" style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
          {p.primary_image ? (
            <img src={`http://localhost:5000${p.primary_image}`} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
          ) : <div style={{ width: 80, height: 80, background: 'var(--surface-hover)', borderRadius: 8 }} />}

          <div style={{ flex: 1 }}>
            {editingId === p.id ? (
              <>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ marginBottom: 6, width: '100%' }} />
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ marginBottom: 6, width: '100%' }} rows={2} />
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} style={{ marginRight: 8, width: 120 }} />
                <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} style={{ width: 100 }} />
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => handleSaveEdit(p.id)} style={{ marginRight: 8 }}>Lưu</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary">Hủy</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 700 }}>{p.name}</p>
                <p style={{ fontSize: 13 }}>{Number(p.price).toLocaleString('vi-VN')}đ — Tồn kho: {p.stock}</p>
                <span className="badge-ai">{statusLabels[p.status]}</span>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => startEdit(p)} className="btn-secondary" style={{ marginRight: 8 }}>Sửa</button>
                  {(p.status === 'active' || p.status === 'paused') && (
                    <button onClick={() => handleToggleSale(p.id)} className="btn-secondary" style={{ marginRight: 8 }}>
                      {p.status === 'active' ? '⏸ Tạm ngưng' : '▶ Mở bán lại'}
                    </button>
                  )}
                  <button onClick={() => toggleExpand(p.id)} className="btn-secondary" style={{ marginRight: 8 }}>
                    Biến thể
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn-secondary" style={{ color: 'var(--danger)' }}>Xóa</button>
                  <button
                   type="button"
                    onClick={() => { setUploadingProductId(p.id); fileInputRef.current.click(); }}
                    className="btn-secondary"
                    disabled={uploadingImageFor === p.id}
                    >
                     {uploadingImageFor === p.id ? 'Đang tải...' : 'Thêm ảnh'}
                  </button>
                </div>

                {expandedId === p.id && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-hover)', borderRadius: 10 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Danh sách biến thể</p>
                    {variants.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chưa có biến thể nào.</p>}
                    {variants.map((v) => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{v.variant_name} (+{Number(v.price_extra).toLocaleString('vi-VN')}đ)</span>
                        <button onClick={() => handleDeleteVariant(v.id, p.id)} style={{ fontSize: 12, padding: '4px 10px' }} className="btn-secondary">Xóa</button>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input placeholder="VD: Size M - Đỏ" value={newVariant.variant_name} onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })} style={{ flex: 1 }} />
                      <input type="number" placeholder="Phụ thu" value={newVariant.price_extra} onChange={(e) => setNewVariant({ ...newVariant, price_extra: e.target.value })} style={{ width: 100 }} />
                      <button onClick={() => handleAddVariant(p.id)}>Thêm</button>
                      <input
                         type="file"
                         accept="image/*"
                         multiple
                         ref={fileInputRef}
                         style={{ display: 'none' }}
                         onChange={(e) => {
                         handleAddImages(uploadingProductId, Array.from(e.target.files));
                         e.target.value = ''; // reset để chọn lại được file trùng tên lần sau
                          }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyProducts;