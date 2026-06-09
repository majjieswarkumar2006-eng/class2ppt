import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, VideoOff, CheckCircle, Mic, AlertCircle, Camera, Sparkles, Loader2,
  Link2, Monitor, ExternalLink, Radio
} from 'lucide-react';
import type { Session, Screenshot, TranscriptItem, Speaker } from '../utils/db';
import { LecturaDB } from '../utils/db';
import { generateSessionFromTranscript } from '../utils/gemini';
import { parseSessionLink, type ParsedSessionLink } from '../utils/sessionLink';
import { LiveTranscriber, isSpeechRecognitionSupported } from '../utils/speechRecognition';

interface RecorderProps {
  apiKey: string;
  onRecordingComplete: (session: Session) => void;
}

type RecordingMode = 'screen' | 'online' | 'simulate';
type RecorderStatus = 'idle' | 'recording' | 'processing' | 'completed';

const SPEAKER_COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

export default function Recorder({ apiKey, onRecordingComplete }: RecorderProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('screen');
  const [sessionLink, setSessionLink] = useState('');
  const [parsedLink, setParsedLink] = useState<ParsedSessionLink | null>(null);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [isSimulated, setIsSimulated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meetingWindowRef = useRef<Window | null>(null);

  const [simSpeaker, setSimSpeaker] = useState('Dr. Sarah Jenkins');
  const [simText, setSimText] = useState('Initializing simulated stream...');
  const [simTranscript, setSimTranscript] = useState<Array<{ speaker: string; text: string; time: number }>>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<TranscriptItem[]>([]);
  const elapsedRef = useRef(0);
  const screenshotsRef = useRef<Screenshot[]>([]);
  const transcriberRef = useRef<LiveTranscriber | null>(null);
  const interimTranscriptIdRef = useRef<string | null>(null);

  const speechSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    setParsedLink(sessionLink.trim() ? parseSessionLink(sessionLink) : null);
  }, [sessionLink]);

  const stopStreams = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
    }
    setScreenStream(null);
    setMicStream(null);
  }, [screenStream, micStream]);

  const stopTranscription = useCallback(() => {
    transcriberRef.current?.stop();
    transcriberRef.current = null;
    interimTranscriptIdRef.current = null;
  }, []);

  const closeMeetingWindow = useCallback(() => {
    if (meetingWindowRef.current && !meetingWindowRef.current.closed) {
      meetingWindowRef.current.close();
    }
    meetingWindowRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    timerRef.current = null;
    captureIntervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStreams();
      stopTranscription();
      closeMeetingWindow();
      clearTimers();
    };
  }, [stopStreams, stopTranscription, closeMeetingWindow, clearTimers]);

  const appendTranscriptLine = useCallback((speakerName: string, speakerId: string, text: string, time: number, replaceInterim = false) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (replaceInterim && interimTranscriptIdRef.current) {
      const idx = transcriptRef.current.findIndex(item => item.id === interimTranscriptIdRef.current);
      if (idx >= 0) {
        transcriptRef.current[idx] = { ...transcriptRef.current[idx], text: trimmed, time };
      } else {
        const id = interimTranscriptIdRef.current;
        transcriptRef.current.push({ id, speakerId, time, text: trimmed });
      }
      interimTranscriptIdRef.current = null;
    } else {
      const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      transcriptRef.current.push({ id, speakerId, time, text: trimmed });
    }

    setSimSpeaker(speakerName);
    setSimText(trimmed);
    setSimTranscript(prev => {
      if (replaceInterim && prev.length > 0 && !prev[prev.length - 1].speaker.includes('…')) {
        const updated = [...prev];
        updated[updated.length - 1] = { speaker: speakerName, text: trimmed, time };
        return updated;
      }
      return [...prev, { speaker: speakerName, text: trimmed, time }];
    });
  }, []);

  const startLiveTranscription = useCallback(() => {
    if (!speechSupported) {
      setTranscriptionStatus('Browser transcription unavailable — using timed captions.');
      return;
    }

    const transcriber = new LiveTranscriber();
    transcriberRef.current = transcriber;

    const started = transcriber.start(
      ({ text, isFinal }) => {
        const time = elapsedRef.current;
        const speakerName = 'Session Audio';
        const speakerId = 'spk_1';

        if (isFinal) {
          appendTranscriptLine(speakerName, speakerId, text, time, true);
        } else {
          if (!interimTranscriptIdRef.current) {
            interimTranscriptIdRef.current = `tx_interim_${Date.now()}`;
            transcriptRef.current.push({
              id: interimTranscriptIdRef.current,
              speakerId,
              time,
              text,
            });
            setSimSpeaker(`${speakerName} …`);
            setSimText(text);
            setSimTranscript(prev => [...prev, { speaker: `${speakerName} …`, text, time }]);
          } else {
            const idx = transcriptRef.current.findIndex(item => item.id === interimTranscriptIdRef.current);
            if (idx >= 0) transcriptRef.current[idx] = { ...transcriptRef.current[idx], text, time };
            setSimText(text);
            setSimTranscript(prev => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = { speaker: `${speakerName} …`, text, time };
              return updated;
            });
          }
        }
      },
      setTranscriptionStatus,
    );

    if (!started) {
      setTranscriptionStatus('Live transcription could not start. Captions may be limited.');
    }
  }, [appendTranscriptLine, speechSupported]);

  const triggerManualScreenshot = useCallback(() => {
    if (!videoRef.current || status !== 'recording') return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const shotId = `shot_${Date.now()}`;
      const newShot: Screenshot = {
        id: shotId,
        time: elapsedRef.current,
        dataUrl,
      };

      screenshotsRef.current = [...screenshotsRef.current, newShot];

      if (transcriptRef.current.length > 0) {
        transcriptRef.current[transcriptRef.current.length - 1].screenshotId = shotId;
      }

      const flash = document.getElementById('camera-flash');
      if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 300);
      }
    } catch (err) {
      console.error('Failed screen snapshot capture:', err);
    }
  }, [status]);

  const beginCaptureRecording = useCallback(async (mode: 'screen' | 'online', link?: ParsedSessionLink) => {
    setErrorMessage('');
    setIsSimulated(false);
    transcriptRef.current = [];
    screenshotsRef.current = [];
    setSimTranscript([]);
    setElapsedSeconds(0);
    elapsedRef.current = 0;

    try {
      if (mode === 'online' && link) {
        const popup = window.open(
          link.url,
          'lectura_online_session',
          'noopener,noreferrer,width=1280,height=720,menubar=no,toolbar=no,location=yes,status=no',
        );

        if (!popup) {
          throw new Error('Popup blocked. Allow popups for this site, or open the meeting link manually in a new tab.');
        }

        meetingWindowRef.current = popup;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      });

      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(audioStream);
      } catch (err) {
        console.warn('Microphone permission denied, recording shared audio only.', err);
      }

      setScreenStream(displayStream);
      setStatus('recording');

      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        videoRef.current.play().catch(e => console.error('Video play fail:', e));
      }

      displayStream.getVideoTracks()[0].onended = () => {
        handleStopRecordingRef.current();
      };

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);

      captureIntervalRef.current = setInterval(() => {
        triggerManualScreenshot();
      }, 15000);

      startLiveTranscription();
    } catch (err: unknown) {
      console.error(err);
      closeMeetingWindow();
      const msg = err instanceof Error
        ? err.message
        : 'Permissions were denied or screen sharing failed.';
      setErrorMessage(msg);
      setStatus('idle');
    }
  }, [closeMeetingWindow, startLiveTranscription, triggerManualScreenshot]);

  const handleStopRecordingRef = useRef<() => void>(() => {});

  const validateSetup = (): boolean => {
    if (!title.trim() || !subject.trim()) {
      alert('Please enter a Class Title and Subject first!');
      return false;
    }
    return true;
  };

  const handleStartScreenRecording = async () => {
    if (!validateSetup()) return;
    setRecordingMode('screen');
    await beginCaptureRecording('screen');
  };

  const handleStartOnlineRecording = async () => {
    if (!validateSetup()) return;

    const parsed = parseSessionLink(sessionLink);
    if (!parsed) {
      setErrorMessage('Enter a valid online session URL (Zoom, Teams, Google Meet, Webex, or any https link).');
      return;
    }

    setParsedLink(parsed);
    setRecordingMode('online');
    await beginCaptureRecording('online', parsed);
  };

  const openMeetingLink = () => {
    const parsed = parseSessionLink(sessionLink);
    if (!parsed) {
      setErrorMessage('Enter a valid session link before opening the meeting.');
      return;
    }
    setParsedLink(parsed);
    const popup = window.open(parsed.url, 'lectura_online_session', 'noopener,noreferrer,width=1280,height=720');
    if (popup) meetingWindowRef.current = popup;
    else setErrorMessage('Popup blocked. Allow popups or copy the link and open it manually.');
  };

  const handleStartSimulatedClass = () => {
    if (!validateSetup()) return;

    setErrorMessage('');
    setIsSimulated(true);
    setRecordingMode('simulate');
    screenshotsRef.current = [];
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setSimTranscript([]);
    transcriptRef.current = [];
    setStatus('recording');

    const simulationLines: Array<{ speaker: string; text: string; time: number; snap?: boolean }> = [
      { speaker: 'Dr. Sarah Jenkins', text: "Hello class! Let's get started. Today we are looking at state management.", time: 0 },
      { speaker: 'Dr. Sarah Jenkins', text: "First, let's understand why we use functional state hooks. In React, components re-render when state changes.", time: 4 },
      { speaker: 'Student Alex', text: "Sarah, does useState run asynchronously when updating?", time: 8 },
      { speaker: 'Dr. Sarah Jenkins', text: "Yes, Alex. Updates are batched for performance, so state isn't immediately updated on the next line.", time: 11 },
      { speaker: 'Dr. Sarah Jenkins', text: "Let's capture this React useState code sample on screen.", time: 15, snap: true },
      { speaker: 'Student Marcus', text: "What happens if we omit dependency parameters in useEffect?", time: 18 },
      { speaker: 'Dr. Sarah Jenkins', text: "Excellent question. The effect will run on *every* component render, which can crash the application.", time: 22 },
      { speaker: 'Dr. Sarah Jenkins', text: "Here is the lifecycle hook with event cleanup.", time: 25, snap: true },
      { speaker: 'Dr. Sarah Jenkins', text: "That wraps up our core topics today. I am ending the lecture stream now.", time: 29 },
    ];

    let lineIdx = 0;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const nextTime = elapsedRef.current;
      setElapsedSeconds(nextTime);

      const line = simulationLines.find(l => l.time === nextTime);
      if (line) {
        setSimSpeaker(line.speaker);
        setSimText(line.text);
        setSimTranscript(prevT => [...prevT, { speaker: line.speaker, text: line.text, time: nextTime }]);

        const speakerId = line.speaker === 'Dr. Sarah Jenkins' ? 'spk_1' : (line.speaker === 'Student Alex' ? 'spk_2' : 'spk_3');
        const transcriptItem: TranscriptItem = {
          id: `tx_${Date.now()}_${lineIdx++}`,
          speakerId,
          time: nextTime,
          text: line.text,
        };

        if (line.snap) {
          const mockCanvas = document.createElement('canvas');
          mockCanvas.width = 800;
          mockCanvas.height = 450;
          const ctx = mockCanvas.getContext('2d');
          if (ctx) {
            const grad = ctx.createLinearGradient(0, 0, 800, 450);
            grad.addColorStop(0, '#0a0e17');
            grad.addColorStop(1, '#1b263b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 800, 450);
            ctx.fillStyle = '#c084fc';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(`React State Class: Slide #${line.time === 15 ? '3' : '5'}`, 50, 60);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '18px Arial';
            if (line.time === 15) {
              ctx.fillText('• Hook variables declare local component state.', 50, 130);
              ctx.fillText('• Returns [currentState, setterFunction].', 50, 170);
              ctx.fillText('• Treats state values as immutable constants.', 50, 210);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(50, 260, 700, 140);
              ctx.fillStyle = '#38bdf8';
              ctx.font = '16px Courier New';
              ctx.fillText('const [count, setCount] = useState(0);', 70, 310);
              ctx.fillText('setCount(prev => prev + 1);', 70, 350);
            } else {
              ctx.fillText('• Side Effects run after DOM paint is complete.', 50, 130);
              ctx.fillText('• Use dependency arrays to dictate re-run bounds.', 50, 170);
              ctx.fillText('• Return a cleanup routine to prevent leaks.', 50, 210);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(50, 260, 700, 140);
              ctx.fillStyle = '#34d399';
              ctx.font = '16px Courier New';
              ctx.fillText('useEffect(() => {', 70, 290);
              ctx.fillText('  window.addEventListener("resize", handleResize);', 70, 320);
              ctx.fillText('  return () => window.removeEventListener("resize", handleResize);', 70, 350);
              ctx.fillText('}, []);', 70, 380);
            }
          }

          const shotId = `sim_shot_${Date.now()}`;
          const mockShot: Screenshot = { id: shotId, time: nextTime, dataUrl: mockCanvas.toDataURL('image/jpeg', 0.8) };
          screenshotsRef.current = [...screenshotsRef.current, mockShot];
          transcriptItem.screenshotId = shotId;

          const flash = document.getElementById('camera-flash');
          if (flash) {
            flash.style.opacity = '1';
            setTimeout(() => { flash.style.opacity = '0'; }, 300);
          }
        }

        transcriptRef.current.push(transcriptItem);
      }

      if (nextTime >= 30) {
        clearTimers();
        handleStopRecordingRef.current();
      }
    }, 1000);
  };

  const buildSpeakersFromTranscript = (duration: number): Speaker[] => {
    const speakerIds = [...new Set(transcriptRef.current.map(item => item.speakerId))];
    if (speakerIds.length === 0) {
      return [{ id: 'spk_1', name: 'Session Audio', color: SPEAKER_COLORS[0], duration }];
    }

    const totals = new Map<string, number>();
    transcriptRef.current.forEach(item => {
      totals.set(item.speakerId, (totals.get(item.speakerId) || 0) + Math.max(3, item.text.split(/\s+/).length));
    });

    const totalWeight = [...totals.values()].reduce((sum, value) => sum + value, 0) || 1;
    const nameMap: Record<string, string> = {
      spk_1: isSimulated ? 'Dr. Sarah Jenkins' : 'Session Audio',
      spk_2: isSimulated ? 'Student Alex' : 'Participant 2',
      spk_3: isSimulated ? 'Student Marcus' : 'Participant 3',
    };

    return speakerIds.map((id, index) => ({
      id,
      name: nameMap[id] || `Speaker ${index + 1}`,
      color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
      duration: Math.max(1, Math.round(duration * ((totals.get(id) || 1) / totalWeight))),
    }));
  };

  const handleStopRecording = async () => {
    setStatus('processing');
    stopStreams();
    stopTranscription();
    closeMeetingWindow();
    clearTimers();

    const duration = elapsedRef.current || 30;
    const speakersList = isSimulated
      ? [
          { id: 'spk_1', name: 'Dr. Sarah Jenkins', color: '#a855f7', duration: 21 },
          { id: 'spk_2', name: 'Student Alex', color: '#06b6d4', duration: 4 },
          { id: 'spk_3', name: 'Student Marcus', color: '#ec4899', duration: 5 },
        ]
      : buildSpeakersFromTranscript(duration);

    const rawTranscript = transcriptRef.current
      .filter(item => !item.id.startsWith('tx_interim_'))
      .map(line => {
        const spk = speakersList.find(s => s.id === line.speakerId)?.name || 'Speaker';
        return `[${line.time}s] ${spk}: ${line.text}`;
      })
      .join('\n');

    const currentScreenshots = screenshotsRef.current;
    const activeParsedLink = recordingMode === 'online' ? (parsedLink || parseSessionLink(sessionLink)) : null;

    try {
      const aiResult = await generateSessionFromTranscript(
        title || 'Untitled Session',
        subject || 'General Studies',
        rawTranscript || `[0s] Instructor: Recorded session "${title}" with limited transcript capture. Please infer topics from class title and subject.`,
        apiKey,
      );

      const newSession: Session = {
        id: `sess_${Date.now()}`,
        title: title || 'Untitled Class Recording',
        subject: subject || 'General Studies',
        createdAt: Date.now(),
        duration,
        sessionLink: activeParsedLink?.url,
        sessionPlatform: activeParsedLink?.label,
        recordingMode,
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        topics: aiResult.topics,
        examples: aiResult.examples,
        speakers: speakersList,
        transcript: transcriptRef.current.filter(item => !item.id.startsWith('tx_interim_')),
        screenshots: currentScreenshots,
        slides: aiResult.slides,
      };

      newSession.slides = newSession.slides.map(slide => {
        if (slide.type === 'visual' && currentScreenshots.length > 0) {
          const index = Math.min(slide.slideNumber % currentScreenshots.length, currentScreenshots.length - 1);
          return { ...slide, image: currentScreenshots[index].dataUrl };
        }
        return slide;
      });

      await LecturaDB.saveSession(newSession);
      setStatus('completed');

      setTimeout(() => {
        onRecordingComplete(newSession);
        setTitle('');
        setSubject('');
        setSessionLink('');
        setParsedLink(null);
        setRecordingMode('screen');
        setTranscriptionStatus('');
        setStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('AI Processing crashed:', err);
      setErrorMessage('Failed to compile class files via AI. See Developer console.');
      setStatus('idle');
    }
  };

  handleStopRecordingRef.current = handleStopRecording;

  const minutesStr = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secondsStr = (elapsedSeconds % 60).toString().padStart(2, '0');

  const recordingLabel = isSimulated
    ? 'Class Simulation Mode'
    : recordingMode === 'online'
      ? `Recording ${parsedLink?.label || 'Online Session'}`
      : 'Recording Screen Session';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
          Live <span className="gradient-text">Recording Studio</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Record screen shares, online class links, and live transcripts — then auto-generate slides and study guides.
        </p>
      </div>

      {status === 'idle' && (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} style={{ color: 'var(--accent-purple)' }} />
            <span>Classroom Setup</span>
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
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recording Source</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {([
                  { id: 'screen' as const, icon: Monitor, label: 'Screen Share', hint: 'Any app or tab' },
                  { id: 'online' as const, icon: Link2, label: 'Online Link', hint: 'Zoom, Teams, Meet' },
                  { id: 'simulate' as const, icon: Sparkles, label: 'Demo Class', hint: '30s sample' },
                ]).map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRecordingMode(option.id)}
                    className="btn"
                    style={{
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '12px 8px',
                      background: recordingMode === option.id ? 'rgba(147, 51, 234, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: recordingMode === option.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option.icon size={18} style={{ color: recordingMode === option.id ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{option.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {recordingMode === 'online' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Online Session Link
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/... or teams.microsoft.com/..."
                    className="glass-input"
                    value={sessionLink}
                    onChange={e => setSessionLink(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={openMeetingLink} title="Open meeting in new window">
                    <ExternalLink size={16} />
                  </button>
                </div>
                {parsedLink && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}>
                    <Radio size={14} />
                    <span>Detected: <strong>{parsedLink.label}</strong></span>
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Paste your Zoom, Teams, Google Meet, or Webex link. We will open the meeting, then ask you to share that browser tab with audio enabled for recording and live transcription.
                </p>
              </div>
            )}

            {recordingMode !== 'simulate' && (
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                lineHeight: 1.5,
              }}>
                {speechSupported
                  ? 'Live speech-to-text runs in Chrome/Edge. Allow microphone access for best transcript quality.'
                  : 'Use Chrome or Edge for live speech-to-text. Other browsers will still capture screen and screenshots.'}
              </div>
            )}

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

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
              {recordingMode === 'screen' && (
                <button className="btn btn-primary" onClick={handleStartScreenRecording} style={{ flex: 1, minWidth: '200px' }}>
                  <Video size={18} />
                  <span>Share Screen & Record</span>
                </button>
              )}

              {recordingMode === 'online' && (
                <button className="btn btn-primary" onClick={handleStartOnlineRecording} style={{ flex: 1, minWidth: '200px' }}>
                  <Link2 size={18} />
                  <span>Open Meeting & Record</span>
                </button>
              )}

              {recordingMode === 'simulate' && (
                <button
                  className="btn btn-secondary"
                  onClick={handleStartSimulatedClass}
                  style={{ flex: 1, minWidth: '200px', border: '1px dashed var(--accent-cyan)' }}
                >
                  <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Run 30s Demo Class</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'recording' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', height: '560px' }}>
          <div className="glass-panel" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            overflow: 'hidden',
            borderRadius: '16px',
          }}>
            <div id="camera-flash" style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: '#fff',
              opacity: 0,
              transition: 'opacity 0.1s ease',
              zIndex: 5,
              pointerEvents: 'none',
            }} />

            {recordingMode === 'online' && parsedLink && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                zIndex: 3,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                  <strong>{parsedLink.label}</strong>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>{parsedLink.url}</div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => window.open(parsedLink.url, 'lectura_online_session', 'noopener,noreferrer,width=1280,height=720')}
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                display: isSimulated ? 'none' : 'block',
                objectFit: 'contain',
              }}
              muted
              playsInline
            />

            {isSimulated && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', color: '#fff' }}>
                <div className="pulse-indicator" style={{ width: '12px', height: '12px', margin: '0 auto' }} />
                <h4 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Simulated Presentation Stream</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Broadcasting educational slides and screen shares to student nodes...
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  maxWidth: '360px',
                  margin: '10px auto',
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Active Speaker
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{simSpeaker}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                    "{simText}"
                  </div>
                </div>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '12px 24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="pulse-indicator" />
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff' }}>
                  {minutesStr}:{secondsStr}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>|</span>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{recordingLabel}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!isSimulated && (
                  <button
                    className="btn btn-secondary"
                    onClick={triggerManualScreenshot}
                    title="Capture Screen Screenshot Now"
                    style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff' }}
                  >
                    <Camera size={16} />
                    <span>Snapshot</span>
                  </button>
                )}
                <button className="btn btn-danger" onClick={handleStopRecording} style={{ padding: '8px 16px' }}>
                  <VideoOff size={16} />
                  <span>End & Compile AI</span>
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Mic size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Real-Time Transcripts</span>
            </h4>

            {transcriptionStatus && !isSimulated && (
              <p style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '8px' }}>{transcriptionStatus}</p>
            )}

            <div style={{
              flex: 1,
              overflowY: 'auto',
              margin: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.85rem',
            }}>
              {simTranscript.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
                  {isSimulated ? 'Waiting for speech transcripts...' : 'Listening for live speech — speak or play session audio.'}
                </div>
              ) : (
                simTranscript.map((t, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '10px',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: t.speaker.includes('Jenkins') || t.speaker.includes('Instructor') || t.speaker.includes('Session')
                          ? 'var(--text-accent)'
                          : 'var(--accent-cyan)',
                      }}>
                        {t.speaker}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                        {Math.floor(t.time / 60)}:{(t.time % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)' }}>{t.text}</p>
                  </div>
                ))
              )}
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {isSimulated ? 'Mic Level Indicator' : 'Transcription Engine'}
              </span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '14px' }}>
                <div className="wave-bar" style={{ height: '6px', animationDuration: '0.7s' }} />
                <div className="wave-bar" style={{ height: '12px', animationDuration: '0.4s' }} />
                <div className="wave-bar" style={{ height: '8px', animationDuration: '0.9s' }} />
                <div className="wave-bar" style={{ height: '14px', animationDuration: '0.5s' }} />
                <div className="wave-bar" style={{ height: '5px', animationDuration: '0.8s' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="glass-panel" style={{
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <Loader2 size={48} style={{ color: 'var(--accent-purple)', animation: 'spin 1.5s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <div>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Assembling Class Material</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              LecturaAI is analyzing speech timelines, syncing screenshots, generating summaries, and drafting PowerPoint slides...
            </p>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="glass-panel" style={{
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <CheckCircle size={56} style={{ color: 'var(--status-success)' }} />
          <div>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Session Compiled Successfully!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
              All transcripts, screenshots, study guides, and PowerPoint decks are ready in your Vault.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
