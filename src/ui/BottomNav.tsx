import { CalendarDays, House, NotebookPen, Plus, Sparkles } from 'lucide-react';
import { useStore } from '../store/store';
import type { ViewId } from '../types';

export function BottomNav() {
  const { ui, navigate, setUI, t } = useStore();

  const items: { id: ViewId; icon: typeof House; label: string }[] = [
    { id: 'home', icon: House, label: t('nav.home') },
    { id: 'notes', icon: NotebookPen, label: t('nav.notes') },
    { id: 'calendar', icon: CalendarDays, label: t('nav.calendar') },
  ];

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] md:hidden"
      style={{
        background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
        backdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label={t('nav.home')}
    >
      <div className="grid h-[62px] grid-cols-5 items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const active = ui.view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className="flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium"
              style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </button>
          );
        })}

        <div className="-mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setUI({ pickerOpen: true })}
            className="grid h-[52px] w-[52px] place-items-center rounded-full shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)]"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
            aria-label={t('top.addNote')}
          >
            <Plus size={24} strokeWidth={2.4} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setUI({ aiOpen: true })}
          className="flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium"
          style={{ color: ui.aiOpen ? 'var(--accent)' : 'var(--muted)' }}
        >
          <Sparkles size={20} strokeWidth={ui.aiOpen ? 2.2 : 1.8} />
          {t('nav.ai')}
        </button>
      </div>
    </nav>
  );
}
