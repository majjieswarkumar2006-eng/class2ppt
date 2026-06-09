import { useState } from 'react';
import { Key, Eye, EyeOff, Database, Trash2, Info, ShieldCheck } from 'lucide-react';
import { LecturaDB } from '../utils/db';

interface SettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  refreshSessions: () => void;
}

export default function Settings({ apiKey, setApiKey, refreshSessions }: SettingsProps) {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSaveKey = () => {
    setApiKey(tempKey);
    localStorage.setItem('lectura_gemini_api_key', tempKey);
    setSuccessMessage('Gemini Developer API Key updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleClearDb = async () => {
    if (confirm('CAUTION: This will delete all recorded classes, transcripts, summaries, and PowerPoint files permanently from your local browser storage. This action cannot be undone. Are you sure?')) {
      await LecturaDB.clearAll();
      refreshSessions();
      alert('Local Database cleared successfully.');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
          System <span className="gradient-text">Configuration</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure developer API endpoints, local database options, and presentation designs.
        </p>
      </div>

      {/* API Configuration Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Gemini Developer Integration</span>
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
          To generate highly detailed summaries, transcripts, and PowerPoint files using real-time AI, please enter your Gemini Developer API Key. The key is stored securely in your browser's local storage and never leaves your machine.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Key Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Gemini API Key
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                className="glass-input"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                style={{ width: '100%', paddingRight: '46px', fontSize: '0.9rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {successMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#a7f3d0',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={16} style={{ color: 'var(--status-success)' }} />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSaveKey}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
          >
            <span>Save API Key</span>
          </button>
        </div>
      </div>

      {/* Database Maintenance Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Local Vault Maintenance</span>
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
          Your classroom sessions, full transcripts, slides, and screenshot captures are saved locally inside your browser's IndexedDB system. Clearing the database releases browser memory but wipes all classes.
        </p>

        <button
          className="btn btn-danger"
          onClick={handleClearDb}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Trash2 size={16} />
          <span>Reset Local Database</span>
        </button>
      </div>

      {/* Recorder Support Information Card */}
      <div className="glass-panel" style={{ padding: '24px', background: 'rgba(6, 182, 212, 0.02)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Web Screen Recording Tips</span>
        </h3>
        
        <ul style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          paddingLeft: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          lineHeight: 1.5
        }}>
          <li>To capture class audio from Zoom/Meet/Teams, click <strong>"Share Screen"</strong>, select the specific browser tab playing the session, and make sure to check the <strong>"Share tab audio"</strong> checkbox in the popup menu.</li>
          <li>For full-screen apps, selecting <strong>"Entire Screen"</strong> works, but capturing system audio is only supported by modern Chrome/Edge browsers on Windows.</li>
          <li>Screenshot captures are triggered automatically when the AI detects slide changes, or when you click the <strong>"Snapshot"</strong> HUD button in real-time.</li>
        </ul>
      </div>

    </div>
  );
}
