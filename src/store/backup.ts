import type { AppState, Lang, Note, Settings } from '../types';
import { downloadText, todayISO } from '../lib/utils';

export function exportBackup(state: AppState): string {
  const filename = `not-defterim-yedek-${todayISO()}.json`;
  downloadText(JSON.stringify(state, null, 2), filename);
  return filename;
}

export function parseBackup(text: string): AppState {
  const data = JSON.parse(text) as Partial<AppState>;
  if (!data || typeof data !== 'object' || !Array.isArray(data.notes) || !Array.isArray(data.events)) {
    throw new Error('invalid-backup');
  }
  return {
    version: 1,
    notes: data.notes,
    events: data.events,
    dayNotes: data.dayNotes && typeof data.dayNotes === 'object' ? data.dayNotes : {},
    settings: data.settings as Settings,
    activity: Array.isArray(data.activity) ? data.activity : [],
    chat: Array.isArray(data.chat) ? data.chat : [],
    onboarded: Boolean(data.onboarded),
    reminderLog: data.reminderLog ?? {},
  };
}

export function defaultTitle(type: string, lang: Lang): string {
  const map: Record<string, [string, string]> = {
    text: ['Yeni not', 'New note'],
    checklist: ['Yeni liste', 'New list'],
    table: ['Yeni tablo', 'New sheet'],
    doc: ['Yeni belge', 'New document'],
    code: ['Yeni kod', 'New code'],
    flow: ['Yeni akış', 'New flow'],
  };
  const pair = map[type] ?? ['Yeni not', 'New note'];
  return lang === 'tr' ? pair[0] : pair[1];
}

const CODE_TEMPLATE = `function topla(a, b) {
  return a + b;
}

console.log(topla(2, 3));
`;

export function noteDefaults(type: Note['type'], lang: Lang): Partial<Note> {
  switch (type) {
    case 'checklist':
      return { items: [{ id: `item_${Date.now()}`, text: '', done: false }] };
    case 'table':
      return { rows: 20, cols: 8, cells: { A1: lang === 'tr' ? 'Kalem' : 'Item', B1: lang === 'tr' ? 'Tutar' : 'Amount' } };
    case 'doc':
      return { body: '<p></p>' };
    case 'code':
      return { code: { lang: 'javascript', source: CODE_TEMPLATE } };
    case 'flow':
      return {
        flow: {
          nodes: [
            { id: 'n1', x: 80, y: 140, kind: 'start', text: lang === 'tr' ? 'Başla' : 'Start' },
          ],
          edges: [],
        },
      };
    default:
      return { body: '' };
  }
}
