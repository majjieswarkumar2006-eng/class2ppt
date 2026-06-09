export interface Speaker {
  id: string;
  name: string;
  color: string;
  duration: number;
}

export interface Topic {
  time: string;
  title: string;
  description: string;
}

export interface Example {
  topic: string;
  concept: string;
  codeOrText: string;
}

export interface TranscriptItem {
  id: string;
  speakerId: string;
  time: number; // in seconds
  text: string;
  screenshotId?: string;
}

export interface Screenshot {
  id: string;
  time: number;
  dataUrl: string;
}

export interface Slide {
  id: string;
  slideNumber: number;
  title: string;
  type: 'title' | 'content' | 'visual' | 'code' | 'summary';
  content: string[];
  image?: string; // screenshot dataUrl reference
  codeBlock?: string;
  notes?: string;
}

export interface Session {
  id: string;
  title: string;
  subject: string;
  createdAt: number; // timestamp
  duration: number; // in seconds
  sessionLink?: string;
  sessionPlatform?: string;
  recordingMode?: 'screen' | 'online' | 'simulate';
  videoBlob?: Blob;
  audioBlob?: Blob;
  summary: string;
  topics: Topic[];
  keyPoints: string[];
  examples: Example[];
  speakers: Speaker[];
  transcript: TranscriptItem[];
  screenshots: Screenshot[];
  slides: Slide[];
}

const DB_NAME = 'LecturaDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export class LecturaDB {
  private static db: IDBDatabase | null = null;

  static open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        return resolve(this.db);
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  static async saveSession(session: Session): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllSessions(): Promise<Session[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort sessions by creation date descending
        const sessions = request.result as Session[];
        sessions.sort((a, b) => b.createdAt - a.createdAt);
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getSession(id: string): Promise<Session | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteSession(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async searchSessions(query: string): Promise<Session[]> {
    const sessions = await this.getAllSessions();
    if (!query || query.trim() === '') {
      return sessions;
    }
    const lowerQuery = query.toLowerCase().trim();
    return sessions.filter((session) => {
      // Search in title, subject, summary, keyPoints, topic titles
      if (session.title.toLowerCase().includes(lowerQuery)) return true;
      if (session.subject.toLowerCase().includes(lowerQuery)) return true;
      if (session.summary.toLowerCase().includes(lowerQuery)) return true;
      
      const inTopics = session.topics.some(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        t.description.toLowerCase().includes(lowerQuery)
      );
      if (inTopics) return true;

      const inKeyPoints = session.keyPoints.some(kp => 
        kp.toLowerCase().includes(lowerQuery)
      );
      if (inKeyPoints) return true;

      // Search in transcript text
      const inTranscript = session.transcript.some(t => 
        t.text.toLowerCase().includes(lowerQuery)
      );
      if (inTranscript) return true;

      return false;
    });
  }

  static async clearAll(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
