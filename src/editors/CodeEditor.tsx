import { useMemo, useRef, useState } from 'react';
import {
  CircleAlert,
  ClipboardCopy,
  Info,
  Play,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { Note } from '../types';
import { useStore } from '../store/store';
import { reviewCode, summarizeFindings, type Finding } from '../ai/review';

const LANGS = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'json', label: 'JSON' },
  { id: 'other', label: 'Diğer' },
];

function runJs(code: string): string {
  const logs: string[] = [];
  const format = (value: unknown) => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };
  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(format).join(' ')),
    warn: (...args: unknown[]) => logs.push(`⚠ ${args.map(format).join(' ')}`),
    error: (...args: unknown[]) => logs.push(`✖ ${args.map(format).join(' ')}`),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${code}`);
    const result = fn(fakeConsole);
    if (result !== undefined) logs.push(`⇒ ${format(result)}`);
  } catch (error) {
    logs.push(`✖ ${(error as Error).message}`);
  }
  return logs.join('\n');
}

export function CodeEditor({
  note,
  onChange,
  compact = false,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  compact?: boolean;
}) {
  const { t, lang, toast } = useStore();
  const source = note.code?.source ?? '';
  const codeLang = note.code?.lang ?? 'javascript';
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [output, setOutput] = useState('');
  const gutterRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const lines = useMemo(() => source.split('\n').length, [source]);

  const update = (patch: Partial<NonNullable<Note['code']>>) => {
    onChange({ code: { lang: codeLang, source, ...patch } });
  };

  const review = () => {
    setFindings(reviewCode(source, codeLang, lang));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={codeLang}
          onChange={(event) => update({ lang: event.target.value })}
          className="field h-8 w-auto min-w-[128px] text-[12.5px]"
          aria-label={t('editor.language')}
        >
          {LANGS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <span className="text-[11.5px] text-[var(--muted)]">
          {lines} {t('code.line')}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost h-8 !px-2 text-[12px]"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(source);
                toast(t('toast.codeCopied'), { tone: 'success' });
              } catch {
                toast(t('toast.importError'), { tone: 'error' });
              }
            }}
          >
            <ClipboardCopy size={14} />
            <span className="hidden sm:inline">{t('editor.copy')}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost h-8 !px-2 text-[12px]"
            onClick={() => setOutput(runJs(source))}
            disabled={codeLang !== 'javascript'}
            title={codeLang === 'javascript' ? t('editor.run') : 'JavaScript'}
          >
            <Play size={14} />
            <span className="hidden sm:inline">{t('editor.run')}</span>
          </button>
          <button type="button" className="btn btn-outline h-8 !px-2.5 text-[12px]" onClick={review}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            {t('editor.review')}
          </button>
        </div>
      </div>

      <div
        className="relative flex overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface2)]"
        style={{ minHeight: compact ? 260 : 380 }}
      >
        <div
          ref={gutterRef}
          aria-hidden
          className="max-h-[52vh] shrink-0 select-none overflow-hidden border-r border-[var(--line)] bg-[var(--surface2)] px-2 py-3 text-right font-[family-name:var(--font-code)] text-[12.5px] leading-[1.65] text-[var(--muted)]"
          style={{ minWidth: 42 }}
        >
          {Array.from({ length: lines }, (_, index) => (
            <div key={index} style={{ opacity: 0.7 }}>
              {index + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={areaRef}
          value={source}
          spellCheck={false}
          onChange={(event) => update({ source: event.target.value })}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Tab') {
              event.preventDefault();
              const el = event.currentTarget;
              const start = el.selectionStart;
              const next = `${source.slice(0, start)}  ${source.slice(el.selectionEnd)}`;
              update({ source: next });
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 2;
              });
            }
          }}
          className="code-area max-h-[52vh] flex-1 !rounded-none !border-0 bg-transparent px-3 py-3"
          placeholder="// …"
          aria-label={t('editor.language')}
        />
      </div>

      {output && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label !mb-0">{t('editor.output')}</span>
            <button
              type="button"
              className="text-[11.5px] text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => setOutput('')}
            >
              {t('common.close')}
            </button>
          </div>
          <pre className="max-h-40 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface2)] p-3 font-[family-name:var(--font-code)] text-[12px] leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {findings && (
        <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface2)] p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-[12.5px] font-medium">{summarizeFindings(findings, lang)}</p>
            <button
              type="button"
              className="shrink-0 text-[11.5px] text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => setFindings(null)}
            >
              {t('common.close')}
            </button>
          </div>
          {findings.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">{t('editor.noIssues')}</p>
          ) : (
            <ul className="space-y-1.5">
              {findings.map((finding, index) => {
                const color =
                  finding.severity === 'error'
                    ? '#c0392b'
                    : finding.severity === 'warning'
                      ? '#b7791f'
                      : 'var(--muted)';
                const Icon =
                  finding.severity === 'error'
                    ? CircleAlert
                    : finding.severity === 'warning'
                      ? TriangleAlert
                      : Info;
                return (
                  <li key={index} className="flex items-start gap-2 text-[12.5px] leading-snug">
                    <Icon size={14} className="mt-[2px] shrink-0" style={{ color }} />
                    {finding.line && (
                      <span className="shrink-0 font-[family-name:var(--font-code)] text-[11px] text-[var(--muted)]">
                        {finding.line}
                      </span>
                    )}
                    <span>{finding.message}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
