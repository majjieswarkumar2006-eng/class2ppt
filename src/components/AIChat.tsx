import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, HelpCircle } from 'lucide-react';
import type { Session } from '../utils/db';
import { chatWithTranscript } from '../utils/gemini';

interface AIChatProps {
  session: Session;
  apiKey: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export default function AIChat({ session, apiKey }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      parts: `Hi! I am your LecturaAI Tutor. I have indexed the entire session transcript, speaker durations, and generated slides for "${session.title}". Ask me anything!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gather history
      const history = messages.map(m => ({
        role: m.role,
        parts: m.parts
      }));

      // Call AI Chat engine (local RAG or real Gemini API)
      const reply = await chatWithTranscript(session, textToSend, history, apiKey);
      
      setMessages(prev => [...prev, { role: 'model', parts: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: 'Sorry, I encountered an issue analyzing the transcript files. Try again!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const QUICK_PROMPTS = [
    { label: 'Summarize Class', text: 'Please summarize the entire class and key topics.' },
    { label: 'Create a Quiz', text: 'Give me a 3-question multiple choice quiz about the concepts in this lecture.' },
    { label: 'Speaker activity', text: 'Who spoke during this session and what was their main contribution?' },
    { label: 'Explain code blocks', text: 'Explain the code examples and practical exercises taught in this class.' }
  ];

  return (
    <div className="glass-panel" style={{
      width: '320px',
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'var(--bg-glass)'
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        marginBottom: '10px'
      }}>
        <div style={{
          background: 'rgba(147, 51, 234, 0.1)',
          padding: '6px',
          borderRadius: '8px',
          color: 'var(--text-accent)'
        }}>
          <Bot size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>AI Study Partner</h4>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Class Context Enabled</span>
        </div>
      </div>

      {/* Message History Roll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '4px',
        marginBottom: '10px'
      }}>
        {messages.map((m, idx) => {
          const isModel = m.role === 'model';
          return (
            <div
              key={idx}
              style={{
                alignSelf: isModel ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {/* Message bubble */}
              <div style={{
                background: isModel ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, var(--accent-purple) 0%, #6366f1 100%)',
                border: isModel ? '1px solid var(--border-color)' : 'none',
                color: isModel ? 'var(--text-primary)' : '#fff',
                padding: '10px 14px',
                borderRadius: isModel ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap'
              }}>
                {m.parts}
              </div>

              {/* Speaker tag */}
              <span style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                alignSelf: isModel ? 'flex-start' : 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {isModel ? (
                  <>
                    <Bot size={10} style={{ color: 'var(--accent-purple)' }} />
                    <span>Lectura Tutor</span>
                  </>
                ) : (
                  <>
                    <User size={10} style={{ color: 'var(--accent-cyan)' }} />
                    <span>You</span>
                  </>
                )}
              </span>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Loader2 size={14} style={{ color: 'var(--accent-purple)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzing transcript...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      {messages.length === 1 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} />
            <span>Suggested Questions:</span>
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(qp.text)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Typing box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '10px'
        }}
      >
        <input
          type="text"
          className="glass-input"
          placeholder="Ask a question about this session..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, fontSize: '0.8rem', borderRadius: '18px', padding: '8px 12px' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '34px', height: '34px', borderRadius: '50%', padding: 0 }}
          disabled={isLoading || !input.trim()}
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
}
