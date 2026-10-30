import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import type { NoteType } from '../types';
import { useStore } from '../store/store';
import { NOTE_TYPE_META } from '../ui/meta';
import { NoteBody } from '../editors/NoteBody';
import { EmptyState } from '../ui/kit';
import { matches, relativeTime } from '../lib/utils';

export function MediaView({ type }: { type: NoteType }) {
  const { state, t, lang, createNote, updateNote, deleteNote } = useStore();
  const meta = NOTE_TYPE_META[type];
  const Icon = meta.icon;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const items = useMemo(
    () =>
      state.notes
        .filter((note) => note.type === type && !note.archived)
        .filter((note) => (query ? matches(note.title, query) : true))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [state.notes, type, query],
  );

  useEffect(() => {
    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  const note = state.notes.find((item) => item.id === selectedId) ?? null;

  const create = () => {
    const id = createNote(type, type === 'table' ? 'is' : type === 'code' ? 'kod' : 'kisisel', undefined, {
      open: false,
    });
    setSelectedId(id);
  };

  return (
    <div className="wrap pb-24 pt-5 md:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-head)] text-[26px] font-semibold tracking-[-0.03em]">
            <Icon size={22} style={{ color: meta.tab }} />
            {t(moduleTitleKey(type))}
          </h1>
          <p className="text-[12.5px] text-[var(--muted)]">
            {t(moduleDescKey(type))}
          </p>
        </div>
        <button type="button" className="btn btn-primary h-9" onClick={create}>
          <Plus size={16} />
          {t(moduleNewKey(type))}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col gap-2">
          {items.length > 6 && (
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('notes.search')}
                className="field h-8 !pl-8 text-[12px]"
                aria-label={t('notes.search')}
              />
            </div>
          )}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {items.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="w-[190px] shrink-0 rounded-lg border px-2.5 py-2 text-left transition-colors md:w-auto"
                  style={{
                    borderColor: active ? `color-mix(in srgb, ${meta.tab} 48%, var(--line))` : 'var(--line)',
                    background: active ? meta.wash : 'var(--surface)',
                  }}
                  aria-current={active}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: meta.tab }}
                    />
                    <span className="truncate text-[12.5px] font-medium">
                      {item.title || t('notes.card.empty')}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate pl-3 text-[10.5px] text-[var(--muted)]">
                    {relativeTime(item.updatedAt, lang)}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={create}
              className="flex w-[190px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] px-2 py-2 text-[12px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)] md:w-auto"
            >
              <Plus size={13} />
              {t('common.add')}
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          {!note ? (
            <EmptyState
              icon={<FileText size={20} />}
              title={t(moduleEmptyKey(type))}
              description={t(moduleDescKey(type))}
              action={
                <button type="button" className="btn btn-primary" onClick={create}>
                  <Plus size={16} />
                  {t(moduleNewKey(type))}
                </button>
              }
            />
          ) : (
            <div className="card p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={note.title}
                  onChange={(event) => updateNote(note.id, { title: event.target.value })}
                  aria-label={t('editor.titlePlaceholder')}
                  className="min-w-0 flex-1 border-none bg-transparent p-0 text-[17px] font-semibold tracking-[-0.01em] outline-none"
                  placeholder={t('editor.titlePlaceholder')}
                />
                <span className="hidden shrink-0 text-[11px] text-[var(--muted)] sm:block">
                  {relativeTime(note.updatedAt, lang)}
                </span>
                <button
                  type="button"
                  className="icon-btn h-8 w-8 shrink-0 hover:text-[#c0392b]"
                  onClick={() => deleteNote(note.id)}
                  aria-label={t('notes.delete')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <NoteBody note={note} onChange={(patch) => updateNote(note.id, patch)} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function moduleTitleKey(type: NoteType): string {
  switch (type) {
    case 'table':
      return 'sheet.title';
    case 'doc':
      return 'doc.title';
    case 'flow':
      return 'flow.title';
    case 'code':
      return 'code.title';
    default:
      return 'notes.title';
  }
}

function moduleDescKey(type: NoteType): string {
  switch (type) {
    case 'table':
      return 'modules.sheet.desc';
    case 'doc':
      return 'modules.doc.desc';
    case 'flow':
      return 'modules.flow.desc';
    case 'code':
      return 'modules.code.desc';
    default:
      return 'modules.notes.desc';
  }
}

function moduleNewKey(type: NoteType): string {
  switch (type) {
    case 'table':
      return 'sheet.new';
    case 'doc':
      return 'doc.new';
    case 'flow':
      return 'flow.new';
    case 'code':
      return 'code.new';
    default:
      return 'notes.new';
  }
}

function moduleEmptyKey(type: NoteType): string {
  switch (type) {
    case 'table':
      return 'sheet.empty';
    case 'doc':
      return 'doc.empty';
    case 'flow':
      return 'flow.empty';
    case 'code':
      return 'code.empty';
    default:
      return 'notes.empty.title';
  }
}
