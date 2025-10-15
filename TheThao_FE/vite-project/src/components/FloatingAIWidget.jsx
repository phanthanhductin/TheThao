import { useState, useRef, useEffect } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

export default function FloatingAIWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    { role: 'ai', content: 'Xin chào! Mình là trợ lý AI. Bạn có thể hỏi ngoài lề hoặc hỏi về sản phẩm (ví dụ: "áo jersey size M giá bao nhiêu?").' }
  ]);
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMsgs(m => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: 'ai', content: data.reply || 'Không có phản hồi.' }]);
    } catch (e) {
      setMsgs(m => [...m, { role: 'ai', content: 'Lỗi kết nối đến AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 9999,
          borderRadius: 9999, padding: '12px 16px',
          background: '#6366f1', color: '#fff', fontWeight: 700,
          boxShadow: '0 8px 24px rgba(2,6,23,.18)'
        }}
      >{open ? 'Đóng AI' : 'AI Chat'}</button>

      {open && (
        <div style={{
          position: 'fixed', right: 20, bottom: 76, zIndex: 9999,
          width: 360, height: 480, background: '#fff',
          borderRadius: 16, boxShadow: '0 12px 36px rgba(2,6,23,.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: 12, fontWeight: 800, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            Trợ lý AI — TheThao Sports
          </div>

          <div ref={boxRef} style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                  background: m.role === 'user' ? '#e0e7ff' : '#f1f5f9',
                  color: '#0f172a', whiteSpace: 'pre-wrap'
                }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: '#64748b' }}>AI đang trả lời…</div>}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <textarea
              placeholder="Gõ tin nhắn…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={2}
              style={{ width: '100%', resize: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8 }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{
                marginTop: 6, width: '100%', padding: '10px 12px', borderRadius: 10,
                background: loading ? '#94a3b8' : '#6366f1', color: '#fff', fontWeight: 800
              }}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
