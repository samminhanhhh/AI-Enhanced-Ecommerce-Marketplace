import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Mình là trợ lý mua sắm AI. Bạn đang tìm sản phẩm gì?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { message: userMessage });
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: res.data.reply, products: res.data.products }
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {isOpen ? (
        <div style={{ width: 340, height: 480, background: '#222', border: '1px solid #555', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between' }}>
            <strong>🤖 Trợ lý mua sắm AI</strong>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block',
                  background: m.role === 'user' ? '#557' : '#333',
                  padding: '8px 12px',
                  borderRadius: 10,
                  maxWidth: '85%',
                  fontSize: 14
                }}>
                  {m.text}
                </div>

                {m.products && m.products.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => { setIsOpen(false); navigate(`/products/${p.id}`); }}
                        style={{ border: '1px solid #444', borderRadius: 8, padding: 8, marginTop: 6, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 'bold' }}>{p.name}</p>
                        <p style={{ fontSize: 13 }}>{Number(p.price).toLocaleString('vi-VN')}đ</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <p style={{ fontSize: 13, color: '#888' }}>Đang trả lời...</p>}
          </div>

          <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid #444', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              style={{ flex: 1, padding: 8 }}
            />
            <button type="submit">Gửi</button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{ width: 60, height: 60, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}
        >
          🤖
        </button>
      )}
    </div>
  );
}

export default Chatbot;