/**
 * Küçük elektronik tablo motoru.
 * Desteklenen: =TOPLA(A1:A5), =ORTALAMA(...), =MAK, =MİN, =SAY, hücre aritmetiği ve parantez.
 */

export type CellMap = Record<string, string>;

export const COLUMNS = 'ABCDEFGH'.split('');
export const DEFAULT_ROWS = 24;
export const DEFAULT_COLS = 8;

export function cellName(col: number, row: number): string {
  return `${COLUMNS[col] ?? 'A'}${row + 1}`;
}

export function colLabel(index: number): string {
  return COLUMNS[index] ?? '';
}

type Range = { start: [number, number]; end: [number, number] };

function parseRef(ref: string): [number, number] | null {
  const match = /^([A-H])([1-9][0-9]?)$/i.exec(ref.trim());
  if (!match) return null;
  return [COLUMNS.indexOf(match[1].toUpperCase()), Number(match[2]) - 1];
}

function parseRange(text: string): Range | null {
  const match = /^([A-H][1-9][0-9]?)\s*:\s*([A-H][1-9][0-9]?)$/i.exec(text.trim());
  if (!match) return null;
  const a = parseRef(match[1]);
  const b = parseRef(match[2]);
  if (!a || !b) return null;
  return {
    start: [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    end: [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  };
}

function numeric(value: string | undefined, cache: CellMap, seen: Set<string>): number {
  if (!value) return 0;
  if (value.startsWith('=')) {
    const r = evaluate(value, cache, seen);
    const n = Number(r);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(String(value).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function rangeValues(range: Range, cache: CellMap, seen: Set<string>): number[] {
  const out: number[] = [];
  for (let row = range.start[1]; row <= range.end[1]; row++) {
    for (let col = range.start[0]; col <= range.end[0]; col++) {
      const key = cellName(col, row);
      const raw = seen.has(key) ? undefined : cache[key];
      if (raw !== undefined && raw !== '') out.push(numeric(raw, cache, new Set(seen).add(key)));
    }
  }
  return out;
}

const FUNCS: Record<string, (values: number[]) => number> = {
  TOPLA: (v) => v.reduce((a, b) => a + b, 0),
  SUM: (v) => v.reduce((a, b) => a + b, 0),
  ORTALAMA: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  AVERAGE: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  MAK: (v) => (v.length ? Math.max(...v) : 0),
  MAX: (v) => (v.length ? Math.max(...v) : 0),
  MIN: (v) => (v.length ? Math.min(...v) : 0),
  'MİN': (v) => (v.length ? Math.min(...v) : 0),
  SAY: (v) => v.length,
  COUNT: (v) => v.length,
};

export function evaluate(formula: string, cache: CellMap, seen = new Set<string>()): string {
  if (!formula.startsWith('=')) return formula;
  let expr = formula.slice(1);

  try {
    // Fonksiyonlar
    expr = expr.replace(
      /([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*\(([^()]*)\)/g,
      (_all, name: string, args: string) => {
        const fn = FUNCS[name.toUpperCase()];
        if (!fn) return 'NaN';
        const values: number[] = [];
        for (const arg of args.split(';')) {
          const range = parseRange(arg);
          if (range) values.push(...rangeValues(range, cache, seen));
          else if (arg.trim()) values.push(numeric(arg.trim(), cache, seen));
        }
        return String(fn(values));
      },
    );

    // Hücre referansları
    expr = expr.replace(/\b([A-H][1-9][0-9]?)\b/gi, (_m, ref: string) => {
      const key = ref.toUpperCase();
      if (seen.has(key)) return '0';
      return String(numeric(cache[key], cache, new Set(seen).add(key)));
    });

    if (!/^[\d+\-*/().\s]+$/.test(expr)) return '#HATA';
    if (!expr.trim()) return '';
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict";return (${expr})`)() as number;
    if (typeof result !== 'number' || !Number.isFinite(result)) return '#HATA';
    return String(Math.round(result * 1e6) / 1e6);
  } catch {
    return '#HATA';
  }
}

export function displayCell(raw: string | undefined, cells: CellMap): string {
  if (!raw) return '';
  if (!raw.startsWith('=')) return raw;
  return evaluate(raw, cells);
}

export function toCSV(cells: CellMap, rows: number, cols: number): string {
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    const line: string[] = [];
    for (let col = 0; col < cols; col++) {
      const raw = cells[cellName(col, row)] ?? '';
      const value = raw.startsWith('=') ? evaluate(raw, cells) : raw;
      line.push(`"${value.replace(/"/g, '""')}"`);
    }
    lines.push(line.join(','));
  }
  return lines.join('\n');
}
