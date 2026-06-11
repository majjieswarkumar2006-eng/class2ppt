import { LayoutDashboard, Video, Settings, Sparkles, Database, ShieldAlert, ShieldCheck, Link2 } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'recorder' | 'settings' | 'session-view' | 'link-importer';
  setView: (view: 'dashboard' | 'recorder' | 'settings' | 'link-importer') => void;
  apiKey: string;
  sessionCount: number;
}

export default function Sidebar({ currentView, setView, apiKey, sessionCount }: SidebarProps) {
  const hasApiKey = apiKey && apiKey.trim() !== '';

  return (
    <aside className="glass-panel" style={{
      height: 'calc(100vh - 20px)',
      margin: '10px',
      width: '240px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      borderRadius: '20px',
      zIndex: 10,
      borderRight: '1px solid var(--border-color)'
    }}>
      {/* Top Branding Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Lectura<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              VIRTUAL ACADEMY
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setView('dashboard')}
            className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              border: 'none',
              width: '100%',
              background: currentView === 'dashboard' ? undefined : 'transparent'
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setView('recorder')}
            className={`btn ${currentView === 'recorder' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              border: 'none',
              width: '100%',
              background: currentView === 'recorder' ? undefined : 'transparent'
            }}
          >
            <Video size={18} />
            <span>Record Session</span>
            {currentView === 'recorder' && <span className="pulse-indicator" style={{ marginLeft: 'auto' }}></span>}
          </button>

          <button
            onClick={() => setView('link-importer')}
            className={`btn ${currentView === 'link-importer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              border: 'none',
              width: '100%',
              background: currentView === 'link-importer' ? undefined : 'transparent'
            }}
          >
            <Link2 size={18} />
            <span>Import Link</span>
          </button>

          <button
            onClick={() => setView('settings')}
            className={`btn ${currentView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              border: 'none',
              width: '100%',
              background: currentView === 'settings' ? undefined : 'transparent'
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Status / Database Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: 'var(--text-secondary)' }}>
            <Database size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Local Database</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {sessionCount} Classes
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            color: hasApiKey ? 'var(--status-success)' : 'var(--text-muted)'
          }}>
            {hasApiKey ? (
              <>
                <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Gemini Cloud AI Active</span>
              </>
            ) : (
              <>
                <ShieldAlert size={14} style={{ color: 'var(--status-warning)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Simulation Fallback Active</span>
              </>
            )}
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}>
          LecturaAI Studio v1.2.0<br />
          Pair Programming Build
        </div>
      </div>
    </aside>
  );
}
