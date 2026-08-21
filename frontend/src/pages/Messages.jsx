import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

function Messages() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('open') || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const bottomRef = useRef(null);

  const fetchConversations = () => {
    api.get('/messages').then((res) => setConversations(res.data));
  };

  const fetchMessages = () => {
    if (!activeId) return;
    api.get(`/messages/${activeId}`).then((res) => setMessages(res.data));
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // làm mới danh sách mỗi 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // làm mới tin nhắn mỗi 4s - mô phỏng gần real-time
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    await api.post(`/messages/${activeId}`, { content: input });
    setInput('');
    fetchMessages();
  };

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 20px', display: 'flex', gap: 16, height: 500 }}>
      {/* Danh sách cuộc trò chuyện */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
        <h4>Tin nhắn</h4>
        {conversations.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chưa có cuộc trò chuyện nào.</p>}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className="card"
            style={{ marginBottom: 8, cursor: 'pointer', borderColor: activeId == c.id ? 'var(--primary)' : 'var(--border)' }}
          >
            <p style={{ fontWeight: 600, fontSize: 14 }}>{c.other_name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.last_message || 'Chưa có tin nhắn'}</p>
          </div>
        ))}
      </div>

      {/* Khung chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeId ? (
          <p style={{ margin: 'auto', color: 'var(--text-muted)' }}>Chọn 1 cuộc trò chuyện để bắt đầu</p>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ textAlign: m.sender_id === user.id ? 'right' : 'left', marginBottom: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    background: m.sender_id === user.id ? 'var(--primary)' : 'var(--surface-hover)',
                    padding: '8px 12px',
                    borderRadius: 10,
                    maxWidth: '70%',
                    fontSize: 14
                  }}>
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, padding: 8 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1 }} />
              <button type="submit">Gửi</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;