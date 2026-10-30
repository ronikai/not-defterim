export type ThemeMode = 'light' | 'dark' | 'color';
export type Lang = 'tr' | 'en';
export type AssistantTone = 'friendly' | 'formal' | 'short' | 'long' | 'slang' | 'polite';
export type CategoryId = 'alisveris' | 'odev' | 'is' | 'kisisel' | 'kod' | 'fikir';
export type NoteType = 'text' | 'checklist' | 'table' | 'doc' | 'code' | 'flow';
export type ViewId = 'home' | 'notes' | 'calendar' | 'sheet' | 'doc' | 'flow' | 'code';

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type FlowKind = 'start' | 'process' | 'decision' | 'end';

export type FlowNode = {
  id: string;
  x: number;
  y: number;
  kind: FlowKind;
  text: string;
};

export type FlowEdge = {
  from: string;
  to: string;
};

export type Note = {
  id: string;
  type: NoteType;
  title: string;
  category: CategoryId;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  body?: string;
  items?: ChecklistItem[];
  cells?: Record<string, string>;
  rows?: number;
  cols?: number;
  code?: { lang: string; source: string };
  flow?: { nodes: FlowNode[]; edges: FlowEdge[] };
};

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: 'event' | 'special';
  category: CategoryId;
  note: string;
  remind: boolean;
  notifiedAt: number | null;
};

export type ActivityItem = {
  id: string;
  at: number;
  source: 'ai' | 'user';
  text: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  at: number;
};

export type Settings = {
  theme: ThemeMode;
  palette: string;
  accent: string;
  lang: Lang;
  notifications: boolean;
  reduceMotion: boolean;
  /** Asistanın kullanıcıya hitabı (ör. "gardaş"); boşsa hitap kullanılmaz. */
  nickname: string;
  /** Asistanın konuşma tarzı. */
  tone: AssistantTone;
  /** Bildirim sesi kimliği (bkz. ui/sounds.ts). */
  notificationSound: string;
};

export type AppState = {
  version: number;
  notes: Note[];
  events: CalEvent[];
  /** Gün bazlı serbest not: "2026-10-29" → "Bugün ne yapacağım" */
  dayNotes: Record<string, string>;
  settings: Settings;
  activity: ActivityItem[];
  chat: ChatMessage[];
  onboarded: boolean;
  reminderLog: Record<string, number>;
};

export const CATEGORIES: CategoryId[] = [
  'alisveris',
  'odev',
  'is',
  'kisisel',
  'kod',
  'fikir',
];

export const NOTE_TYPES: NoteType[] = ['text', 'checklist', 'table', 'doc', 'code', 'flow'];
