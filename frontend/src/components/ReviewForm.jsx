import { useState } from 'react';
import api from '../api/axios';

const suggestedComments = [
  'Sản phẩm đúng như mô tả, rất hài lòng!',
  'Chất lượng tốt, giao hàng nhanh.',
  'Đóng gói cẩn thận, sẽ ủng hộ shop tiếp.',
  'Giá cả hợp lý so với chất lượng.'
];

function ReviewForm({ productId, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('product_id', productId);
      formData.append('rating', rating);
      formData.append('comment', comment);
      if (image) formData.append('image', image);

      await api.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Cảm ơn bạn đã đánh giá!');
      setRating(0);
      setComment('');
      setImage(null);
      onReviewAdded(); // báo cho component cha tải lại danh sách review
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>Viết đánh giá của bạn</p>

      {/* Chọn số sao */}
      <div style={{ marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ fontSize: 26, cursor: 'pointer', color: star <= (hoverRating || rating) ? '#facc15' : '#555' }}
          >
            ★
          </span>
        ))}
      </div>

      {/* Gợi ý câu bình luận */}
      <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {suggestedComments.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setComment(s)}
            style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: 12, padding: '6px 10px' }}
          >
            {s}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
        rows={3}
        style={{ width: '100%', marginBottom: 8 }}
      />

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ảnh (không bắt buộc): </label>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  );
}

export default ReviewForm;