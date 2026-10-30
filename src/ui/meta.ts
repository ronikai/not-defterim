import {
  CalendarDays,
  Code2,
  FileText,
  GitBranch,
  ListChecks,
  NotebookPen,
  Table2,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId, NoteType, ViewId } from '../types';

export type ModuleMeta = {
  id: Exclude<ViewId, 'home'>;
  icon: LucideIcon;
  tab: string;
  wash: string;
  titleKey: string;
  descKey: string;
  type?: NoteType;
};

export const MODULES: ModuleMeta[] = [
  {
    id: 'notes',
    icon: NotebookPen,
    tab: 'var(--tab-notes)',
    wash: 'var(--wash-notes)',
    titleKey: 'nav.notes',
    descKey: 'modules.notes.desc',
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    tab: 'var(--tab-calendar)',
    wash: 'var(--wash-calendar)',
    titleKey: 'nav.calendar',
    descKey: 'modules.calendar.desc',
  },
  {
    id: 'sheet',
    icon: Table2,
    tab: 'var(--tab-sheet)',
    wash: 'var(--wash-sheet)',
    titleKey: 'sheet.title',
    descKey: 'modules.sheet.desc',
    type: 'table',
  },
  {
    id: 'doc',
    icon: FileText,
    tab: 'var(--tab-doc)',
    wash: 'var(--wash-doc)',
    titleKey: 'doc.title',
    descKey: 'modules.doc.desc',
    type: 'doc',
  },
  {
    id: 'flow',
    icon: GitBranch,
    tab: 'var(--tab-flow)',
    wash: 'var(--wash-flow)',
    titleKey: 'flow.title',
    descKey: 'modules.flow.desc',
    type: 'flow',
  },
  {
    id: 'code',
    icon: Code2,
    tab: 'var(--tab-code)',
    wash: 'var(--wash-code)',
    titleKey: 'code.title',
    descKey: 'modules.code.desc',
    type: 'code',
  },
];

export function moduleById(id: ViewId): ModuleMeta | undefined {
  return MODULES.find((item) => item.id === id);
}

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  alisveris: '#2e7d6b',
  odev: '#b06a1f',
  is: '#3f6aa8',
  kisisel: '#a8557a',
  kod: '#6b5ab0',
  fikir: '#7a7a2e',
};

export function categoryColor(id: CategoryId): string {
  return CATEGORY_COLORS[id] ?? 'var(--accent)';
}

export function categoryWash(id: CategoryId): string {
  return `color-mix(in srgb, ${categoryColor(id)} 13%, var(--surface))`;
}

export const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  text: 'var(--tab-notes)',
  checklist: 'var(--tab-code)',
  table: 'var(--tab-sheet)',
  doc: 'var(--tab-doc)',
  code: 'var(--tab-code)',
  flow: 'var(--tab-flow)',
};

export type NoteTypeMeta = {
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  tab: string;
  wash: string;
};

export const NOTE_TYPE_META: Record<NoteType, NoteTypeMeta> = {
  text: {
    icon: Type,
    labelKey: 'picker.text',
    descKey: 'picker.text.desc',
    tab: 'var(--tab-notes)',
    wash: 'var(--wash-notes)',
  },
  checklist: {
    icon: ListChecks,
    labelKey: 'picker.checklist',
    descKey: 'picker.checklist.desc',
    tab: 'var(--tab-code)',
    wash: 'var(--wash-code)',
  },
  table: {
    icon: Table2,
    labelKey: 'picker.table',
    descKey: 'picker.table.desc',
    tab: 'var(--tab-sheet)',
    wash: 'var(--wash-sheet)',
  },
  doc: {
    icon: FileText,
    labelKey: 'picker.doc',
    descKey: 'picker.doc.desc',
    tab: 'var(--tab-doc)',
    wash: 'var(--wash-doc)',
  },
  code: {
    icon: Code2,
    labelKey: 'picker.code',
    descKey: 'picker.code.desc',
    tab: 'var(--tab-code)',
    wash: 'var(--wash-code)',
  },
  flow: {
    icon: GitBranch,
    labelKey: 'picker.flow',
    descKey: 'picker.flow.desc',
    tab: 'var(--tab-flow)',
    wash: 'var(--wash-flow)',
  },
};

