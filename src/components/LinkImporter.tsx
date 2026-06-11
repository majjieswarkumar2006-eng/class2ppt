import { useState } from 'react';
import { Link2, AlertCircle, Sparkles, Presentation, Loader2 } from 'lucide-react';
import type { Session } from '../utils/db';
import { LecturaDB } from '../utils/db';
import { generateSessionFromLink } from '../utils/gemini';

interface LinkImporterProps {
  apiKey: string;
  onImportComplete: (session: Session) => void;
}

export default function LinkImporter({ apiKey, onImportComplete }: LinkImporterProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleImport = async () => {
    if (!title.trim() || !subject.trim() || !sessionLink.trim()) {
      alert('Please fill out all fields before importing.');
      return;
    }

    setErrorMessage('');
    setStatus('processing');

    try {
      const newSession = await generateSessionFromLink(sessionLink, title, subject, apiKey);
      
      await LecturaDB.saveSession(newSession);
      setStatus('completed');
      
      setTimeout(() => {
        onImportComplete(newSession);
        setTitle('');
        setSubject('');
        setSessionLink('');
        setStatus('idle');
      }, 1500);

    } catch (err) {
      console.error('Failed to import link:', err);
      setErrorMessage('Failed to process the link. Please check your network and API key.');
      setStatus('idle');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
          Import <span className="gradient-text">From Link</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Paste a Zoom, Teams, or YouTube link to automatically generate slides and transcripts.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '30px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link2 size={20} style={{ color: 'var(--accent-cyan)' }} />
          <span>Link Setup</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Class Title</label>
            <input
              type="text"
              placeholder="e.g., React State & Side Effects Masterclass"
              className="glass-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={status !== 'idle'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject / Course Name</label>
            <input
              type="text"
              placeholder="e.g., Web Development 101"
              className="glass-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={status !== 'idle'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Class Video / Meeting Link</label>
            <input
              type="url"
              placeholder="https://youtube.com/... or https://zoom.us/..."
              className="glass-input"
              value={sessionLink}
              onChange={e => setSessionLink(e.target.value)}
              disabled={status !== 'idle'}
            />
          </div>

          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            {status === 'idle' && (
              <button className="btn btn-primary" onClick={handleImport} style={{ width: '100%', padding: '14px' }}>
                <Sparkles size={18} />
                <span>Import & Generate PPT</span>
              </button>
            )}

            {status === 'processing' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '30px 0',
                color: 'var(--accent-purple)'
              }}>
                <Loader2 size={36} className="spin-animation" />
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>Extracting & Generating</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Simulating transcript extraction and building slides...</p>
                </div>
              </div>
            )}

            {status === 'completed' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '20px',
                color: '#34d399',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Presentation size={32} />
                <span style={{ fontWeight: 600 }}>Presentation Ready! Redirecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
