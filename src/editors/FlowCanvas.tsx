import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { toPng } from 'html-to-image';
import {
  Circle,
  CircleCheck,
  Diamond,
  Download,
  Link2,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type { FlowEdge, FlowKind, FlowNode, Note } from '../types';
import { clamp, downloadBlob, uid } from '../lib/utils';
import { useStore } from '../store/store';

const W = 162;
const H = 58;

const KIND_COLOR: Record<FlowKind, string> = {
  start: 'var(--tab-notes)',
  process: 'var(--tab-sheet)',
  decision: 'var(--tab-flow)',
  end: 'var(--tab-calendar)',
};

export function FlowCanvas({
  note,
  onChange,
  compact = false,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  compact?: boolean;
}) {
  const { t, lang, toast } = useStore();
  const [nodes, setNodes] = useState<FlowNode[]>(note.flow?.nodes ?? []);
  const [edges, setEdges] = useState<FlowEdge[]>(note.flow?.edges ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<FlowNode[]>(nodes);
  const edgesRef = useRef<FlowEdge[]>(edges);
  const timer = useRef<number | null>(null);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    setNodes(note.flow?.nodes ?? []);
    setEdges(note.flow?.edges ?? []);
    setSelected(null);
    setConnectFrom(null);
  }, [note.id]);

  const commit = (nextNodes = nodesRef.current, nextEdges = edgesRef.current) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onChange({ flow: { nodes: nextNodes, edges: nextEdges } });
    }, 120);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp(event.clientX - rect.left - drag.dx, 4, 1800 - W);
      const y = clamp(event.clientY - rect.top - drag.dy, 4, 1100 - H);
      setNodes((prev) => {
        const next = prev.map((node) => (node.id === drag.id ? { ...node, x, y } : node));
        nodesRef.current = next;
        return next;
      });
    };
    const up = () => {
      setDrag(null);
      commit();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag]);

  const startNode = (event: ReactPointerEvent<HTMLDivElement>, node: FlowNode) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, button')) return;
    setSelected(node.id);

    if (connectFrom) {
      if (connectFrom !== node.id) {
        const exists = edges.some((edge) => edge.from === connectFrom && edge.to === node.id);
        if (!exists) {
          const next = [...edges, { from: connectFrom, to: node.id }];
          setEdges(next);
          edgesRef.current = next;
          commit(nodesRef.current, next);
        }
      }
      setConnectFrom(null);
      return;
    }

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    setDrag({
      id: node.id,
      dx: event.clientX - rect.left - node.x,
      dy: event.clientY - rect.top - node.y,
    });
  };

  const addNode = (kind: FlowKind) => {
    // Zincir mantığı: seçili kutu varsa onun, yoksa son kutunun devamına ekle.
    const parent = nodes.find((item) => item.id === selected) ?? nodes[nodes.length - 1] ?? null;
    let x = parent ? parent.x + W + 72 : 80;
    let y = parent ? parent.y : 140;
    if (x + W > 900) {
      x = 80;
      y = (parent?.y ?? 140) + H + 78;
    }
    const node: FlowNode = {
      id: uid('n'),
      x,
      y,
      kind,
      text:
        kind === 'start'
          ? lang === 'tr'
            ? 'Başla'
            : 'Start'
          : kind === 'end'
            ? lang === 'tr'
              ? 'Bitir'
              : 'Finish'
            : kind === 'decision'
              ? lang === 'tr'
                ? 'Karar?'
                : 'Decide?'
              : lang === 'tr'
                ? 'Adım'
                : 'Step',
    };
    const next = [...nodes, node];
    const nextEdges = parent ? [...edges, { from: parent.id, to: node.id }] : edges;
    setNodes(next);
    setEdges(nextEdges);
    nodesRef.current = next;
    edgesRef.current = nextEdges;
    setSelected(node.id);
    commit(next, nextEdges);
  };

  const removeSelected = () => {
    if (!selected) return;
    const nextNodes = nodes.filter((node) => node.id !== selected);
    const nextEdges = edges.filter((edge) => edge.from !== selected && edge.to !== selected);
    setNodes(nextNodes);
    setEdges(nextEdges);
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setSelected(null);
    commit(nextNodes, nextEdges);
  };

  const rename = (id: string, text: string) => {
    const next = nodes.map((node) => (node.id === id ? { ...node, text } : node));
    setNodes(next);
    nodesRef.current = next;
    commit(next, edges);
  };

  const exportPng = async () => {
    if (!boardRef.current) return;
    try {
      const url = await toPng(boardRef.current, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fff',
      });
      const blob = await (await fetch(url)).blob();
      downloadBlob(blob, `${note.title || 'akis'}.png`);
      toast(t('toast.png'), { tone: 'success' });
    } catch {
      toast(t('toast.importError'), { tone: 'error' });
    }
  };

  const center = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    if (!node) return null;
    return { x: node.x + W / 2, y: node.y + H / 2 };
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <ShapeButton kind="start" label={t('flow.start')} onClick={() => addNode('start')} />
        <ShapeButton kind="process" label={t('flow.process')} onClick={() => addNode('process')} />
        <ShapeButton kind="decision" label={t('flow.decision')} onClick={() => addNode('decision')} />
        <ShapeButton kind="end" label={t('flow.end')} onClick={() => addNode('end')} />

        <span className="mx-1 h-4 w-px bg-[var(--line)]" aria-hidden />

        <button
          type="button"
          className="btn h-8 !px-2 text-[12px]"
          style={
            connectFrom
              ? { background: 'var(--wash)', color: 'var(--accent)', borderColor: 'var(--accent)' }
              : undefined
          }
          onClick={() => setConnectFrom((prev) => (prev ? null : selected ?? ''))}
          disabled={!selected && !connectFrom}
          title={t('editor.flowHint')}
        >
          <Link2 size={14} />
          {lang === 'tr' ? 'Bağla' : 'Connect'}
        </button>

        <button
          type="button"
          className="btn btn-ghost h-8 !px-2 text-[12px]"
          onClick={removeSelected}
          disabled={!selected}
        >
          <Trash2 size={14} />
          {t('common.delete')}
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="btn btn-ghost h-8 !px-2 text-[12px]" onClick={exportPng}>
            <Download size={14} />
            <span className="hidden sm:inline">{t('editor.exportPng')}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost h-8 !px-2 text-[12px]"
            onClick={() => {
              if (!nodes.length) return;
              if (!window.confirm(lang === 'tr' ? 'Tuval temizlensin mi?' : 'Clear the canvas?')) return;
              setNodes([]);
              setEdges([]);
              nodesRef.current = [];
              edgesRef.current = [];
              setSelected(null);
              onChange({ flow: { nodes: [], edges: [] } });
            }}
          >
            <X size={14} />
            <span className="hidden sm:inline">{t('editor.clearCanvas')}</span>
          </button>
        </div>
      </div>

      <div
        className="relative overflow-auto rounded-[var(--radius)] border border-[var(--line)]"
        style={{ maxHeight: compact ? '46vh' : '62vh', background: 'var(--surface2)' }}
      >
        <div
          ref={boardRef}
          className="dotted-bg relative"
          style={{
            width: 960,
            height: compact ? 440 : 620,
            background: 'var(--surface)',
            touchAction: 'none',
          }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
              setConnectFrom(null);
            }
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--muted)" />
              </marker>
            </defs>
            {edges.map((edge, index) => {
              const from = center(edge.from);
              const to = center(edge.to);
              if (!from || !to) return null;
              const dx = Math.max(40, Math.abs(to.x - from.x) * 0.45);
              return (
                <path
                  key={`${edge.from}-${edge.to}-${index}`}
                  d={`M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="1.6"
                  markerEnd="url(#flow-arrow)"
                  opacity="0.75"
                />
              );
            })}
          </svg>

          {nodes.map((node) => {
            const isSelected = selected === node.id;
            const isConnecting = connectFrom === node.id;
            return (
              <div
                key={node.id}
                onPointerDown={(event) => startNode(event, node)}
                className="absolute flex items-center justify-center px-3 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                style={{
                  left: node.x,
                  top: node.y,
                  width: W,
                  height: H,
                  cursor: drag?.id === node.id ? 'grabbing' : 'grab',
                  background: `color-mix(in srgb, ${KIND_COLOR[node.kind]} 10%, var(--surface))`,
                  border: `1.5px ${node.kind === 'decision' ? 'dashed' : 'solid'} ${
                    isSelected || isConnecting ? 'var(--accent)' : `color-mix(in srgb, ${KIND_COLOR[node.kind]} 45%, var(--line))`
                  }`,
                  borderRadius: node.kind === 'start' || node.kind === 'end' ? 999 : 12,
                  outline: isConnecting ? '3px solid color-mix(in srgb, var(--accent) 22%, transparent)' : undefined,
                  touchAction: 'none',
                }}
              >
                <input
                  value={node.text}
                  onChange={(event) => rename(node.id, event.target.value)}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label={lang === 'tr' ? 'Kutu metni' : 'Box text'}
                  className="w-full bg-transparent text-center text-[12.5px] font-semibold outline-none"
                />
              </div>
            );
          })}

          {nodes.length === 0 && (
            <p className="absolute inset-0 grid place-items-center text-[13px] text-[var(--muted)]">
              {t('editor.flowHint')}
            </p>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--muted)]">{t('editor.flowHint')}</p>
    </div>
  );
}

function ShapeButton({
  kind,
  label,
  onClick,
}: {
  kind: FlowKind;
  label: string;
  onClick: () => void;
}) {
  const Icon =
    kind === 'start' ? Circle : kind === 'end' ? CircleCheck : kind === 'decision' ? Diamond : Square;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[12px] font-medium transition-colors hover:bg-[var(--surface2)]"
    >
      <Icon size={13} style={{ color: KIND_COLOR[kind] }} />
      {label}
    </button>
  );
}
