import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  Pin,
  PinOff,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store/store';
import { NOTE_TYPE_META } from '../ui/meta';
import { Modal } from '../ui/kit';
import { NoteBody } from '../editors/NoteBody';
import { defaultTitle } from '../store/backup';
import { relativeTime } from '../lib/utils';

export function NoteEditor() {
  const { ui, openNote, state, updateNote, deleteNote, duplicateNote, t, lang } = useStore();
  const note = state.notes.find((item) => item.id === ui.noteId) ?? null;
  const titleRef = useRef<HTMLInputElement>(null);
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    if (!note) return;
    setTagDraft('');
    if (Date.now() - note.createdAt < 2500) {
      const input = titleRef.current;
      if (!input) return;
      input.focus();
      if (note.title === defaultTitle(note.type, lang)) {
        input.select();
      } else {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }, [note?.id]);

  if (!note) return null;

  const meta = NOTE_TYPE_META[note.type];
  const Icon = meta.icon;
  const isNew = Date.now() - note.createdAt < 2500;

  return (
    <Modal open={Boolean(note)} onClose={() => openNote(null)} hideClose width={980}>
      <div className="flex items-start gap-3 pt-4">
        <span
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
          style={{ background: meta.wash, color: meta.tab }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[var(--muted)]">
            {isNew ? t('picker.newTitle') : t(meta.labelKey)}
          </p>
          <input
            ref={titleRef}
            value={note.title}
            onChange={(event) => updateNote(note.id, { title: event.target.value })}
            placeholder={t('editor.titlePlaceholder')}
            className="w-full border-b border-transparent bg-transparent p-0 font-[family-name:var(--font-head)] text-[24px] font-semibold leading-tight tracking-[-0.02em] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--line)] sm:text-[27px]"
            autoComplete="off"
            name="note-title"
            aria-label={t('editor.titlePlaceholder')}
          />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="icon-btn h-9 w-9"
            data-active={note.pinned}
            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
            aria-label={note.pinned ? t('notes.unpin') : t('notes.pin')}
            title={note.pinned ? t('notes.unpin') : t('notes.pin')}
          >
            {note.pinned ? <PinOff size={17} /> : <Pin size={17} />}
          </button>
          <button
            type="button"
            className="icon-btn h-9 w-9"
            onClick={() => openNote(null)}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-3">
        <div className="flex flex-wrap items-center gap-1">
          <Tag size={13} className="text-[var(--muted)]" />
          {note.tags.map((tag) => (
            <span key={tag} className="chip !py-0.5">
              {tag}
              <button
                type="button"
                onClick={() => updateNote(note.id, { tags: note.tags.filter((item) => item !== tag) })}
                aria-label={`${tag} kaldır`}
                className="text-[var(--muted)] hover:text-[#c0392b]"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                const value = tagDraft.trim();
                if (value && !note.tags.includes(value)) {
                  updateNote(note.id, { tags: [...note.tags, value] });
                }
                setTagDraft('');
              }
              if (event.key === 'Backspace' && !tagDraft && note.tags.length) {
                updateNote(note.id, { tags: note.tags.slice(0, -1) });
              }
            }}
            placeholder={t('editor.tagPlaceholder')}
            className="h-7 w-[104px] bg-transparent text-[12px] outline-none placeholder:text-[var(--muted)]"
            aria-label={t('editor.tags')}
            autoComplete="off"
            name="note-tags"
          />
        </div>

        <span className="ml-auto text-[11px] text-[var(--muted)]">
          {relativeTime(note.updatedAt, lang)}
        </span>
      </div>

      <div className="pt-4">
        <NoteBody note={note} onChange={(patch) => updateNote(note.id, patch)} compact />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-3">
        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={() => updateNote(note.id, { archived: !note.archived })}
        >
          {note.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          {note.archived ? t('notes.unarchive') : t('notes.archiveAction')}
        </button>
        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={() => {
            const id = duplicateNote(note.id);
            if (id) openNote(id);
          }}
        >
          <Copy size={14} />
          {t('notes.duplicate')}
        </button>
        <button
          type="button"
          className="btn btn-danger h-8 !px-2 text-[12px]"
          onClick={() => {
            deleteNote(note.id);
          }}
        >
          <Trash2 size={14} />
          {t('notes.delete')}
        </button>
        <button type="button" className="btn btn-primary ml-auto h-8" onClick={() => openNote(null)}>
          <Check size={15} />
          {t('common.done')}
        </button>
      </div>
    </Modal>
  );
}

export function QuickAddButton() {
  const { setUI, t } = useStore();
  return (
    <button type="button" className="btn btn-primary" onClick={() => setUI({ pickerOpen: true })}>
      <Plus size={16} />
      {t('notes.new')}
    </button>
  );
}
