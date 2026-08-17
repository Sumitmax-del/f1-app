'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// APEX // F1 AI Agent — Floating Chat Widget
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'status';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  "Who's leading the championship?",
  "When is the next race?",
  "Compare Verstappen vs Norris",
  "Last race results",
];

export default function F1ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm **APEX**, your F1 AI agent. Ask me anything about the 2026 season — standings, race analysis, driver comparisons, strategy breakdowns, or just chat F1. 🏎️",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pulseCount, setPulseCount] = useState(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Gentle pulse animation on the toggle button
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => setPulseCount(c => c + 1), 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create placeholder with empty content (shows typing dots)
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      // 15-second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();
      const reply = data.reply || 'No response received.';

      // Replace typing dots with the actual reply
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: reply }
            : m
        )
      );
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const errorMsg = isTimeout
        ? '⚠️ Request timed out. Please try again.'
        : `⚠️ Connection failed: ${err.message}`;

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: errorMsg }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // Simple markdown-lite renderer
  const renderContent = (text: string) => {
    if (!text) return <span className="apex-typing-indicator"><span /><span /><span /></span>;
    
    return text.split('\n').map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code class="apex-inline-code">$1</code>');
      // Bullet points
      if (processed.startsWith('- ') || processed.startsWith('* ')) {
        processed = `<span class="apex-bullet">•</span> ${processed.slice(2)}`;
      }
      // Numbered list
      const numMatch = processed.match(/^(\d+)\.\s/);
      if (numMatch) {
        processed = `<span class="apex-num">${numMatch[1]}.</span> ${processed.slice(numMatch[0].length)}`;
      }

      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: processed }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* ─── Injected Styles ──────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes apex-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes apex-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes apex-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes apex-typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes apex-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .apex-typing-indicator {
          display: inline-flex;
          gap: 4px;
          padding: 4px 0;
        }
        .apex-typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E10600;
          animation: apex-typing-dot 1.4s ease-in-out infinite;
        }
        .apex-typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .apex-typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        .apex-inline-code {
          background: rgba(225, 6, 0, 0.15);
          color: #ff6b6b;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 0.85em;
          font-family: 'JetBrains Mono', monospace;
        }
        .apex-bullet {
          color: #E10600;
          font-weight: bold;
          margin-right: 6px;
        }
        .apex-num {
          color: #E10600;
          font-weight: 700;
          margin-right: 4px;
        }
        .apex-scrollbar::-webkit-scrollbar { width: 4px; }
        .apex-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .apex-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 6, 0, 0.3); border-radius: 4px; }
        .apex-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 6, 0, 0.5); }
      `}</style>

      {/* ─── Toggle Button ────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close F1 AI Chat' : 'Open F1 AI Chat'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          background: isOpen
            ? 'linear-gradient(135deg, #1a1a2e, #16213e)'
            : 'linear-gradient(135deg, #E10600, #ff3333)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(225, 6, 0, 0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span
            key={pulseCount}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid #E10600',
              animation: 'apex-pulse-ring 2s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
        {isOpen ? '✕' : '🏁'}
      </button>

      {/* ─── Chat Window ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 99998,
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            height: '560px',
            maxHeight: 'calc(100vh - 140px)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1e 100%)',
            border: '1px solid rgba(225, 6, 0, 0.2)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(225, 6, 0, 0.08)',
            animation: 'apex-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          }}
        >
          {/* ─── Header ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(225, 6, 0, 0.12) 0%, rgba(10, 10, 20, 0.95) 100%)',
              borderBottom: '1px solid rgba(225, 6, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #E10600, #ff4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 2px 12px rgba(225, 6, 0, 0.4)',
                }}
              >
                🏎️
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  color: '#ffffff',
                  lineHeight: 1,
                }}>
                  APEX <span style={{ color: '#E10600' }}>//</span> <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '11px' }}>F1 AGENT</span>
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#00ff88',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #00ff88',
                  }} />
                  Powered by Gemini
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(225, 6, 0, 0.2)';
                e.currentTarget.style.color = '#ff6666';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              ✕
            </button>
          </div>

          {/* ─── Messages ───────────────────────────────────────────── */}
          <div
            className="apex-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                style={{
                  animation: 'apex-fade-in 0.3s ease-out',
                  animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                  animationFillMode: 'backwards',
                }}
              >
                {msg.role === 'status' ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#E10600',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    background: 'rgba(225, 6, 0, 0.08)',
                    borderRadius: '8px',
                    letterSpacing: '0.05em',
                  }}>
                    {msg.content}
                  </div>
                ) : msg.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: '14px 14px 4px 14px',
                      background: 'linear-gradient(135deg, #E10600, #cc0500)',
                      color: '#ffffff',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(225, 6, 0, 0.3)',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'rgba(225, 6, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}>
                      🏎️
                    </div>
                    <div style={{
                      maxWidth: 'calc(100% - 36px)',
                      padding: '10px 14px',
                      borderRadius: '4px 14px 14px 14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                    }}>
                      {renderContent(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ─── Suggested Queries (show when only welcome message) ── */}
          {messages.length === 1 && (
            <div style={{
              padding: '0 16px 8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(225, 6, 0, 0.25)',
                    background: 'rgba(225, 6, 0, 0.06)',
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(225, 6, 0, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(225, 6, 0, 0.5)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(225, 6, 0, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(225, 6, 0, 0.25)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ─── Input Bar ──────────────────────────────────────────── */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(0, 0, 0, 0.3)',
              flexShrink: 0,
            }}
          >
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(); }}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isLoading ? 'APEX is thinking...' : 'Ask about F1...'}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(225, 6, 0, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #E10600, #ff3333)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: input.trim() && !isLoading ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  boxShadow: input.trim() && !isLoading ? '0 2px 12px rgba(225, 6, 0, 0.3)' : 'none',
                }}
              >
                ➤
              </button>
            </form>
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.2)',
              letterSpacing: '0.1em',
            }}>
              APEX may produce inaccurate info · 2026 Season
            </div>
          </div>
        </div>
      )}
    </>
  );
}
