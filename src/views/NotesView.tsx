import { useMemo, useState } from 'react';
import { Archive, Pin, Plus, Search, StickyNote, X } from 'lucide-react';
import { useStore } from '../store/store';
import { matches } from '../lib/utils';
import { NoteCard } from '../ui/NoteCard';
import { EmptyState } from '../ui/kit';

export function NotesView() {
  const { state, t, openNote, setUI } = useStore();
  const [query, setQuery] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const filtered = useMemo(() => {
    return state.notes
      .filter((note) => (showArchive ? note.archived : !note.archived))
      .filter((note) => !pinnedOnly || note.pinned)
      .filter((note) => {
        if (!query.trim()) return true;
        const haystack = [
          note.title,
          note.body ?? '',
          note.code?.source ?? '',
          note.tags.join(' '),
          ...(note.items?.map((item) => item.text) ?? []),
        ].join(' ');
        return matches(haystack, query);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [state.notes, pinnedOnly, query, showArchive]);

  const activeCount = state.notes.filter((note) => !note.archived).length;

  return (
    <div className="wrap pb-24 pt-5 md:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-head)] text-[26px] font-semibold tracking-[-0.03em]">
            {t('notes.title')}
          </h1>
          <p className="text-[12.5px] text-[var(--muted)]">
            {t('notes.subtitle', { count: activeCount })}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary h-9"
          onClick={() => setUI({ pickerOpen: true })}
          aria-label={t('notes.new')}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('notes.new')}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('notes.search')}
            className="field h-9 !pl-9 !pr-9 text-[13px]"
            aria-label={t('notes.search')}
            autoComplete="off"
            name="notes-search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label={t('common.close')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          className="icon-btn h-9 w-9 border border-[var(--line)]"
          data-active={pinnedOnly}
          onClick={() => setPinnedOnly((prev) => !prev)}
          aria-pressed={pinnedOnly}
          aria-label={t('notes.pinned')}
          title={t('notes.pinned')}
        >
          <Pin size={15} />
        </button>
        <button
          type="button"
          className="icon-btn h-9 w-9 border border-[var(--line)]"
          data-active={showArchive}
          onClick={() => setShowArchive((prev) => !prev)}
          aria-pressed={showArchive}
          aria-label={t('notes.archive')}
          title={t('notes.archive')}
        >
          <Archive size={15} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          {activeCount === 0 && !showArchive ? (
            <EmptyState
              icon={<StickyNote size={20} />}
              title={t('notes.empty.title')}
              description={t('notes.empty.desc')}
              action={
                <button type="button" className="btn btn-primary" onClick={() => setUI({ pickerOpen: true })}>
                  <Plus size={16} />
                  {t('notes.new')}
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<Search size={20} />}
              title={t('cmd.none')}
              description={t('notes.empty.filter')}
              action={
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setQuery('');
                    setPinnedOnly(false);
                  }}
                >
                  {t('notes.all')}
                </button>
              }
            />
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} onOpen={openNote} />
          ))}
        </div>
      )}
    </div>
  );
}
