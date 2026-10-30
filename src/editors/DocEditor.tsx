import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';
import type { Note } from '../types';
import { stripHtml, wordCount } from '../lib/utils';
import { ToolButton } from '../ui/kit';
import { useStore } from '../store/store';

type Cmd = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock' | 'removeFormat';

export function DocEditor({
  note,
  onChange,
  compact = false,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  compact?: boolean;
}) {
  const { t } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const latest = useRef<string | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [count, setCount] = useState(0);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = note.body ?? '';
    el.innerHTML = html || '<p><br></p>';
    latest.current = null;
    setCount(wordCount(html));
    setEmpty(!stripHtml(html).trim());
  }, [note.id]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        if (latest.current !== null) changeRef.current({ body: latest.current });
      }
    };
  }, []);

  const handleInput = () => {
    const html = ref.current?.innerHTML ?? '';
    latest.current = html;
    setCount(wordCount(html));
    setEmpty(!stripHtml(html).trim());
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      changeRef.current({ body: html });
      timer.current = null;
    }, 220);
  };

  const exec = (command: Cmd, value?: string) => {
    document.execCommand(command, false, value);
    ref.current?.focus();
    handleInput();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface2)] p-1">
        <ToolButton label={t('editor.bold')} onClick={() => exec('bold')}>
          <Bold size={15} />
        </ToolButton>
        <ToolButton label={t('editor.italic')} onClick={() => exec('italic')}>
          <Italic size={15} />
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-[var(--line)]" aria-hidden />
        <ToolButton label={t('editor.h1')} onClick={() => exec('formatBlock', 'h1')}>
          <Heading1 size={15} />
        </ToolButton>
        <ToolButton label={t('editor.h2')} onClick={() => exec('formatBlock', 'h2')}>
          <Heading2 size={15} />
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-[var(--line)]" aria-hidden />
        <ToolButton label={t('editor.ul')} onClick={() => exec('insertUnorderedList')}>
          <List size={15} />
        </ToolButton>
        <ToolButton label={t('editor.ol')} onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={15} />
        </ToolButton>
        <ToolButton label={t('editor.quote')} onClick={() => exec('formatBlock', 'blockquote')}>
          <Quote size={15} />
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-[var(--line)]" aria-hidden />
        <ToolButton label={t('editor.clearFormat')} onClick={() => exec('removeFormat')}>
          <Eraser size={15} />
        </ToolButton>
        <span className="ml-auto pr-1.5 text-[11px] tabular-nums text-[var(--muted)]">
          {t('editor.wordCount', { count })}
        </span>
      </div>

      <div className="relative flex-1">
        {empty && (
          <p className="pointer-events-none absolute inset-x-0 top-0 px-1 text-[16px] text-[var(--muted)]">
            {t('editor.docPlaceholder')}
          </p>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={t('editor.docPlaceholder')}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          className="prose-doc min-h-[320px] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4 outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] sm:p-6"
          style={{ minHeight: compact ? 280 : 420 }}
        />
      </div>
    </div>
  );
}
