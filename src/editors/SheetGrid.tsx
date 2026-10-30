import { useMemo, useState } from 'react';
import { cellName, colLabel, displayCell, evaluate } from '../lib/sheet';

type Props = {
  cells: Record<string, string>;
  rows: number;
  cols: number;
  onChange: (patch: { cells?: Record<string, string>; rows?: number; cols?: number }) => void;
};

export function SheetGrid({ cells, rows, cols, onChange }: Props) {
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const selectedKey = cellName(selected.col, selected.row);
  const rawValue = cells[selectedKey] ?? '';

  const columnTotals = useMemo(() => {
    return Array.from({ length: cols }, (_, col) => {
      let total = 0;
      for (let row = 1; row < rows; row++) {
        const raw = cells[cellName(col, row)];
        if (!raw) continue;
        const n = Number(raw.startsWith('=') ? evaluate(raw, cells) : raw.replace(',', '.'));
        if (Number.isFinite(n)) total += n;
      }
      return Math.round(total * 1e6) / 1e6;
    });
  }, [cells, rows, cols]);

  const commit = (value: string) => {
    const next = { ...cells };
    if (value.trim() === '') delete next[selectedKey];
    else next[selectedKey] = value;
    onChange({ cells: next });
    setEditing(false);
  };

  const move = (dRow: number, dCol: number) => {
    setSelected((prev) => ({
      row: Math.max(0, Math.min(rows - 1, prev.row + dRow)),
      col: Math.max(0, Math.min(cols - 1, prev.col + dCol)),
    }));
    setEditing(false);
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface2)] px-2 py-1.5">
        <span
          className="grid h-7 min-w-[54px] place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)] font-[family-name:var(--font-code)] text-[11px] font-semibold"
          aria-label="Seçili hücre"
        >
          {selectedKey}
        </span>
        <span className="font-[family-name:var(--font-code)] text-[12px] text-[var(--muted)]">fx</span>
        <input
          value={editing ? draft : rawValue}
          onChange={(event) => {
            setDraft(event.target.value);
            setEditing(true);
          }}
          onFocus={() => {
            setDraft(rawValue);
            setEditing(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(draft);
              move(1, 0);
            }
            if (event.key === 'Escape') {
              setEditing(false);
            }
          }}
          onBlur={() => commit(editing ? draft : rawValue)}
          className="h-7 flex-1 rounded-md border border-transparent bg-transparent px-2 font-[family-name:var(--font-code)] text-[12px] outline-none focus:border-[var(--line)] focus:bg-[var(--surface)]"
          placeholder="=TOPLA(A1:A5)"
          aria-label="Formül çubuğu"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="max-h-[58vh] overflow-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th
                className="sticky left-0 z-20 w-9 border-b border-r border-[var(--line)] bg-[var(--surface2)]"
                aria-label="Satır numarası"
              />
              {Array.from({ length: cols }, (_, col) => (
                <th
                  key={col}
                  className="border-b border-r border-[var(--line)] bg-[var(--surface2)] py-1 text-[11px] font-medium text-[var(--muted)]"
                  style={selected.col === col ? { color: 'var(--accent)' } : undefined}
                >
                  {colLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                <th
                  className="sticky left-0 z-10 border-b border-r border-[var(--line)] bg-[var(--surface2)] py-1 text-[11px] font-medium tabular-nums text-[var(--muted)]"
                  style={selected.row === row ? { color: 'var(--accent)' } : undefined}
                >
                  {row + 1}
                </th>
                {Array.from({ length: cols }, (_, col) => {
                  const key = cellName(col, row);
                  const isSelected = selected.row === row && selected.col === col;
                  const value = displayCell(cells[key], cells);
                  const isNumber = value !== '' && Number.isFinite(Number(value));
                  const isError = value === '#HATA';
                  return (
                    <td
                      key={col}
                      className="border-b border-r border-[var(--line)] p-0"
                      style={{
                        outline: isSelected ? '2px solid var(--accent)' : undefined,
                        outlineOffset: isSelected ? '-2px' : undefined,
                        background: isSelected ? 'var(--wash)' : undefined,
                      }}
                    >
                      {isSelected && editing ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              commit(draft);
                              move(1, 0);
                            } else if (event.key === 'Tab') {
                              event.preventDefault();
                              commit(draft);
                              move(0, event.shiftKey ? -1 : 1);
                            } else if (event.key === 'Escape') {
                              setEditing(false);
                            }
                          }}
                          onBlur={() => commit(draft)}
                          className="h-8 w-full bg-transparent px-1.5 text-[12.5px] outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelected({ row, col });
                            setEditing(false);
                          }}
                          aria-label={value ? `${key}, ${value}` : key}
                          onDoubleClick={() => {
                            setSelected({ row, col });
                            setDraft(cells[key] ?? '');
                            setEditing(true);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              setSelected({ row, col });
                              setDraft(cells[key] ?? '');
                              setEditing(true);
                            }
                            if (event.key === 'ArrowDown') {
                              event.preventDefault();
                              move(1, 0);
                            }
                            if (event.key === 'ArrowUp') {
                              event.preventDefault();
                              move(-1, 0);
                            }
                            if (event.key === 'ArrowLeft') {
                              event.preventDefault();
                              move(0, -1);
                            }
                            if (event.key === 'ArrowRight') {
                              event.preventDefault();
                              move(0, 1);
                            }
                          }}
                          className="block h-8 w-full truncate px-1.5 text-left text-[12.5px] tabular-nums"
                          style={{
                            color: isError ? '#c0392b' : 'var(--ink)',
                            textAlign: isNumber ? 'right' : 'left',
                          }}
                        >
                          {value}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 border-r border-[var(--line)] bg-[var(--surface2)] py-1 text-[10px] font-medium text-[var(--muted)]">
                Σ
              </th>
              {Array.from({ length: cols }, (_, col) => (
                <td
                  key={col}
                  className="border-r border-[var(--line)] bg-[var(--surface2)] px-1.5 py-1 text-right text-[11px] tabular-nums text-[var(--muted)]"
                >
                  {columnTotals[col] ? columnTotals[col] : ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
