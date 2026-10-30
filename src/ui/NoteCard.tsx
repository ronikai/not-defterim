import { Pin, PinOff, Trash2 } from 'lucide-react';
import type { Note } from '../types';
import { useStore } from '../store/store';
import { relativeTime } from '../lib/utils';
import { NOTE_TYPE_META } from './meta';

function preview(note: Note): string {
  if (note.type === 'checklist') {
    const items = note.items ?? [];
    const pending = items.filter((item) => !item.done).slice(0, 3).map((item) => item.text);
    return pending.join(' · ') || items.map((item) => item.text).slice(0, 3).join(' · ');
  }
  if (note.type === 'code') return note.code?.source.split('\n')[0] ?? '';
  if (note.type === 'table') {
    return Object.entries(note.cells ?? {})
      .slice(0, 4)
      .map(([key, value]) => `${key} ${value}`)
      .join('  ');
  }
  if (note.type === 'flow') {
    return `${note.flow?.nodes.length ?? 0} kutu · ${note.flow?.edges.length ?? 0} bağlantı`;
  }
  return (note.body ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function NoteCard({
  note,
  onOpen,
}: {
  note: Note;
  onOpen: (id: string) => void;
}) {
  const { t, lang, updateNote, deleteNote } = useStore();
  const meta = NOTE_TYPE_META[note.type];
  const Icon = meta.icon;
  const done = note.items?.filter((item) => item.done).length ?? 0;
  const total = note.items?.length ?? 0;
  const text = preview(note);

  return (
    <article
      className="note-card group"
      style={{ ['--tab' as string]: meta.tab }}
      tabIndex={0}
      role="button"
      onClick={() => onOpen(note.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(note.id);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0" style={{ color: meta.tab }} />
        <span className="truncate text-[11px] font-medium text-[var(--muted)]">
          {t(meta.labelKey)}
        </span>
        <div className="-mr-1 ml-auto flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            className="rounded p-1 text-[var(--muted)] hover:text-[var(--accent)]"
            aria-label={note.pinned ? t('notes.unpin') : t('notes.pin')}
            onClick={(event) => {
              event.stopPropagation();
              updateNote(note.id, { pinned: !note.pinned });
            }}
          >
            {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          <button
            type="button"
            className="rounded p-1 text-[var(--muted)] hover:text-[#c0392b]"
            aria-label={t('notes.delete')}
            onClick={(event) => {
              event.stopPropagation();
              deleteNote(note.id);
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
        {note.pinned && (
          <Pin size={12} className="shrink-0 text-[var(--accent)] group-hover:hidden" aria-label={t('notes.pinned')} />
        )}
      </div>

      <h3 className="line-clamp-1 text-[14.5px] font-semibold leading-snug">
        {note.title || t('notes.card.empty')}
      </h3>

      {note.type === 'checklist' ? (
        <div>
          <p className="line-clamp-2 min-h-[32px] text-[12.5px] leading-snug text-[var(--muted)]">
            {text || t('notes.card.list')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface2)]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${total ? (done / total) * 100 : 0}%`, background: 'var(--accent)' }}
              />
            </div>
            <span className="text-[10.5px] tabular-nums text-[var(--muted)]">
              {done}/{total}
            </span>
          </div>
        </div>
      ) : (
        <p className="line-clamp-2 min-h-[34px] text-[12.5px] leading-snug text-[var(--muted)]">
          {text || t('notes.card.empty')}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[10.5px] text-[var(--muted)]">
        <span className="truncate">{note.tags.map((tag) => `#${tag}`).join(' ')}</span>
        <span className="shrink-0">{relativeTime(note.updatedAt, lang)}</span>
      </div>
    </article>
  );
}
