import { useState } from 'react';
import { Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Note } from '../types';
import { uid } from '../lib/utils';
import { useStore } from '../store/store';
import { Progress } from '../ui/kit';

export function ChecklistEditor({
  note,
  onChange,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
}) {
  const { t } = useStore();
  const items = note.items ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const done = items.filter((item) => item.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const update = (id: string, patch: Partial<{ text: string; done: boolean }>) => {
    onChange({
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const addAfter = (index: number) => {
    const next = { id: uid('item'), text: '', done: false };
    const copy = [...items];
    copy.splice(index + 1, 0, next);
    onChange({ items: copy });
    setFocusId(next.id);
  };

  const remove = (id: string) => {
    onChange({ items: items.filter((item) => item.id !== id) });
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1">
          <Progress value={done} max={items.length} />
        </div>
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--muted)]">
          {done}/{items.length} · {pct}%
        </span>
      </div>

      <ul className="space-y-1">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--surface2)] focus-within:bg-[var(--surface2)]"
          >
            <GripVertical
              size={14}
              className="shrink-0 text-[var(--line)] opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text || 'madde'}
              onClick={() => update(item.id, { done: !item.done })}
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors"
              style={{
                borderColor: item.done ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 24%, var(--line))',
                background: item.done ? 'var(--accent)' : 'transparent',
                color: 'var(--accent-ink)',
              }}
            >
              {item.done && <Check size={12} strokeWidth={3} />}
            </button>
            <input
              value={item.text}
              placeholder={t('editor.checklistPlaceholder')}
              autoFocus={focusId === item.id}
              onChange={(event) => update(item.id, { text: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addAfter(index);
                }
                if (event.key === 'Backspace' && item.text === '' && items.length > 1) {
                  event.preventDefault();
                  remove(item.id);
                }
              }}
              className="min-w-0 flex-1 bg-transparent py-1 text-[14px] outline-none placeholder:text-[var(--muted)]"
              style={
                item.done
                  ? { textDecoration: 'line-through', color: 'var(--muted)' }
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="shrink-0 rounded p-1 text-[var(--muted)] opacity-0 transition-opacity hover:text-[#c0392b] group-hover:opacity-100"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => addAfter(items.length - 1)}
        className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--line)] px-2.5 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
      >
        <Plus size={14} />
        {t('editor.addItem')}
      </button>
    </div>
  );
}
