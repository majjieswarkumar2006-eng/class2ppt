import { useState } from 'react';
import { Download, Palette, ChevronLeft, ChevronRight, Plus, Trash2, AlignLeft } from 'lucide-react';
import type { Session, Slide } from '../utils/db';
import { LecturaDB } from '../utils/db';
import { generatePPT } from '../utils/pptGenerator';

interface SlideDeckProps {
  session: Session;
  onUpdateSession: (updatedSession: Session) => void;
}

export default function SlideDeck({ session, onUpdateSession }: SlideDeckProps) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [slideTheme, setSlideTheme] = useState<'dark' | 'blue' | 'light'>('dark');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const activeSlide = session.slides[activeSlideIdx];

  // Generate and download PPTX
  const handleExportPPTX = async () => {
    try {
      await generatePPT(session, slideTheme);
    } catch (err) {
      console.error(err);
      alert('Could not generate PPTX file. Check Developer console.');
    }
  };

  // Modify active slide text
  const handleUpdateSlideTitle = (newTitle: string) => {
    const updatedSlides = [...session.slides];
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      title: newTitle
    };
    
    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  const handleUpdateBulletPoint = (bulletIdx: number, newText: string) => {
    const updatedSlides = [...session.slides];
    const updatedContent = [...activeSlide.content];
    updatedContent[bulletIdx] = newText;
    
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      content: updatedContent
    };
    
    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  const handleAddBulletPoint = () => {
    const updatedSlides = [...session.slides];
    const updatedContent = [...activeSlide.content, 'New bullet point'];
    
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      content: updatedContent
    };

    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  const handleRemoveBulletPoint = (bulletIdx: number) => {
    const updatedSlides = [...session.slides];
    const updatedContent = activeSlide.content.filter((_, idx) => idx !== bulletIdx);
    
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      content: updatedContent
    };

    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  const handleUpdateCodeBlock = (newCode: string) => {
    const updatedSlides = [...session.slides];
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      codeBlock: newCode
    };

    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  const handleUpdateNotes = (newNotes: string) => {
    const updatedSlides = [...session.slides];
    updatedSlides[activeSlideIdx] = {
      ...activeSlide,
      notes: newNotes
    };

    const updatedSession = { ...session, slides: updatedSlides };
    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
  };

  // Add / Delete Slides
  const handleAddNewSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      slideNumber: session.slides.length + 1,
      title: 'New Slide Title',
      type: 'content',
      content: ['Bullet point explanation 1', 'Bullet point explanation 2'],
      notes: 'Instructor explanation details.'
    };

    const updatedSession = {
      ...session,
      slides: [...session.slides, newSlide]
    };

    onUpdateSession(updatedSession);
    LecturaDB.saveSession(updatedSession);
    setActiveSlideIdx(session.slides.length); // switch to new slide
  };

  const handleDeleteActiveSlide = () => {
    if (session.slides.length <= 1) {
      alert('A presentation deck must contain at least one slide!');
      return;
    }
    if (confirm('Are you sure you want to delete this slide from the presentation?')) {
      const filteredSlides = session.slides.filter((_, idx) => idx !== activeSlideIdx);
      
      // Re-index slide numbers
      const reindexedSlides = filteredSlides.map((s, index) => ({
        ...s,
        slideNumber: index + 1
      }));

      const updatedSession = {
        ...session,
        slides: reindexedSlides
      };

      onUpdateSession(updatedSession);
      LecturaDB.saveSession(updatedSession);
      setActiveSlideIdx(Math.max(0, activeSlideIdx - 1));
    }
  };

  // Theme Class mapper
  const getThemeClass = () => {
    if (slideTheme === 'blue') return 'slide-theme-blue';
    if (slideTheme === 'light') return 'slide-theme-light';
    return 'slide-theme-dark';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr 280px',
      gap: '20px',
      height: '520px',
      marginTop: '10px'
    }}>
      
      {/* 1. Left Thumbnail list */}
      <div className="glass-panel" style={{
        padding: '12px 8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>SLIDES</span>
          <button className="btn btn-secondary" onClick={handleAddNewSlide} style={{ padding: '3px 6px', borderRadius: '4px' }} title="Add New Slide">
            <Plus size={12} />
          </button>
        </div>

        {session.slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setActiveSlideIdx(idx)}
            style={{
              cursor: 'pointer',
              border: idx === activeSlideIdx ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #0b0f19 0%, #161f30 100%)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              opacity: idx === activeSlideIdx ? 1 : 0.6
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{slide.slideNumber}</span>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 'bold',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              color: '#fff'
            }}>
              {slide.title}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Middle Slide Preview and Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Actual Preview Canvas */}
        <div className={`slide-preview-card ${getThemeClass()}`} style={{ flex: 1, padding: '32px' }}>
          
          {/* Header Branding */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.5 }}>
              {session.subject}
            </span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.5 }}>
              Slide {activeSlide.slideNumber} of {session.slides.length}
            </span>
          </div>

          {/* Slide Title */}
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px' }}>
            {activeSlide.title}
          </h2>

          {/* Slide Body Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeSlide.type === 'code' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', height: '100%' }}>
                {/* Bullets */}
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeSlide.content.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ fontSize: '0.95rem' }}>{bullet}</li>
                  ))}
                </ul>
                {/* Code block preview */}
                <pre style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.75rem',
                  fontFamily: 'Courier New, monospace',
                  color: '#34d399',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  maxHeight: '180px'
                }}>
                  {activeSlide.codeBlock || '// Code Block'}
                </pre>
              </div>
            ) : activeSlide.image ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', height: '100%' }}>
                {/* Bullets */}
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeSlide.content.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ fontSize: '0.95rem' }}>{bullet}</li>
                  ))}
                </ul>
                {/* Screenshot Reference */}
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={activeSlide.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Slide visual" />
                </div>
              </div>
            ) : (
              /* Standard bullet points layout */
              <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeSlide.content.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: '1.05rem', lineHeight: 1.4 }}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', opacity: 0.5 }}>
            <span>LecturaAI Presentation Builder</span>
            <span>{session.title}</span>
          </div>
        </div>

        {/* Quick Prev / Next Slides toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              disabled={activeSlideIdx === 0}
              onClick={() => setActiveSlideIdx(p => p - 1)}
              style={{ padding: '8px 14px' }}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={activeSlideIdx === session.slides.length - 1}
              onClick={() => setActiveSlideIdx(p => p + 1)}
              style={{ padding: '8px 14px' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <button className="btn btn-danger" onClick={handleDeleteActiveSlide} style={{ padding: '8px 12px' }}>
            <Trash2 size={15} />
            <span>Delete Slide</span>
          </button>
        </div>
      </div>

      {/* 3. Right Slide Properties Panel */}
      <div className="glass-panel" style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <AlignLeft size={16} style={{ color: 'var(--accent-purple)' }} />
            <span>Slide Properties</span>
          </h3>

          {/* Slide Title Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Title Text</label>
            <input
              type="text"
              className="glass-input"
              value={activeSlide.title}
              onChange={e => handleUpdateSlideTitle(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Bullet Points editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bullet Points</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSlide.content.map((point, bIdx) => (
                <div key={bIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="glass-input"
                    value={point}
                    onChange={e => handleUpdateBulletPoint(bIdx, e.target.value)}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRemoveBulletPoint(bIdx)}
                    style={{ padding: '6px 8px', borderRadius: '6px' }}
                    title="Remove Bullet"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary"
                onClick={handleAddBulletPoint}
                style={{ alignSelf: 'flex-start', padding: '5px 10px', fontSize: '0.75rem' }}
              >
                <Plus size={12} />
                <span>Add Bullet</span>
              </button>
            </div>
          </div>

          {/* Code Block Editor (Conditional) */}
          {activeSlide.type === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Code Block Contents</label>
              <textarea
                className="glass-input"
                rows={5}
                value={activeSlide.codeBlock || ''}
                onChange={e => handleUpdateCodeBlock(e.target.value)}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre', resize: 'vertical' }}
              />
            </div>
          )}

          {/* Speaker Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Speaker Notes</label>
              <button
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                {isEditingNotes ? 'Done' : 'Edit'}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea
                className="glass-input"
                rows={3}
                value={activeSlide.notes || ''}
                onChange={e => handleUpdateNotes(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
            ) : (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.01)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.03)',
                minHeight: '40px'
              }}>
                {activeSlide.notes || 'No speaker notes written for this slide.'}
              </p>
            )}
          </div>
        </div>

        {/* Theme Picker and Export Button */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Theme Palette switcher */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <Palette size={14} />
              <span>Presentation Theme</span>
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSlideTheme('dark')}
                style={{
                  flex: 1,
                  background: '#0F172A',
                  border: slideTheme === 'dark' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Slate
              </button>
              <button
                onClick={() => setSlideTheme('blue')}
                style={{
                  flex: 1,
                  background: '#0B2545',
                  border: slideTheme === 'blue' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Blue
              </button>
              <button
                onClick={() => setSlideTheme('light')}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  border: slideTheme === 'light' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  color: '#111',
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Light
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExportPPTX}
            style={{ width: '100%', padding: '12px' }}
          >
            <Download size={16} />
            <span>Export PPTX File</span>
          </button>
        </div>

      </div>

    </div>
  );
}
