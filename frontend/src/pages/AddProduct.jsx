import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';


function AddProduct() {
  const [createdProductId, setCreatedProductId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ variant_name: '', price_extra: 0, stock: 0 });
  const [categories, setCategories] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', category_id: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Lấy danh sách category để hiện trong dropdown chọn
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleReview = (e) => {
  e.preventDefault();
  if (!formData.name || !formData.price || !formData.category_id) {
    setError('Vui lòng điền đủ thông tin bắt buộc');
    return;
  }
  setError('');
  setShowPreview(true);
};

const handleConfirmSubmit = async () => {
  try {
    const res = await api.post('/products', formData);
    const newProductId = res.data.productId;
    if (imageFile) {
      const imgForm = new FormData();
      imgForm.append('image', imageFile);
      await api.post(`/products/${newProductId}/images`, imgForm, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    setCreatedProductId(newProductId);
    setShowPreview(false);
  } catch (err) {
    setError(err.response?.data?.message || 'Có lỗi xảy ra');
    setShowPreview(false);
  }
};

const handleAddVariant = async (e) => {
  e.preventDefault();
  if (!newVariant.variant_name.trim()) return;
  await api.post(`/products/${createdProductId}/variants`, newVariant);
  setVariants([...variants, newVariant]);
  setNewVariant({ variant_name: '', price_extra: 0 });
};

  return (
    <div style={{ maxWidth: 500, margin: '30px auto' }}>
      <h2>Đăng sản phẩm mới</h2>
      <form onSubmit={handleReview}>
        <input name="name" placeholder="Tên sản phẩm" onChange={handleChange} required /><br /><br />
        <textarea name="description" placeholder="Mô tả sản phẩm" onChange={handleChange} rows={4} style={{ width: '100%' }} /><br /><br />
        <input name="price" type="number" placeholder="Giá (VNĐ)" onChange={handleChange} required /><br /><br />
        <input name="stock" type="number" placeholder="Số lượng tồn kho" onChange={handleChange} required /><br /><br />

        <select name="category_id" onChange={handleChange} required>
          <option value="">-- Chọn danh mục --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select><br /><br />

        <label>Ảnh sản phẩm: </label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} /><br /><br />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Đăng sản phẩm</button>
      </form>
      {showPreview && (
  <div className="card" style={{ marginTop: 20 }}>
    <p style={{ fontWeight: 700, marginBottom: 10 }}>📋 Xem trước sản phẩm</p>
    {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />}
    <p><strong>{formData.name}</strong></p>
    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{formData.description}</p>
    <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{Number(formData.price).toLocaleString('vi-VN')}đ — Tồn kho: {formData.stock}</p>
    <div style={{ marginTop: 12 }}>
      <button onClick={handleConfirmSubmit} style={{ marginRight: 8 }}>Xem trước</button>
      <button onClick={() => setShowPreview(false)} className="btn-secondary">Quay lại chỉnh sửa</button>
    </div>
  </div>
)}
          {createdProductId && (
  <div className="card" style={{ marginTop: 20 }}>
    <p style={{ fontWeight: 700, marginBottom: 10 }}>Thêm biến thể (không bắt buộc)</p>
    <form onSubmit={handleAddVariant} style={{ marginBottom: 12 }}>
      <input
        placeholder="VD: Size M - Đỏ"
        value={newVariant.variant_name}
        onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })}
        style={{ marginRight: 8, marginBottom: 8 }}
      />
      <input
        type="number"
        placeholder="Phụ thu (VNĐ, để 0 nếu không đổi giá)"
        value={newVariant.price_extra}
        onChange={(e) => setNewVariant({ ...newVariant, price_extra: e.target.value })}
        style={{ marginRight: 8, marginBottom: 8 }}
      />
      <input
  type="number"
  placeholder="Tồn kho"
  value={newVariant.stock}
  onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
  style={{ width: 90 }}
/>
      <button type="submit">Thêm biến thể</button>
    </form>

    {variants.map((v, i) => <p key={i} style={{ fontSize: 14 }}>• {v.variant_name} (+{Number(v.price_extra).toLocaleString('vi-VN')}đ)</p>)}

    <button onClick={() => navigate('/products')} className="btn-secondary" style={{ marginTop: 12 }}>
      ✓ Xác nhận đăng bán
    </button>
  </div>
)}

    </div>
  );
}

export default AddProduct;