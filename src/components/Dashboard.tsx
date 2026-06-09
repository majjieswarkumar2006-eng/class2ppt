import { useState, useEffect } from 'react';
import { Search, Trash2, Download, ExternalLink, Presentation, Clock, BookOpen, Sparkles, FileText } from 'lucide-react';
import { LecturaDB } from '../utils/db';
import type { Session } from '../utils/db';
import { generatePPT } from '../utils/pptGenerator';
import { exportToPDF, exportToDOCX } from '../utils/exportHelper';

interface DashboardProps {
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  refreshSessions: () => void;
  onCreateDemoClass: () => void;
}

export default function Dashboard({ sessions, onSelectSession, refreshSessions, onCreateDemoClass }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  // Fetch / filter sessions
  useEffect(() => {
    const performSearch = async () => {
      const results = await LecturaDB.searchSessions(searchQuery);
      setFilteredSessions(results);
    };
    performSearch();
  }, [searchQuery, sessions]);

  // Compute overall stats
  const totalHours = sessions.reduce((acc, s) => acc + (s.duration / 3600), 0);
  const totalSlides = sessions.reduce((acc, s) => acc + s.slides.length, 0);
  const totalTopics = sessions.reduce((acc, s) => acc + s.topics.length, 0);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this recorded session from your local database?')) {
      await LecturaDB.deleteSession(id);
      refreshSessions();
    }
  };

  const handleDownloadPPT = async (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    try {
      await generatePPT(session, 'dark');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PPTX. Check console.');
    }
  };

  const handleDownloadDOCX = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    exportToDOCX(session);
  };

  const handleDownloadPDF = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    exportToPDF(session);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Dashboard Top Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
            Classroom <span className="gradient-text">Study Vault</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Access all your recorded lectures, transcripts, notes, and AI-generated slides.
          </p>
        </div>

        {/* Global Search Bar */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search titles, transcripts, key points..."
            className="glass-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              borderRadius: '25px',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Numerical Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Stat 1 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'rgba(147, 51, 234, 0.1)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            color: 'var(--accent-purple)'
          }}>
            <Clock size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Study Hours Saved
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2 }}>
              {totalHours.toFixed(1)} hrs
            </h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            color: 'var(--accent-cyan)'
          }}>
            <Presentation size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              PPT Slides Generated
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2 }}>
              {totalSlides}
            </h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'rgba(236, 72, 153, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            color: 'var(--accent-pink)'
          }}>
            <BookOpen size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Topics Auto-Tracked
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1.2 }}>
              {totalTopics}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Listing Section */}
      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Indexed Classes</span>
          <span style={{
            background: 'rgba(255,255,255,0.05)',
            fontSize: '0.8rem',
            padding: '2px 8px',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}>{filteredSessions.length}</span>
        </h3>

        {/* Empty State */}
        {filteredSessions.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '60px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(13, 20, 35, 0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <Presentation size={32} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Recorded Classes Found</h4>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '6px auto 0 auto', fontSize: '0.9rem' }}>
                {searchQuery ? "No classes match your search term. Try typing another keyword or clearing search." : "Start recording zoom classes or load a prepopulated sample class to explore slide generating."}
              </p>
            </div>
            
            {!searchQuery && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={onCreateDemoClass}>
                  <Sparkles size={16} />
                  <span>Create Demo Class</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredSessions.map((session) => {
              const minutes = Math.floor(session.duration / 60);
              const dateObj = new Date(session.createdAt);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '220px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Neon Glow Accents */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, var(--accent-purple-glow) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Header Title / Subject */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        background: 'rgba(147, 51, 234, 0.1)',
                        border: '1px solid rgba(147, 51, 234, 0.2)',
                        color: 'var(--text-accent)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '99px'
                      }}>
                        {session.subject}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {formattedDate}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      marginTop: '12px',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {session.title}
                    </h4>
                  </div>

                  {/* Metadata and Quick Actions */}
                  <div style={{ marginTop: '20px' }}>
                    
                    {/* Bottom Metadata */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      marginBottom: '12px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                        {minutes}m
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Presentation size={14} style={{ color: 'var(--accent-purple)' }} />
                        {session.slides.length} Slides
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={14} style={{ color: 'var(--accent-pink)' }} />
                        {session.transcript.length} Lines
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Left: Downloads */}
                      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => handleDownloadPPT(e, session)}
                          title="Download PPTX Slides"
                          style={{ padding: '6px 10px', borderRadius: '6px' }}
                        >
                          <Presentation size={14} style={{ color: '#ec4899' }} />
                          <span style={{ fontSize: '0.75rem' }}>PPTX</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => handleDownloadDOCX(e, session)}
                          title="Download Word Doc"
                          style={{ padding: '6px 10px', borderRadius: '6px' }}
                        >
                          <FileText size={14} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.75rem' }}>DOCX</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => handleDownloadPDF(e, session)}
                          title="Download PDF Study Guide"
                          style={{ padding: '6px 10px', borderRadius: '6px' }}
                        >
                          <Download size={14} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '0.75rem' }}>PDF</span>
                        </button>
                      </div>

                      {/* Right: Trash / Open */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-danger"
                          onClick={(e) => handleDelete(e, session.id)}
                          title="Delete Session"
                          style={{ padding: '6px 8px', borderRadius: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', borderRadius: '6px' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
