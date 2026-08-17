import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function AddProduct() {
  const [categories, setCategories] = useState([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Bước 1: tạo sản phẩm (chưa có ảnh)
      const res = await api.post('/products', formData);
      const newProductId = res.data.productId;

      // Bước 2: nếu có chọn ảnh, upload ảnh cho sản phẩm vừa tạo
      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        await api.post(`/products/${newProductId}/images`, imgForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('Đăng sản phẩm thành công!');
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '30px auto' }}>
      <h2>Đăng sản phẩm mới</h2>
      <form onSubmit={handleSubmit}>
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
    </div>
  );
}

export default AddProduct;