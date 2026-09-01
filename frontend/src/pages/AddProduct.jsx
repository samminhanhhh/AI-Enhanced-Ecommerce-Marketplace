import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function AddProduct() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', category_id: ''
  });
  const [imageFiles, setImageFiles] = useState([]); // nhiều ảnh
  const [variantList, setVariantList] = useState([]); // biến thể nhập TRƯỚC khi đăng
  const [newVariant, setNewVariant] = useState({ variant_name: '', price_extra: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddVariantToList = () => {
    if (!newVariant.variant_name.trim()) return;
    setVariantList([...variantList, newVariant]);
    setNewVariant({ variant_name: '', price_extra: 0 });
  };

  const handleRemoveVariantFromList = (index) => {
    setVariantList(variantList.filter((_, i) => i !== index));
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      setError('Vui lòng điền đủ tên, giá, danh mục');
      return;
    }
    setError('');
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Bước 1: tạo sản phẩm
      const res = await api.post('/products', formData);
      const newProductId = res.data.productId;

      // Bước 2: upload TẤT CẢ ảnh đã chọn (tuần tự từng cái)
      for (const file of imageFiles) {
        const imgForm = new FormData();
        imgForm.append('image', file);
        await api.post(`/products/${newProductId}/images`, imgForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Bước 3: tạo TẤT CẢ biến thể đã nhập (tuần tự từng cái)
      for (const v of variantList) {
        await api.post(`/products/${newProductId}/variants`, v);
      }

      alert('Đăng sản phẩm thành công!');
      navigate('/my-products');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
      setShowPreview(false);
    }
    setSubmitting(false);
  };

  // ===== MÀN HÌNH XEM TRƯỚC =====
  if (showPreview) {
    return (
      <div style={{ maxWidth: 500, margin: '30px auto', padding: '0 20px' }}>
        <h2>📋 Xem trước sản phẩm</h2>
        <div className="card">
          {imageFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {imageFiles.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          )}
          <h3 style={{ margin: '8px 0' }}>{formData.name}</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.6 }}>{formData.description}</p>
          <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>
            {Number(formData.price).toLocaleString('vi-VN')}đ
          </p>
          <p style={{ fontSize: 14 }}>Tồn kho: {formData.stock}</p>

          {variantList.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Phân loại:</p>
              {variantList.map((v, i) => (
                <p key={i} style={{ fontSize: 14 }}>
                  • {v.variant_name} — {(Number(formData.price) + Number(v.price_extra)).toLocaleString('vi-VN')}đ
                </p>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</p>}

        <div style={{ marginTop: 16 }}>
          <button onClick={handleConfirmSubmit} disabled={submitting} style={{ marginRight: 8 }}>
            {submitting ? 'Đang đăng...' : '✓ Xác nhận đăng bán'}
          </button>
          <button onClick={() => setShowPreview(false)} className="btn-secondary" disabled={submitting}>
            Quay lại chỉnh sửa
          </button>
        </div>
      </div>
    );
  }

  // ===== MÀN HÌNH NHẬP LIỆU =====
  return (
    <div style={{ maxWidth: 500, margin: '30px auto', padding: '0 20px' }}>
      <h2>Đăng sản phẩm mới</h2>
      <form onSubmit={handleReview}>
        <input name="name" placeholder="Tên sản phẩm" value={formData.name} onChange={handleChange} required style={{ width: '100%', marginBottom: 10 }} />
        <textarea name="description" placeholder="Mô tả sản phẩm" value={formData.description} onChange={handleChange} rows={4} style={{ width: '100%', marginBottom: 10 }} />
        <input name="price" type="number" placeholder="Giá cơ bản (giá của phân loại rẻ nhất, nếu có)" value={formData.price} onChange={handleChange} required style={{ width: '100%', marginBottom: 10 }} />
        <input name="stock" type="number" placeholder="Số lượng tồn kho" value={formData.stock} onChange={handleChange} required style={{ width: '100%', marginBottom: 10 }} />

        <select name="category_id" value={formData.category_id} onChange={handleChange} required style={{ width: '100%', marginBottom: 10 }}>
          <option value="">-- Chọn danh mục --</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ảnh sản phẩm (chọn được nhiều ảnh):</label><br />
        <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files))} style={{ marginBottom: 6 }} /><br />
        {imageFiles.length > 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đã chọn {imageFiles.length} ảnh</p>}

        <div className="card" style={{ marginTop: 14, marginBottom: 14 }}>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            Phân loại sản phẩm (không bắt buộc — VD: Bát 40.000đ là giá gốc, Tô nhập phụ thu +40.000đ để ra 80.000đ)
          </p>
          {variantList.map((v, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{v.variant_name} (+{Number(v.price_extra).toLocaleString('vi-VN')}đ)</span>
              <button type="button" onClick={() => handleRemoveVariantFromList(i)} className="btn-secondary" style={{ fontSize: 12, padding: '2px 10px' }}>Xóa</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="VD: Tô lớn" value={newVariant.variant_name} onChange={(e) => setNewVariant({ ...newVariant, variant_name: e.target.value })} style={{ flex: 1 }} />
            <input type="number" placeholder="Phụ thu" value={newVariant.price_extra} onChange={(e) => setNewVariant({ ...newVariant, price_extra: e.target.value })} style={{ width: 100 }} />
            <button type="button" onClick={handleAddVariantToList}>Thêm</button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button type="submit">Xem trước</button>
      </form>
    </div>
  );
}

export default AddProduct;