import { useState } from 'react';
import { ChevronLeft, FileText, Download, Calendar, Clock, Users, BookOpen, Search, Code, Check, Copy, Link2, ExternalLink } from 'lucide-react';
import type { Session } from '../utils/db';
import SlideDeck from './SlideDeck';
import AIChat from './AIChat';
import { exportToPDF, exportToDOCX } from '../utils/exportHelper';

interface SessionViewProps {
  session: Session;
  apiKey: string;
  onBack: () => void;
  onUpdateSession: (updatedSession: Session) => void;
}

export default function SessionView({ session, apiKey, onBack, onUpdateSession }: SessionViewProps) {
  // Tabs: 'overview' | 'transcript' | 'slides' | 'notes'
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'slides' | 'notes'>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const durationMin = Math.round(session.duration / 60);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter transcript text
  const filteredTranscript = session.transcript.filter(item => {
    if (!transcriptSearch) return true;
    const lowerQuery = transcriptSearch.toLowerCase();
    
    // Check text
    if (item.text.toLowerCase().includes(lowerQuery)) return true;

    // Check speaker
    const speakerObj = session.speakers.find(s => s.id === item.speakerId);
    if (speakerObj && speakerObj.name.toLowerCase().includes(lowerQuery)) return true;

    return false;
  });

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', height: 'calc(100vh - 100px)' }}>
      
      {/* Left: Study tabs content */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: 0,
                marginBottom: '8px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back to Vault</span>
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{session.title}</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--accent-purple)' }} />
                {dateStr}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                {durationMin} mins
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} style={{ color: 'var(--accent-pink)' }} />
                {session.speakers.length} Speakers
              </span>
              {session.sessionLink && (
                <a
                  href={session.sessionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-cyan)',
                    textDecoration: 'none',
                  }}
                >
                  <Link2 size={14} />
                  {session.sessionPlatform || 'Online Session'}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Export study assets panel */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => exportToDOCX(session)}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <FileText size={14} style={{ color: '#3b82f6' }} />
              <span>DOCX Study Guide</span>
            </button>
            <button
              onClick={() => exportToPDF(session)}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Download size={14} style={{ color: '#10b981' }} />
              <span>PDF Notebook</span>
            </button>
          </div>
        </div>

        {/* Tab switch navigation */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px', marginBottom: '20px' }}>
          {(['overview', 'transcript', 'slides', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent-purple)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab ? 'bold' : '500',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'notes' ? 'Study Guide' : (tab === 'slides' ? 'PPT Presentation' : tab)}
            </button>
          ))}
        </div>

        {/* Scrollable tab pane */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Executive Summary */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-accent)' }}>Executive Summary</h3>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem' }}>{session.summary}</p>
              </div>

              {/* Grid: Takeaways & Speakers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                
                {/* Key Takeaways */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} style={{ color: 'var(--accent-purple)' }} />
                    <span>Core Takeaways</span>
                  </h3>
                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {session.keyPoints.map((kp, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.4 }}>{kp}</li>
                    ))}
                  </ul>
                </div>

                {/* Speaker activity tracking */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Speaker Tracker</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {session.speakers.map(sp => {
                      const pct = Math.round((sp.duration / (session.duration || 1)) * 100);
                      const min = Math.floor(sp.duration / 60);
                      const sec = sp.duration % 60;
                      return (
                        <div key={sp.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>{sp.name}</span>
                            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                              {pct}% ({min}m {sec}s)
                            </span>
                          </div>
                          {/* Progress bar fill */}
                          <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            height: '8px',
                            borderRadius: '99px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              background: sp.color,
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: '99px'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Transcript Search filter */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '10px' }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  placeholder="Filter dialogue by speaker or keyword..."
                  className="glass-input"
                  value={transcriptSearch}
                  onChange={e => setTranscriptSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem', borderRadius: '8px' }}
                />
              </div>

              {/* Dialogue lines list */}
              <div className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'rgba(10, 15, 25, 0.4)'
              }}>
                {filteredTranscript.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No matching dialogue lines found.
                  </div>
                ) : (
                  filteredTranscript.map(item => {
                    const speakerObj = session.speakers.find(s => s.id === item.speakerId);
                    const name = speakerObj ? speakerObj.name : 'Unknown Speaker';
                    const color = speakerObj ? speakerObj.color : 'var(--text-secondary)';

                    const m = Math.floor(item.time / 60);
                    const s = Math.floor(item.time % 60);
                    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

                    // Screenshot visual thumbnail toggle
                    const attachedScreenshot = item.screenshotId 
                      ? session.screenshots.find(sc => sc.id === item.screenshotId)
                      : null;

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '60px 140px 1fr',
                          gap: '16px',
                          alignItems: 'flex-start',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)'
                        }}
                      >
                        {/* Timestamp */}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', paddingTop: '1px' }}>
                          [{timeStr}]
                        </span>

                        {/* Speaker Name */}
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: color }}>
                          {name}
                        </span>

                        {/* Dialogue Text & Screenshot Trigger */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {item.text}
                          </p>
                          
                          {/* Screenshot visual embed if present */}
                          {attachedScreenshot && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '240px', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Screenshot captured at this timestamp:
                              </span>
                              <div style={{
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                aspectRatio: '16/9'
                              }}>
                                <img src={attachedScreenshot.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Screenshot grab" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: GENERATED SLIDES */}
          {activeTab === 'slides' && (
            <SlideDeck session={session} onUpdateSession={onUpdateSession} />
          )}

          {/* TAB 4: STUDY GUIDE & NOTES */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Chronological Topics list */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent-purple)' }} />
                  <span>Topic Sequence Outline</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {session.topics.map((topic, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '16px',
                      paddingBottom: '14px',
                      borderBottom: idx === session.topics.length - 1 ? 'none' : '1px dotted rgba(255,255,255,0.06)'
                    }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'var(--accent-cyan)',
                        background: 'rgba(6, 182, 212, 0.08)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {topic.time}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{topic.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{topic.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples & Text definitions */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Lesson Code Snippets & Exercises</span>
                </h3>

                {session.examples.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No programming code block demonstrations found in this session.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {session.examples.map((ex, idx) => {
                      const id = `code_${idx}`;
                      return (
                        <div key={idx} style={{
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          {/* Bar header */}
                          <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '10px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border-color)'
                          }}>
                            <div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ex.concept}</h4>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ex.topic}</span>
                            </div>
                            <button
                              onClick={() => handleCopyCode(id, ex.codeOrText)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              {copiedId === id ? (
                                <>
                                  <Check size={14} style={{ color: 'var(--status-success)' }} />
                                  <span style={{ color: 'var(--status-success)' }}>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Code pre */}
                          <pre style={{
                            padding: '16px',
                            margin: 0,
                            fontFamily: 'Courier New, monospace',
                            fontSize: '0.85rem',
                            color: '#38bdf8',
                            background: '#020617',
                            overflowX: 'auto'
                          }}>
                            {ex.codeOrText}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Right Column: AI Chat Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <AIChat session={session} apiKey={apiKey} />
      </div>

    </div>
  );
}
