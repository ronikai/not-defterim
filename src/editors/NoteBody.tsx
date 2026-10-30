import { FileDown, Plus, Rows3 } from 'lucide-react';
import type { Note } from '../types';
import { useStore } from '../store/store';
import { toCSV } from '../lib/sheet';
import { downloadText, wordCount } from '../lib/utils';
import { ChecklistEditor } from './ChecklistEditor';
import { CodeEditor } from './CodeEditor';
import { DocEditor } from './DocEditor';
import { FlowCanvas } from './FlowCanvas';
import { SheetGrid } from './SheetGrid';

export function NoteBody({
  note,
  onChange,
  compact = false,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  compact?: boolean;
}) {
  switch (note.type) {
    case 'checklist':
      return <ChecklistEditor note={note} onChange={onChange} />;
    case 'table':
      return <TableNote note={note} onChange={onChange} />;
    case 'doc':
      return <DocEditor note={note} onChange={onChange} compact={compact} />;
    case 'code':
      return <CodeEditor note={note} onChange={onChange} compact={compact} />;
    case 'flow':
      return <FlowCanvas note={note} onChange={onChange} compact={compact} />;
    default:
      return <TextNote note={note} onChange={onChange} compact={compact} />;
  }
}

export function TextNote({
  note,
  onChange,
  compact = false,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  compact?: boolean;
}) {
  const { t } = useStore();
  return (
    <div>
      <textarea
        value={note.body ?? ''}
        onChange={(event) => onChange({ body: event.target.value })}
        placeholder={t('editor.bodyPlaceholder')}
        className="area"
        style={{ minHeight: compact ? 240 : 380 }}
        aria-label={t('editor.bodyPlaceholder')}
      />
      <div className="mt-2 text-right text-[11.5px] text-[var(--muted)]">
        {t('editor.wordCount', { count: wordCount(note.body ?? '') })}
      </div>
    </div>
  );
}

export function TableNote({
  note,
  onChange,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
}) {
  const { t, toast } = useStore();
  const rows = note.rows ?? 20;
  const cols = note.cols ?? 8;
  const cells = note.cells ?? {};

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={() => onChange({ rows: rows + 10 })}
        >
          <Rows3 size={14} />
          {t('editor.addRow')}
        </button>
        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={() => onChange({ cols: Math.min(8, cols + 1) })}
          disabled={cols >= 8}
        >
          <Plus size={14} />
          {t('editor.addCol')}
        </button>
        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={() => {
            downloadText(toCSV(cells, rows, cols), `${note.title || 'tablo'}.csv`, 'text/csv');
            toast(t('toast.csv'), { tone: 'success' });
          }}
        >
          <FileDown size={14} />
          CSV
        </button>
        <span className="ml-auto text-[11.5px] text-[var(--muted)]">{t('sheet.help')}</span>
      </div>
      <SheetGrid
        cells={cells}
        rows={rows}
        cols={cols}
        onChange={(patch) => onChange(patch)}
      />
    </div>
  );
}
