import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Download,
  HardDriveDownload,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useStore } from '../store/store';
import { Kbd } from './kit';
import { promptInstall, useCanInstall } from './pwa';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)',
      }}
      aria-hidden
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 18 18" fill="none">
        <path d="M4 3.2h8.2A1.8 1.8 0 0 1 14 5v8.2a1.8 1.8 0 0 1-1.8 1.8H4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 3.2v11.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 6.6h4M7 9.2h4M7 11.8h2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      </svg>
    </span>
  );
}

export function TopBar() {
  const { t, setUI, ui, exportData, importData, navigate, toast } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canInstall = useCanInstall();

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const install = async () => {
    setMenuOpen(false);
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      toast(t('settings.installed'), { tone: 'success' });
    } else if (outcome === 'unavailable') {
      toast(t('toast.installUnavailable'));
    }
  };

  return (
    <header
      className="no-print sticky top-0 z-40 border-b border-[var(--line)]"
      style={{ background: 'color-mix(in srgb, var(--bg) 84%, transparent)', backdropFilter: 'blur(12px)' }}
    >
      <div className="wrap flex h-[58px] items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-2"
          aria-label={t('nav.home')}
        >
          <Logo />
          <span className="hidden font-[family-name:var(--font-head)] text-[16px] font-semibold tracking-[-0.02em] sm:block">
            {t('app.name')}
          </span>
        </button>

        <div className="flex flex-1 justify-center px-1">
          <button
            type="button"
            onClick={() => setUI({ paletteOpen: true })}
            className="group hidden h-9 w-full max-w-[380px] items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 text-left text-[13px] text-[var(--muted)] transition-colors hover:border-[color-mix(in_srgb,var(--ink)_16%,var(--line))] md:flex"
          >
            <Search size={15} className="shrink-0" />
            <span className="flex-1 truncate">{t('top.search')}</span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="icon-btn md:hidden"
            onClick={() => setUI({ paletteOpen: true })}
            aria-label={t('top.search')}
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className="btn btn-primary h-9 !px-2.5 sm:!px-3.5"
            onClick={() => setUI({ pickerOpen: true })}
            aria-label={t('top.addNote')}
          >
            <Plus size={17} strokeWidth={2.2} />
            <span className="hidden sm:inline">{t('top.addNote')}</span>
          </button>

          <button
            type="button"
            className="icon-btn"
            data-active={ui.aiOpen}
            onClick={() => setUI({ aiOpen: true })}
            aria-label={t('top.ai')}
            title={t('top.ai')}
          >
            <Sparkles size={18} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="icon-btn hidden md:inline-grid"
              aria-label={t('top.download')}
              title={t('top.download')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Download size={18} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[44px] w-[248px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-[var(--shadow-lift)]"
              >
                <MenuItem
                  icon={canInstall ? <Download size={15} /> : <Download size={15} />}
                  label={canInstall ? t('top.install') : t('settings.install')}
                  onClick={install}
                  badge={canInstall ? t('top.offline') : undefined}
                />
                <MenuItem
                  icon={<HardDriveDownload size={15} />}
                  label={t('top.backup')}
                  onClick={() => {
                    exportData();
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={<Upload size={15} />}
                  label={t('top.restore')}
                  onClick={() => {
                    fileRef.current?.click();
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={<Printer size={15} />}
                  label={t('top.print')}
                  onClick={() => {
                    setMenuOpen(false);
                    window.print();
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setUI({ settingsOpen: true })}
            aria-label={t('top.settings')}
            title={t('nav.settings')}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importData(file);
            event.target.value = '';
          }
        }}
      />
    </header>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  badge,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--ink)] transition-colors hover:bg-[var(--surface2)]"
    >
      <span className="text-[var(--muted)]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="text-[10.5px] text-[var(--muted)]">{badge}</span>}
    </button>
  );
}
