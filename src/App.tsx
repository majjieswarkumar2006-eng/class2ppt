import { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Recorder from './components/Recorder';
import LinkImporter from './components/LinkImporter';
import SessionView from './components/SessionView';
import Settings from './components/Settings';
import { LecturaDB } from './utils/db';
import type { Session } from './utils/db';
import { generateSessionFromTranscript } from './utils/gemini';

export default function App() {
  const [currentView, setView] = useState<'dashboard' | 'recorder' | 'settings' | 'session-view' | 'link-importer'>('dashboard');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiKey, setApiKey] = useState('');

  // 1. Initial configuration loads
  useEffect(() => {
    // Load API Key
    const savedKey = localStorage.getItem('lectura_gemini_api_key') || '';
    setApiKey(savedKey);

    // Initialize Database and Load sessions
    const initDb = async () => {
      try {
        await LecturaDB.open();
        refreshSessions();
      } catch (err) {
        console.error('Failed to open local database:', err);
      }
    };
    initDb();
  }, []);

  const refreshSessions = async () => {
    try {
      const list = await LecturaDB.getAllSessions();
      setSessions(list);
      
      // If we are currently viewing a session, refresh its object too
      if (selectedSession) {
        const freshSession = list.find(s => s.id === selectedSession.id);
        if (freshSession) {
          setSelectedSession(freshSession);
        } else {
          setSelectedSession(null);
          setView('dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to reload sessions from store:', err);
    }
  };

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    setView('session-view');
  };

  const handleUpdateSession = async (updatedSession: Session) => {
    setSelectedSession(updatedSession);
    // Refresh parent array
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleRecordingComplete = (newSession: Session) => {
    refreshSessions();
    setSelectedSession(newSession);
    setView('session-view');
  };

  const handleCreateDemoClass = async () => {
    const title = 'React Hooks & State Lifecycles';
    const subject = 'Web Development';
    const mockTranscript = "[0s] Instructor: Welcome to class. Today we learn React useState and useEffect hooks.";

    try {
      // Generate structured data using our helper
      const aiResult = await generateSessionFromTranscript(title, subject, mockTranscript, '');
      
      // Create detailed session structure with screenshots
      const demoSession: Session = {
        id: `sess_demo_${Date.now()}`,
        title,
        subject,
        createdAt: Date.now() - 3600000 * 2, // 2 hours ago
        duration: 1800, // 30 minutes
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        topics: aiResult.topics,
        examples: aiResult.examples,
        speakers: [
          { id: 'spk_1', name: 'Dr. Sarah Jenkins', color: '#a855f7', duration: 1260 },
          { id: 'spk_2', name: 'Student Alex', color: '#06b6d4', duration: 240 },
          { id: 'spk_3', name: 'Student Marcus', color: '#ec4899', duration: 300 }
        ],
        transcript: [
          { id: 'tx_d1', speakerId: 'spk_1', time: 5, text: "Welcome back everyone. Today we are exploring state and side effects in React functional components." },
          { id: 'tx_d2', speakerId: 'spk_1', time: 30, text: "First, let's understand why we use functional state hooks. React uses a Virtual DOM tree to compute UI alterations efficiently." },
          { id: 'tx_d3', speakerId: 'spk_2', time: 330, text: "Dr. Jenkins, is it correct that calling setState triggers a render diffing process?" },
          { id: 'tx_d4', speakerId: 'spk_1', time: 350, text: "Exactly, Alex. React diffs the updated Virtual DOM and applies only the changes to the browser DOM." },
          { id: 'tx_d5', speakerId: 'spk_1', time: 915, text: "Let's write a simple Counter code block to see useState in action." },
          { id: 'tx_d6', speakerId: 'spk_3', time: 1245, text: "What happens if we omit dependency parameters in useEffect?" },
          { id: 'tx_d7', speakerId: 'spk_1', time: 1265, text: "If omitted, the effect fires on every render. That causes infinite loops. Always check your hooks array!" },
          { id: 'tx_d8', speakerId: 'spk_1', time: 1620, text: "Make sure you return a cleanup function when declaring click subscriptions to prevent memory leaks." }
        ],
        screenshots: [],
        slides: aiResult.slides
      };

      // Draw a mock slide screenshot inside browser memory for presentation preview
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 640, 360);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);
        // Text
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('React State Hooks Masterclass', 40, 60);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Arial';
        ctx.fillText('Course: Web Development • Dr. Jenkins', 40, 95);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('• Component state maintains mutable UI bindings.', 40, 160);
        ctx.fillText('• useState triggers target reconciliation loops.', 40, 200);
        ctx.fillText('• Hooks enforce functional purity inside render frames.', 40, 240);
        
        const shotUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        demoSession.screenshots = [
          { id: 'sim_shot_d1', time: 915, dataUrl: shotUrl }
        ];

        // Bind screenshot to visual slide type
        demoSession.slides = demoSession.slides.map(s => {
          if (s.type === 'visual') {
            return { ...s, image: shotUrl };
          }
          return s;
        });

        // Attach screenshot references back to transcript items
        demoSession.transcript[4].screenshotId = 'sim_shot_d1';
      }

      await LecturaDB.saveSession(demoSession);
      refreshSessions();
      alert('Demo React class successfully imported to your Local Vault!');
    } catch (err) {
      console.error(err);
      alert('Failed to import demo files.');
    }
  };

  const handleSidebarViewSwitch = (view: 'dashboard' | 'recorder' | 'settings' | 'link-importer') => {
    setView(view);
    setSelectedSession(null);
  };

  return (
    <div className="app-grid">
      <SpeedInsights />
      
      {/* 1. Collapsible sidebar */}
      <Sidebar
        currentView={currentView}
        setView={handleSidebarViewSwitch}
        apiKey={apiKey}
        sessionCount={sessions.length}
      />

      {/* 2. Main content container */}
      <main className="content-container">
        
        {/* Top visual accent blur */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Scrollable page body */}
        <div className="main-scrollable" style={{ zIndex: 2 }}>
          {currentView === 'dashboard' && (
            <Dashboard
              sessions={sessions}
              onSelectSession={handleSelectSession}
              refreshSessions={refreshSessions}
              onCreateDemoClass={handleCreateDemoClass}
            />
          )}

          {currentView === 'recorder' && (
            <Recorder
              apiKey={apiKey}
              onRecordingComplete={handleRecordingComplete}
            />
          )}

          {currentView === 'link-importer' && (
            <LinkImporter
              apiKey={apiKey}
              onImportComplete={handleRecordingComplete}
            />
          )}

          {currentView === 'settings' && (
            <Settings
              apiKey={apiKey}
              setApiKey={setApiKey}
              refreshSessions={refreshSessions}
            />
          )}

          {currentView === 'session-view' && selectedSession && (
            <SessionView
              session={selectedSession}
              apiKey={apiKey}
              onBack={() => setView('dashboard')}
              onUpdateSession={handleUpdateSession}
            />
          )}
        </div>
      </main>

    </div>
  );
}
