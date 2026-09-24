import { InspectionSession } from '../types/Session';
import { UserProfile } from '../types/User';

// Architecture for Firestore synchronization
// Prepares collections: users, courses, scenarios, hazards, sessions, results, certificates
const SESSIONS_STORAGE_KEY = 'sst360_sessions_history';
const CURRENT_USER_KEY = 'sst360_active_user';

export class FirebaseSyncService {
  private isConnectedToCloud: boolean = false;

  constructor() {
    // Check if Firebase config is injected or fallback to local offline-first storage
  }

  public getStatus(): { isCloud: boolean; mode: string } {
    return {
      isCloud: this.isConnectedToCloud,
      mode: this.isConnectedToCloud ? 'Firestore Synchronized' : 'Offline Persistent Storage (Local)'
    };
  }

  public async getCurrentUser(): Promise<UserProfile> {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const defaultUser: UserProfile = {
      uid: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      nombre: 'Inspector Industrial',
      email: 'inspector@seguridad-industrial.com',
      empresa: 'Operaciones Industriales 360',
      puesto: 'Especialista de Seguridad y Salud',
      rol: 'operario',
      activo: true,
      fechaRegistro: Date.now()
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  }

  public async saveCurrentUser(user: UserProfile): Promise<void> {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  public async saveSession(session: InspectionSession): Promise<void> {
    try {
      const history = await this.getSessionHistory();
      history.unshift(session);
      // Keep last 30 sessions in storage
      const trimmed = history.slice(0, 30);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Could not save session to local storage', e);
    }
  }

  public async getSessionHistory(): Promise<InspectionSession[]> {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not retrieve sessions', e);
    }
    return [];
  }

  public exportReportJSON(session: InspectionSession): string {
    return JSON.stringify(session, null, 2);
  }
}

export const firebaseService = new FirebaseSyncService();
