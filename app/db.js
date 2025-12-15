// Coach - IndexedDB (parce que localStorage, c'est mignon, mais ça craque vite)
import { uuid } from './utils.js';

const DB_NAME = 'coach-db';
const DB_VERSION = 1;

let _dbPromise = null;

export function initDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const s = db.createObjectStore('workouts', { keyPath: 'id' });
        s.createIndex('by_date', 'ts');
      }
      if (!db.objectStoreNames.contains('painLogs')) {
        const s = db.createObjectStore('painLogs', { keyPath: 'id' });
        s.createIndex('by_date', 'ts');
      }
      if (!db.objectStoreNames.contains('minimalistLogs')) {
        const s = db.createObjectStore('minimalistLogs', { keyPath: 'id' });
        s.createIndex('by_date', 'ts');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx(db, storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function getProfile() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'profile').get('me');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProfile(profile) {
  const db = await initDB();
  const payload = { ...profile, id: 'me', updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'profile', 'readwrite').put(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}

export async function resetAll() {
  const db = await initDB();
  const stores = ['profile', 'workouts', 'painLogs', 'minimalistLogs', 'settings'];
  await Promise.all(stores.map(storeName => new Promise((resolve, reject) => {
    const req = tx(db, storeName, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  })));
}

export async function addWorkout(workout) {
  const db = await initDB();
  const payload = { id: uuid(), ts: Date.now(), ...workout };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'workouts', 'readwrite').add(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}

export async function getWorkouts({ limit = 50 } = {}) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const out = [];
    const index = tx(db, 'workouts').index('by_date');
    const req = index.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) return resolve(out);
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function addPainLog(log) {
  const db = await initDB();
  const payload = { id: uuid(), ts: Date.now(), ...log };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'painLogs', 'readwrite').add(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}

export async function getPainLogs({ limit = 100 } = {}) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const out = [];
    const index = tx(db, 'painLogs').index('by_date');
    const req = index.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) return resolve(out);
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function addMinimalistLog(log) {
  const db = await initDB();
  const payload = { id: uuid(), ts: Date.now(), ...log };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'minimalistLogs', 'readwrite').add(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}

export async function getMinimalistLogs({ limit = 100 } = {}) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const out = [];
    const index = tx(db, 'minimalistLogs').index('by_date');
    const req = index.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) return resolve(out);
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getSetting(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'settings').get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setSetting(key, value) {
  const db = await initDB();
  const payload = { key, value, updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const req = tx(db, 'settings', 'readwrite').put(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
}
