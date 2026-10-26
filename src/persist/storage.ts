// Local-first persistence: IndexedDB slot + last-known-good backup written in one transaction,
// export/import as JSON files, and single-tab ownership so two tabs cannot overwrite each other.
import { makeEnvelope, readEnvelope, SaveError, type SaveEnvelope } from '../sim/save';
import type { GameState } from '../sim/types';

const DB = 'backroom-empire';
const STORE = 'saves';
const SLOT = 'slot1';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB blocked by another tab'));
  });
}

export interface LoadResult {
  state: GameState | null;
  source: 'main' | 'backup' | 'none';
  error: string | null;
}

export class SaveStore {
  private db: IDBDatabase | null = null;
  available = false;
  lastError: string | null = null;
  lastSavedAt = 0;

  async init(): Promise<void> {
    try {
      this.db = await openDb();
      this.available = true;
      // Ask for persistent storage where supported; it may be refused and that is fine.
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => undefined);
    } catch (e) {
      this.available = false;
      this.lastError = (e as Error).message;
    }
  }

  private tx<T>(mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Storage unavailable'));
      const t = this.db.transaction(STORE, mode);
      const st = t.objectStore(STORE);
      const r = fn(st);
      t.oncomplete = () => resolve(r ? (r.result as T) : undefined);
      t.onerror = () => reject(t.error ?? new Error('Transaction failed'));
      t.onabort = () => reject(t.error ?? new Error('Transaction aborted (quota?)'));
    });
  }

  async load(): Promise<LoadResult> {
    if (!this.available) return { state: null, source: 'none', error: this.lastError };
    const main = await this.tx<unknown>('readonly', (st) => st.get(SLOT)).catch(() => undefined);
    if (main) {
      try {
        return { state: readEnvelope(main), source: 'main', error: null };
      } catch (e) {
        const backup = await this.tx<unknown>('readonly', (st) => st.get(`${SLOT}.backup`)).catch(() => undefined);
        if (backup) {
          try {
            return { state: readEnvelope(backup), source: 'backup', error: `Main save unreadable (${(e as Error).message}); restored the previous good save.` };
          } catch { /* fall through */ }
        }
        return { state: null, source: 'none', error: (e as Error).message };
      }
    }
    return { state: null, source: 'none', error: null };
  }

  async hasSave(): Promise<boolean> {
    if (!this.available) return false;
    const k = await this.tx<number>('readonly', (st) => st.count(SLOT)).catch(() => 0);
    return (k ?? 0) > 0;
  }

  /** Write the new save and rotate the previous one into the backup key atomically. */
  async save(state: GameState): Promise<void> {
    if (!this.available) throw new Error(this.lastError ?? 'Storage unavailable');
    const env = makeEnvelope(state);
    await this.tx('readwrite', (st) => {
      const prev = st.get(SLOT);
      prev.onsuccess = () => {
        if (prev.result) st.put(prev.result, `${SLOT}.backup`);
        st.put(env, SLOT);
      };
    });
    this.lastSavedAt = Date.now();
    this.lastError = null;
  }

  async clear(): Promise<void> {
    if (!this.available) return;
    // Keep the old save as a backup rather than destroying it outright.
    await this.tx('readwrite', (st) => {
      const prev = st.get(SLOT);
      prev.onsuccess = () => {
        if (prev.result) st.put(prev.result, `${SLOT}.backup`);
        st.delete(SLOT);
      };
    });
  }
}

export function exportFile(state: GameState) {
  const env: SaveEnvelope = makeEnvelope(state);
  const blob = new Blob([JSON.stringify(env, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `backroom-empire-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function pickImport(): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return reject(new SaveError('No file chosen'));
      if (f.size > 5_000_000) return reject(new SaveError('File too large to be a save'));
      try {
        resolve(readEnvelope(JSON.parse(await f.text())));
      } catch (e) {
        reject(e instanceof SaveError ? e : new SaveError(`Could not read file: ${(e as Error).message}`));
      }
    };
    input.click();
  });
}

/** Single-tab ownership via the Web Locks API (feature-detected). */
export function claimTab(onLost: () => void): Promise<boolean> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return Promise.resolve(true);
  return new Promise((resolve) => {
    locks.request('backroom-empire-owner', { ifAvailable: true }, (lock) => {
      if (!lock) { resolve(false); return undefined; }
      resolve(true);
      return new Promise<void>(() => undefined); // hold for the page lifetime
    }).catch(() => { resolve(true); onLost(); });
  });
}

const PREFS = 'backroom-empire-prefs';
export interface Prefs { volume: number; ambience: number; reducedMotion: boolean; largeText: boolean; leftHanded: boolean }
export const DEFAULT_PREFS: Prefs = { volume: 0.7, ambience: 0.4, reducedMotion: false, largeText: false, leftHanded: false };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS);
    if (!raw) return { ...DEFAULT_PREFS, reducedMotion: matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Prefs) {
  try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch { /* preferences are optional */ }
}
