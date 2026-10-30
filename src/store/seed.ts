import type { AppState } from '../types';

/** Depolama sürümü. 2: örnek içerik kaldırıldı, ilk açılış boş. */
export const SEED_VERSION = 2;

/** İlk açılış: boş defter. Örnek not/etkinlik yok. */
export function seedState(): AppState {
  return {
    version: SEED_VERSION,
    notes: [],
    events: [],
    dayNotes: {},
    settings: {
      theme: 'light',
      palette: 'murekkep',
      accent: '',
      lang: 'tr',
      notifications: false,
      reduceMotion: false,
      nickname: '',
      tone: 'friendly',
      notificationSound: 'chime',
    },
    activity: [],
    chat: [],
    onboarded: false,
    reminderLog: {},
  };
}

/**
 * v1 sürümünde gelen örnek içerik. Kullanıcının kendi eklediklerine
 * dokunmamak için yalnızca bilinen başlıklar eşleşirse silinir.
 */
const DEMO_NOTE_TITLES = new Set([
  'Hoş geldin',
  'Welcome',
  'Haftalık alışveriş',
  'Weekly shopping',
  'Bitirme projesi',
  'Final project',
  'Sunum taslağı',
  'Presentation draft',
  'Aylık bütçe',
  'Monthly budget',
  'Diziyi ters çevir',
  'Reverse an array',
  'Yayın akışı',
  'Release flow',
]);

const DEMO_EVENT_TITLES = new Set([
  'Spor',
  'Workout',
  'Ekip toplantısı',
  'Team meeting',
  'Annemin doğum günü',
  "Mom's birthday",
]);

export function stripDemoContent(state: AppState): AppState {
  if (state.version >= SEED_VERSION) return state;
  return {
    ...state,
    version: SEED_VERSION,
    notes: state.notes.filter((note) => !DEMO_NOTE_TITLES.has(note.title)),
    events: state.events.filter((event) => !DEMO_EVENT_TITLES.has(event.title)),
  };
}
