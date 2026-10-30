import {
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 720,
  hideClose = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  hideClose?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Odak zaten panelin içindeyse (başlık, giriş alanı) yeniden çalma.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop no-print"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{ maxWidth: width }}
        tabIndex={-1}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6">
            <div className="min-w-0">
              {title && (
                <h2 className="font-[family-name:var(--font-head)] text-[19px] font-semibold text-[var(--ink)]">
                  {title}
                </h2>
              )}
              {subtitle && <p className="mt-0.5 text-[13px] text-[var(--muted)]">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button type="button" className="icon-btn -mr-1 -mt-1" onClick={onClose} aria-label="Kapat">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-5 pb-5 sm:px-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors"
      style={{
        background: checked ? 'var(--accent)' : 'var(--surface2)',
        borderColor: checked ? 'var(--accent)' : 'var(--line)',
      }}
    >
      <span
        className="block h-[18px] w-[18px] rounded-full transition-transform"
        style={{
          background: checked ? 'var(--accent-ink)' : 'var(--muted)',
          transform: `translateX(${checked ? 22 : 3}px)`,
        }}
      />
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface2)] text-[var(--muted)]">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-[340px] text-[13.5px] leading-relaxed text-[var(--muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ToolButton({
  onClick,
  label,
  active,
  children,
  title,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--ink)]"
      style={active ? { background: 'var(--wash)', color: 'var(--accent)' } : undefined}
    >
      {children}
    </button>
  );
}

export function SectionHead({
  title,
  action,
  hint,
}: {
  title: string;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {hint && <p className="text-[12.5px] text-[var(--muted)]">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface2)]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: 'var(--accent)' }}
      />
    </div>
  );
}

export function CategoryDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color }}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--line)] bg-[var(--surface2)] px-1.5 py-0.5 font-[family-name:var(--font-code)] text-[10.5px] text-[var(--muted)]">
      {children}
    </kbd>
  );
}

export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5" style={style}>
      {children}
    </div>
  );
}
