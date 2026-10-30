import { CheckCircle2, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../store/store';

export function Toasts() {
  const { toasts, dismissToast } = useStore();

  if (!toasts.length) return null;

  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 bottom-[84px] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="toast pointer-events-auto max-w-[520px]">
          {toast.tone === 'success' && <CheckCircle2 size={17} className="shrink-0 text-[#5fd39b]" />}
          {toast.tone === 'error' && <TriangleAlert size={17} className="shrink-0 text-[#ff9a7a]" />}
          <span className="flex-1">{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold text-[var(--bg)] opacity-90 hover:opacity-100"
              onClick={() => {
                toast.undo?.();
                dismissToast(toast.id);
              }}
            >
              <RotateCcw size={13} />
              {toast.undoLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Kapat"
            className="rounded p-1 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
