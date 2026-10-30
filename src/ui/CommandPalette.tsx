import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  CalendarPlus,
  CornerDownLeft,
  Download,
  FileText,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useStore } from '../store/store';
import { formatDate, matches, todayISO } from '../lib/utils';
import { moduleById, NOTE_TYPE_META } from './meta';

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
};

export function CommandPalette() {
  const { ui, setUI, state, t, lang, openNote, startEvent, setSettings, exportData } = useStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ui.paletteOpen) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [ui.paletteOpen]);

  const close = () => setUI({ paletteOpen: false });

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];

    const actions: Item[] = [
      {
        id: 'a-note',
        group: t('cmd.actions'),
        label: t('cmd.newNote'),
        icon: <PlusCircle size={15} />,
        run: () => setUI({ pickerOpen: true }),
      },
      {
        id: 'a-event',
        group: t('cmd.actions'),
        label: t('cmd.newEvent'),
        icon: <CalendarPlus size={15} />,
        run: () => startEvent(todayISO()),
      },
      {
        id: 'a-ai',
        group: t('cmd.actions'),
        label: t('cmd.ai'),
        icon: <Sparkles size={15} />,
        run: () => setUI({ aiOpen: true }),
      },
      {
        id: 'a-theme',
        group: t('cmd.actions'),
        label: t('cmd.theme'),
        icon: state.settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        run: () =>
          setSettings({
            theme: state.settings.theme === 'light' ? 'dark' : state.settings.theme === 'dark' ? 'color' : 'light',
          }),
      },
      {
        id: 'a-export',
        group: t('cmd.actions'),
        label: t('cmd.export'),
        icon: <Download size={15} />,
        run: () => exportData(),
      },
      {
        id: 'a-settings',
        group: t('cmd.actions'),
        label: t('cmd.settings'),
        icon: <Settings size={15} />,
        run: () => setUI({ settingsOpen: true }),
      },
    ];

    list.push(...actions.filter((item) => matches(item.label, query)));

    const notes = [...state.notes]
      .filter((note) => !note.archived)
      .filter((note) => matches(`${note.title} ${note.body ?? ''} ${note.code?.source ?? ''}`, query))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, query ? 6 : 4);

    for (const note of notes) {
      const meta = moduleById(note.type === 'table' ? 'sheet' : note.type === 'doc' ? 'doc' : note.type === 'flow' ? 'flow' : note.type === 'code' ? 'code' : 'notes');
      const Icon = meta?.icon ?? FileText;
      list.push({
        id: `note-${note.id}`,
        group: t('cmd.notes'),
        label: note.title || t('notes.card.empty'),
        hint: t(NOTE_TYPE_META[note.type].labelKey),
        icon: <Icon size={15} />,
        run: () => openNote(note.id),
      });
    }

    const events = state.events
      .filter((event) => event.date >= todayISO())
      .filter((event) => matches(event.title, query))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, query ? 4 : 3);

    for (const event of events) {
      list.push({
        id: `event-${event.id}`,
        group: t('cmd.events'),
        label: event.title,
        hint: `${formatDate(event.date, lang, { day: 'numeric', month: 'short' })}${event.time ? ` · ${event.time}` : ''}`,
        icon: <CalendarPlus size={15} />,
        run: () => startEvent(event.date, event.id),
      });
    }

    return list;
  }, [query, state.notes, state.events, state.settings.theme, t, lang, setUI, startEvent, setSettings, exportData, openNote]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    if (!ui.paletteOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUI({ paletteOpen: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ui.paletteOpen, setUI]);

  if (!ui.paletteOpen) return null;

  const runItem = (item: Item) => {
    item.run();
    close();
  };

  let lastGroup = '';

  return createPortal(
    <div
      className="no-print fixed inset-0 z-[75] flex justify-center bg-[color-mix(in_srgb,var(--ink)_35%,transparent)] px-3 pt-[10vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('top.search')}
        className="h-fit w-full max-w-[560px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 transition-colors focus-within:border-[var(--accent)]">
          <Search size={17} className="shrink-0 text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((prev) => (items.length ? (prev + 1) % items.length : 0));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                const item = items[active];
                if (item) runItem(item);
              }
            }}
            placeholder={t('cmd.placeholder')}
            aria-label={t('cmd.placeholder')}
            className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-none"
          />
          <button type="button" onClick={close} className="chip !py-0.5 text-[10px]" aria-label={t('common.close')}>
            esc
          </button>
        </div>

        <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-[12.5px] text-[var(--muted)]">{t('cmd.none')}</p>
          )}
          {items.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <p className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold text-[var(--muted)]">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runItem(item)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
                  style={{ background: index === active ? 'var(--wash)' : 'transparent' }}
                >
                  <span style={{ color: index === active ? 'var(--accent)' : 'var(--muted)' }}>{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-[10.5px] text-[var(--muted)]">{item.hint}</span>}
                  {index === active ? (
                    <CornerDownLeft size={13} className="shrink-0 text-[var(--muted)]" />
                  ) : (
                    <ArrowRight size={12} className="shrink-0 opacity-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-1.5 text-[10px] text-[var(--muted)]">
          <span>{t('cmd.hint')}</span>
          <span>{lang === 'tr' ? 'Cihaz içi' : 'On-device'}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
