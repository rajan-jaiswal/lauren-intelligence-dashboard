import { useState, useRef, useEffect } from 'react';
import { chatCoach } from '../../api/products.js';

// ── Icons ─────────────────────────────────────────────────────────────────────
function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
    </svg>
  );
}
function BotIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
    </svg>
  );
}
function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  );
}

// ── Suggested quick questions ─────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  'How do I handle a competitor pricing objection?',
  'What are the top 3 differentiators I should lead with?',
  'How do I position against the main competitor?',
  'What ROI can the customer expect?',
  'How do I overcome "we already have a solution"?',
  'What discovery questions should I ask first?',
];

// ── Format AI response text (bullets → styled list) ──────────────────────────
function FormattedAnswer({ text }) {
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        const isBullet = /^[•\-*]\s/.test(line.trim());
        const content = isBullet ? line.trim().replace(/^[•\-*]\s/, '') : line;
        return isBullet ? (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
            <span style={{ color: 'var(--blue)', fontWeight: 800, flexShrink: 0, marginTop: 2 }}>•</span>
            <span>{content}</span>
          </div>
        ) : (
          <p key={i} style={{ marginBottom: 6 }}>{content}</p>
        );
      })}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)',
          animation: `coachPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}/>
      ))}
      <style>{`
        @keyframes coachPulse {
          0%, 80%, 100% { opacity: .25; transform: scale(.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AiSalesCoachPage({ data, onNavigate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! I'm your AI Sales Coach for **${data?.product || 'this product'}**. Ask me anything — objection handling, competitive positioning, discovery questions, pricing, ROI arguments, or anything else you need to close the deal. 💪`,
      isIntro: true,
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(question) {
    const q = (question || input).trim();
    if (!q || loading) return;

    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const { answer } = await chatCoach({
        question: q,
        productName: data?.product,
        practice: data?.practice,
        productContext: data,
      });
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Something went wrong.';
      setError(msg);
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I couldn't get a response. ${msg}`, isError: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([{
      role: 'assistant',
      text: `Hi! I'm your AI Sales Coach for **${data?.product || 'this product'}**. Ask me anything — objection handling, competitive positioning, discovery questions, pricing, ROI arguments, or anything else you need to close the deal. 💪`,
      isIntro: true,
    }]);
    setError('');
  }

  const showQuickQ = messages.length <= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'var(--blue)', color: '#fff', padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>AI</span>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>AI Sales Coach</div>
          {data?.product && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
              background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
              padding: '2px 8px', borderRadius: 20,
            }}>
              {data.product}
            </span>
          )}
        </div>
        <button
          onClick={clearChat}
          title="Clear chat"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
            border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
            color: 'var(--text-muted)', fontWeight: 600,
          }}
        >
          <ClearIcon /> Clear chat
        </button>
      </div>

      {/* ── Chat messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        padding: '4px 2px 12px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user' ? 'var(--blue)' : (msg.isError ? 'var(--red)' : 'var(--purple)'),
              color: '#fff',
            }}>
              {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '78%',
              background: msg.role === 'user'
                ? 'var(--blue)'
                : (msg.isError ? 'var(--red-lt)' : 'var(--card-bg)'),
              border: msg.role === 'user'
                ? 'none'
                : `1px solid ${msg.isError ? 'var(--red)' : 'var(--card-border)'}`,
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '11px 15px',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
            }}>
              {msg.role === 'user' ? (
                <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{msg.text}</div>
              ) : (
                <FormattedAnswer text={msg.text} />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--purple)', color: '#fff',
            }}>
              <BotIcon />
            </div>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: '14px 14px 14px 4px', padding: '11px 18px',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {/* Quick questions — shown only on first load */}
        {showQuickQ && !loading && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 8 }}>
              Suggested questions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  style={{
                    padding: '7px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                    border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
                    color: 'var(--text-muted)', fontWeight: 600,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.color = 'var(--blue)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.color = 'var(--text-muted)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        flexShrink: 0, paddingTop: 10,
        borderTop: '1px solid var(--card-border)',
      }}>
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask me anything about this product, objections, competitors, pricing..."
            rows={2}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
              border: '1px solid var(--card-border)', background: 'var(--card-bg2)',
              color: 'var(--text)', resize: 'none', fontFamily: 'var(--font)',
              lineHeight: 1.5, outline: 'none',
              borderColor: input ? 'var(--blue)' : 'var(--card-border)',
              transition: 'border-color .15s',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              background: loading || !input.trim() ? 'var(--card-border)' : 'var(--blue)',
              color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 7,
              height: 46, transition: 'background .15s',
            }}
          >
            <SendIcon />
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 6 }}>
          Press Enter to send · Shift+Enter for new line · Powered by Gemini AI
        </div>
      </div>
    </div>
  );
}
