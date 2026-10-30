import type { AppState } from '../types';

const DB_NAME = 'not-defterim';
const STORE = 'state';
const KEY = 'app';
const FALLBACK_KEY = 'not-defterim:state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no-indexeddb'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('db-error'));
  });
}

export async function readState(): Promise<AppState | null> {
  try {
    const db = await openDB();
    return await new Promise<AppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as AppState) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch {
      return null;
    }
  }
}

export async function writeState(state: AppState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
    } catch {
      /* kota dolu olabilir, sessiz geç */
    }
  }
}

export async function removeState(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* yoksay */
  }
  localStorage.removeItem(FALLBACK_KEY);
}
