type SpeechRecognitionCtor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface TranscriptChunk {
  text: string;
  isFinal: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class LiveTranscriber {
  private recognition: SpeechRecognition | null = null;
  private active = false;
  private shouldRestart = false;

  start(
    onChunk: (chunk: TranscriptChunk) => void,
    onStatus?: (message: string) => void,
  ): boolean {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      onStatus?.('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return false;
    }

    this.stop();
    this.shouldRestart = true;
    this.active = true;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();
        if (!text) continue;
        onChunk({ text, isFinal: result.isFinal });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        onStatus?.('Microphone access denied. Enable mic permissions to transcribe live audio.');
        this.shouldRestart = false;
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        onStatus?.(`Transcription paused: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (this.shouldRestart && this.active) {
        try {
          recognition.start();
        } catch {
          // Ignore restart races when the engine is still stopping.
        }
      }
    };

    try {
      recognition.start();
      this.recognition = recognition;
      onStatus?.('Live transcription active');
      return true;
    } catch {
      onStatus?.('Could not start live transcription.');
      this.active = false;
      return false;
    }
  }

  stop(): void {
    this.shouldRestart = false;
    this.active = false;
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = null;
    }
  }
}
