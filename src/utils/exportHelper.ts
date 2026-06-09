import type { Session } from './db';

// Helper to download blob
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. GENERATE DOCX (Word Document)
export function exportToDOCX(session: Session): void {
  const cleanTitle = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date(session.createdAt).toLocaleDateString();

  // We compile a rich HTML document formatted specifically for Word compatibility.
  // Using Microsoft Word-supported styling namespaces.
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${session.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 1in;
        }
        h1 {
          font-family: 'Georgia', serif;
          color: #4c1d95;
          font-size: 26pt;
          border-bottom: 2px solid #8b5cf6;
          padding-bottom: 6px;
          margin-top: 0;
        }
        h2 {
          font-family: 'Arial', sans-serif;
          color: #1e3a8a;
          font-size: 16pt;
          margin-top: 24pt;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
        }
        h3 {
          font-family: 'Arial', sans-serif;
          color: #0d9488;
          font-size: 13pt;
          margin-top: 16pt;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20pt;
        }
        .meta-table td {
          padding: 6px;
          border: 1px solid #e2e8f0;
          font-size: 10pt;
        }
        .meta-label {
          font-weight: bold;
          background-color: #f8fafc;
          width: 120px;
        }
        .summary-box {
          background-color: #f5f3ff;
          border-left: 4px solid #8b5cf6;
          padding: 12pt;
          margin: 12pt 0;
          font-style: italic;
        }
        .keypoint-list {
          padding-left: 20px;
        }
        .keypoint-list li {
          margin-bottom: 6px;
        }
        .topic-row {
          margin-bottom: 12pt;
          padding-bottom: 12pt;
          border-bottom: 1px dotted #e2e8f0;
        }
        .timestamp {
          color: #06b6d4;
          font-weight: bold;
          font-family: monospace;
        }
        .code-block {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 10pt;
          font-family: 'Courier New', monospace;
          font-size: 9.5pt;
          white-space: pre-wrap;
          margin: 8pt 0;
        }
        .transcript-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12pt;
        }
        .transcript-table td {
          padding: 8px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
          font-size: 10pt;
        }
        .speaker-name {
          font-weight: bold;
          color: #4b5563;
          width: 130px;
        }
        .time-label {
          color: #9ca3af;
          font-family: monospace;
          font-size: 9pt;
          width: 60px;
        }
      </style>
    </head>
    <body>
      <h1>${session.title}</h1>
      
      <table class="meta-table">
        <tr>
          <td class="meta-label">Subject / Course</td>
          <td>${session.subject}</td>
          <td class="meta-label">Recording Date</td>
          <td>${dateStr}</td>
        </tr>
        <tr>
          <td class="meta-label">Duration</td>
          <td>${Math.round(session.duration / 60)} minutes</td>
          <td class="meta-label">Exported Via</td>
          <td>LecturaAI Platform</td>
        </tr>
      </table>

      <h2>1. Overview & Class Summary</h2>
      <div class="summary-box">
        ${session.summary}
      </div>

      <h2>2. Key Core Concepts</h2>
      <ul class="keypoint-list">
        ${session.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
      </ul>

      <h2>3. Speaker Track Times</h2>
      <ul>
        ${session.speakers.map(sp => {
          const minutes = Math.floor(sp.duration / 60);
          const seconds = sp.duration % 60;
          return `<li><strong>${sp.name}</strong>: ${minutes}m ${seconds}s (${Math.round((sp.duration / (session.duration || 1)) * 100)}% of session)</li>`;
        }).join('')}
      </ul>

      <h2>4. Lesson Outline & Topic Sequence</h2>
      ${session.topics.map((topic) => `
        <div class="topic-row">
          <span class="timestamp">[${topic.time}]</span> <strong>${topic.title}</strong>
          <p>${topic.description}</p>
        </div>
      `).join('')}

      <h2>5. Code Blocks & Examples</h2>
      ${session.examples.length === 0 ? '<p>No code examples recorded during this session.</p>' : 
        session.examples.map(ex => `
          <h3>${ex.concept}</h3>
          <p><em>From topic: ${ex.topic}</em></p>
          <pre class="code-block">${ex.codeOrText}</pre>
        `).join('')
      }

      <br style="page-break-before: always;" />

      <h2>6. Verbatim Transcript</h2>
      <table class="transcript-table">
        ${session.transcript.map(item => {
          const speakerObj = session.speakers.find(s => s.id === item.speakerId);
          const name = speakerObj ? speakerObj.name : 'Unknown Speaker';
          
          const m = Math.floor(item.time / 60);
          const s = Math.floor(item.time % 60);
          const padS = s.toString().padStart(2, '0');
          const timeString = `${m}:${padS}`;

          return `
            <tr>
              <td class="time-label">[${timeString}]</td>
              <td class="speaker-name">${name}</td>
              <td>${item.text}</td>
            </tr>
          `;
        }).join('')}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  
  downloadFile(blob, `${cleanTitle}_study_guide.doc`);
}

// 2. GENERATE PDF (via beautiful dynamic print window)
export function exportToPDF(session: Session): void {
  const dateStr = new Date(session.createdAt).toLocaleDateString();
  const durationMin = Math.round(session.duration / 60);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF!');
    return;
  }

  // Compile full printable structure
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>LecturaAI Study Book - ${session.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          background: #ffffff;
          line-height: 1.6;
          margin: 0;
          padding: 40px;
          font-size: 11pt;
        }
        
        /* Cover Page Styling */
        .cover-page {
          height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-left: 6px solid #7c3aed;
          padding-left: 40px;
          margin-bottom: 100px;
          page-break-after: always;
        }
        .cover-sub {
          color: #7c3aed;
          font-size: 14pt;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .cover-title {
          font-family: 'Outfit', sans-serif;
          font-size: 36pt;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
          margin: 0 0 10px 0;
        }
        .cover-meta {
          font-size: 12pt;
          color: #6b7280;
          margin-top: 40px;
        }
        
        /* General Headings */
        h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 18pt;
          color: #111827;
          margin-top: 30pt;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 6px;
          page-break-after: avoid;
        }
        
        h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 14pt;
          color: #4f46e5;
          margin-top: 20pt;
          page-break-after: avoid;
        }
        
        /* Layout Blocks */
        .summary-box {
          background-color: #f9f5ff;
          border-left: 4px solid #7c3aed;
          padding: 16px;
          border-radius: 4px;
          font-style: italic;
          margin: 20px 0;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #f9fafb;
        }
        
        .code-block {
          background-color: #1f2937;
          color: #34d399;
          font-family: 'Courier New', monospace;
          font-size: 10pt;
          padding: 15px;
          border-radius: 6px;
          white-space: pre-wrap;
          overflow-x: auto;
          margin: 15px 0;
        }
        
        .screenshot-img {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        /* Topics list */
        .topic-timeline {
          margin-top: 20px;
        }
        .topic-item {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .topic-time {
          font-family: monospace;
          font-weight: bold;
          color: #0891b2;
          background: #ecfeff;
          padding: 4px 8px;
          border-radius: 4px;
          align-self: flex-start;
          font-size: 10pt;
        }
        .topic-body h4 {
          margin: 0 0 4px 0;
          font-size: 12pt;
          color: #111827;
        }
        
        /* Speakers list */
        .speaker-bar-container {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .speaker-lbl {
          width: 120px;
          font-weight: 500;
        }
        .speaker-bar {
          height: 12px;
          border-radius: 6px;
          margin-right: 15px;
        }
        .speaker-time {
          font-weight: bold;
          font-size: 10pt;
        }
        
        /* Transcript table */
        .transcript-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .transcript-table tr {
          page-break-inside: avoid;
        }
        .transcript-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .t-time {
          font-family: monospace;
          color: #9ca3af;
          width: 60px;
        }
        .t-spk {
          font-weight: bold;
          color: #4b5563;
          width: 140px;
        }
        
        /* Footer pagination details */
        .footer {
          position: fixed;
          bottom: 20px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 8pt;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
          padding-top: 10px;
        }
        
        /* Print rules */
        @media print {
          body {
            padding: 0;
          }
          .page-break {
            page-break-before: always;
          }
          h2, h3, h4 {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover-page">
        <div class="cover-sub">Class Notes & Study Book</div>
        <h1 class="cover-title">${session.title}</h1>
        <div style="font-size: 18pt; color: #4b5563; margin-top: 10px;">Subject: ${session.subject}</div>
        
        <div class="cover-meta">
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Lecture Duration:</strong> ${durationMin} minutes<br/>
          <strong>Topics Covered:</strong> ${session.topics.length} sections<br/>
          <strong>Visual Slides:</strong> ${session.slides.length} slides<br/><br/>
          <span style="font-size: 9pt; color: #9ca3af;">Generated automatically by LecturaAI Classroom Recording Engine</span>
        </div>
      </div>
      
      <!-- Section 1: Overview -->
      <h2>1. Overview & Core Highlights</h2>
      <div class="summary-box">
        <strong>Executive Summary:</strong><br/>
        ${session.summary}
      </div>
      
      <h3>Key Takeaways & Lessons</h3>
      <ul>
        ${session.keyPoints.map(kp => `<li style="margin-bottom: 8px;">${kp}</li>`).join('')}
      </ul>

      <!-- Section 2: Speaker stats -->
      <h2>2. Speaker Tracker Breakdown</h2>
      <div style="margin: 20px 0;">
        ${session.speakers.map(sp => {
          const pct = Math.round((sp.duration / (session.duration || 1)) * 100);
          const minutes = Math.floor(sp.duration / 60);
          const seconds = sp.duration % 60;
          return `
            <div class="speaker-bar-container">
              <span class="speaker-lbl">${sp.name}</span>
              <div class="speaker-bar" style="width: ${pct * 3}px; background-color: ${sp.color};"></div>
              <span class="speaker-time">${pct}% (${minutes}m ${seconds}s)</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="page-break"></div>

      <!-- Section 3: Topic Timeline -->
      <h2>3. Lecture Outline & Topics</h2>
      <div class="topic-timeline">
        ${session.topics.map(t => `
          <div class="topic-item">
            <span class="topic-time">[${t.time}]</span>
            <div class="topic-body">
              <h4>${t.title}</h4>
              <p style="margin: 0; color: #4b5563;">${t.description}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Section 4: Slide Presentations & Screenshots -->
      <h2>4. Presentation Slides & Extracted Visuals</h2>
      <div style="display: flex; flex-direction: column; gap: 40px; margin-top: 20px;">
        ${session.slides.map(s => {
          if (s.type === 'title') return '';
          
          let imageTag = '';
          if (s.image) {
            imageTag = `<img src="${s.image}" class="screenshot-img" alt="Slide Visual" />`;
          } else if (s.type === 'visual' && session.screenshots.length > 0) {
            const index = Math.min(s.slideNumber % session.screenshots.length, session.screenshots.length - 1);
            imageTag = `<img src="${session.screenshots[index].dataUrl}" class="screenshot-img" alt="Slide Visual" />`;
          }

          return `
            <div class="card" style="page-break-inside: avoid;">
              <h3 style="margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Slide ${s.slideNumber}: ${s.title}</h3>
              <div class="${imageTag || s.codeBlock ? 'grid-2' : ''}">
                <div>
                  <ul style="padding-left: 18px; margin: 10px 0;">
                    ${s.content.map(bullet => `<li style="margin-bottom: 6px;">${bullet}</li>`).join('')}
                  </ul>
                  ${s.notes ? `<p style="font-size: 9pt; color: #6b7280; margin-top: 15px;"><strong>Instructor Notes:</strong> ${s.notes}</p>` : ''}
                </div>
                ${imageTag ? `<div>${imageTag}</div>` : ''}
                ${s.codeBlock ? `<div><pre class="code-block">${s.codeBlock}</pre></div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="page-break"></div>

      <!-- Section 5: Full Transcript -->
      <h2>5. Verbatim Transcript</h2>
      <table class="transcript-table">
        ${session.transcript.map(item => {
          const speakerObj = session.speakers.find(s => s.id === item.speakerId);
          const name = speakerObj ? speakerObj.name : 'Speaker';
          
          const m = Math.floor(item.time / 60);
          const s = Math.floor(item.time % 60);
          const padS = s.toString().padStart(2, '0');
          const timeString = `${m}:${padS}`;

          return `
            <tr>
              <td class="t-time">[${timeString}]</td>
              <td class="t-spk" style="color: ${speakerObj?.color || '#374151'}">${name}</td>
              <td>${item.text}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <!-- Bottom footer -->
      <div class="footer">
        <span>Course Study Book: ${session.title}</span>
        <span>Generated by LecturaAI</span>
      </div>
      
      <script>
        // Trigger print dialog once loaded
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 500);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
