import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Xin chào! Mình là trợ lý mua sắm AI. Bạn đang tìm sản phẩm gì?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMessage }
    ]);

    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', {
        message: userMessage
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: res.data.reply,
          products: res.data.products
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000
      }}
    >
      {isOpen ? (
        <div
          style={{
            width: 340,
            height: 480,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              height: 58,
              padding: '0 14px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff'
            }}
          >
            <strong
              style={{
                color: '#1f2937',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              <span style={{ fontSize: 21 }}>🤖</span>
              Trợ lý mua sắm AI
            </strong>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: '#f3f4f6',
                color: '#374151',
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* MESSAGES */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              background: '#ffffff'
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  textAlign: m.role === 'user' ? 'right' : 'left'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    background:
                      m.role === 'user'
                        ? '#dbeafe'
                        : '#f1f3f5',
                    color: '#1f2937',
                    padding: '9px 12px',
                    borderRadius: 12,
                    maxWidth: '85%',
                    fontSize: 14,
                    lineHeight: 1.5,
                    textAlign: 'left',
                    border:
                      m.role === 'user'
                        ? '1px solid #bfdbfe'
                        : '1px solid #e5e7eb'
                  }}
                >
                  {m.text}
                </div>

                {/* PRODUCTS */}
                {m.products && m.products.length > 0 && (
                  <div
                    style={{
                      marginTop: 8
                    }}
                  >
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/products/${p.id}`);
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: 10,
                          marginTop: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 4px',
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#1f2937'
                          }}
                        >
                          {p.name}
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: '#2563eb',
                            fontWeight: 600
                          }}
                        >
                          {Number(p.price).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <p
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  margin: '4px 0'
                }}
              >
                Đang trả lời...
              </p>
            )}
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSend}
            style={{
              padding: 10,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: 8,
              background: '#ffffff'
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                outline: 'none',
                fontSize: 14,
                color: '#1f2937',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0 17px',
                border: 'none',
                borderRadius: 12,
                background: loading ? '#93b4f5' : '#5b8def',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: 65
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            cursor: 'pointer',
            background: 'var(--ai)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)'
          }}
        >
          <span
            style={{
              fontSize: 28,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🤖
          </span>
        </button>
      )}
    </div>
  );
}

export default Chatbot;