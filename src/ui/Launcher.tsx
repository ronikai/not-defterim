import type { CSSProperties } from 'react';
import {
  CalendarDays,
  Clock3,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useStore } from '../store/store';
import { MODULES, NOTE_TYPE_META, categoryColor } from '../ui/meta';
import type { NoteType } from '../types';
import {
  formatDate,
  relativeTime,
  todayISO,
} from '../lib/utils';
import { EmptyState } from '../ui/kit';

function greetingKey(hour: number): string {
  if (hour < 12) return 'home.morning';
  if (hour < 18) return 'home.day';
  return 'home.evening';
}

export function Launcher() {
  const { state, t, lang, navigate, setUI, createNote, openNote } = useStore();
  const { notes, events, activity } = state;
  const today = todayISO();
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';

  const todayEvents = events
    .filter((event) => event.date === today)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const upcoming = events
    .filter((event) => event.date >= today && event.remind)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const nextReminder = upcoming.find((event) => {
    const when = new Date(`${event.date}T${event.time || '09:00'}`);
    const diff = when.getTime() - Date.now();
    return diff > 0 && diff <= 36 * 3600 * 1000;
  });

  const recent = [...notes]
    .filter((note) => !note.archived)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  const now = new Date();
  const dateLine = now.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const doneItems = notes.reduce(
    (total, note) => total + (note.items?.filter((item) => item.done).length ?? 0),
    0,
  );

  const countFor = (id: string, type?: NoteType) =>
    type
      ? notes.filter((note) => note.type === type && !note.archived).length
      : id === 'notes'
        ? notes.filter((note) => !note.archived).length
        : events.length;

  return (
    <div className="wrap pb-24 pt-6 md:pb-12">
      <section
        className="relative overflow-hidden rounded-[22px] border border-[var(--line)]"
        style={{
          background: 'linear-gradient(135deg, var(--wash) 0%, var(--surface) 58%)',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <div className="dotted-bg pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
        <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[1.25fr_0.9fr] md:gap-8">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-[12.5px] font-medium text-[var(--muted)]">{dateLine}</p>
              <h1 className="mt-1 font-[family-name:var(--font-head)] text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
                {t(greetingKey(now.getHours()))}
                <span className="text-[var(--accent)]">.</span>
              </h1>
              <p className="mt-2 max-w-[34ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
                {t('home.subtitle')}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-primary" onClick={() => setUI({ pickerOpen: true })}>
                  <StickyNote size={16} />
                  {t('top.addNote')}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setUI({ aiOpen: true })}
                >
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  {t('nav.ai')}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11.5px] text-[var(--muted)]">{t('common.quickNote')}:</span>
                {(['text', 'checklist', 'table', 'code'] as NoteType[]).map((type) => {
                  const meta = NOTE_TYPE_META[type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => createNote(type, 'kisisel')}
                      className="chip transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
                    >
                      <Icon size={12} />
                      {t(meta.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="relative rounded-[16px] border border-[var(--line)] p-4"
              style={{
                background: 'var(--surface)',
                transform: 'rotate(-0.6deg)',
                boxShadow: '0 14px 30px -18px rgba(0,0,0,0.45)',
              }}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 h-3.5 w-16 -translate-x-1/2 rounded-[2px] border border-[var(--line)]"
                style={{ background: 'color-mix(in srgb, var(--surface2) 80%, var(--accent) 20%)' }}
              />
              <div className="flex items-center justify-between">
                <h2 className="text-[12.5px] font-semibold text-[var(--muted)]">
                  {t('home.today')}
                </h2>
                <button
                  type="button"
                  className="text-[11.5px] font-medium text-[var(--accent)]"
                  onClick={() => navigate('calendar')}
                >
                  {t('home.viewAll')}
                </button>
              </div>

              {todayEvents.length === 0 ? (
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted)]">{t('home.noToday')}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {todayEvents.slice(0, 4).map((event) => (
                    <li key={event.id} className="flex items-start gap-2.5">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background:
                            event.kind === 'special' ? categoryColor(event.category) : 'var(--accent)',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium leading-tight">{event.title}</p>
                        <p className="text-[11.5px] text-[var(--muted)]">
                          {event.time || t('cal.special')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {nextReminder && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--wash)] px-2.5 py-1.5 text-[11.5px] text-[var(--accent)]">
                  <Clock3 size={12} />
                  <span className="truncate">
                    {nextReminder.title} · {formatDate(nextReminder.date, lang, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}

              {state.dayNotes[today]?.trim() && (
                <p className="mt-2 line-clamp-2 border-t border-[var(--line)] pt-2 text-[11.5px] leading-snug text-[var(--muted)]">
                  {state.dayNotes[today]}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat value={notes.filter((n) => !n.archived).length} label={t('home.statsNotes')} />
        <Stat value={events.length} label={t('home.statsEvents')} />
        <Stat value={doneItems} label={t('home.statsDone')} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-head)] text-[19px] font-semibold tracking-[-0.02em]">
            {t('home.modules')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {MODULES.map((module, index) => {
            const Icon = module.icon;
            const count = countFor(module.id, module.type);
            return (
              <button
                key={module.id}
                type="button"
                className="module-tile rise"
                style={
                  {
                    '--tab': module.tab,
                    '--wash': module.wash,
                    animationDelay: `${index * 35}ms`,
                  } as CSSProperties
                }
                onClick={() => navigate(module.id)}
              >
                <span className="module-icon">
                  <Icon size={21} strokeWidth={1.85} />
                </span>
                <span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold">{t(module.titleKey)}</span>
                    <span className="text-[11.5px] font-medium tabular-nums" style={{ color: module.tab }}>
                      {count}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--muted)]">
                    {t(module.descKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-head)] text-[17px] font-semibold tracking-[-0.02em]">
              {t('home.recent')}
            </h2>
            <button
              type="button"
              className="text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => navigate('notes')}
            >
              {t('home.viewAll')}
            </button>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<StickyNote size={20} />}
              title={t('notes.empty.title')}
              description={t('notes.empty.desc')}
              action={
                <button type="button" className="btn btn-primary" onClick={() => setUI({ pickerOpen: true })}>
                  {t('home.emptyNotes')}
                </button>
              }
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {recent.map((note) => {
                const meta = NOTE_TYPE_META[note.type];
                const Icon = meta.icon;
                const done = note.items?.filter((item) => item.done).length ?? 0;
                const total = note.items?.length ?? 0;
                return (
                  <button
                    key={note.id}
                    type="button"
                    className="note-card"
                    style={{ '--tab': meta.tab } as CSSProperties}
                    onClick={() => openNote(note.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: meta.tab }} />
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        {t(meta.labelKey)}
                      </span>
                      <span className="ml-auto text-[11px] text-[var(--muted)]">
                        {relativeTime(note.updatedAt, lang)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[14px] font-semibold">{note.title || t('notes.card.empty')}</p>
                    {note.type === 'checklist' ? (
                      <p className="text-[12px] text-[var(--muted)]">
                        {done}/{total} {t('notes.card.items')}
                      </p>
                    ) : (
                      <p className="line-clamp-2 text-[12px] leading-snug text-[var(--muted)]">
                        {previewOf(note)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-head)] text-[17px] font-semibold tracking-[-0.02em]">
              {t('home.activity')}
            </h2>
            <CalendarDays size={15} className="text-[var(--muted)]" />
          </div>
          <div className="card-flat p-3">
            {activity.length === 0 ? (
              <p className="px-1 py-6 text-center text-[12.5px] text-[var(--muted)]">
                {t('home.noActivity')}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {activity.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span
                      className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: item.source === 'ai' ? 'var(--accent)' : 'var(--line)' }}
                    />
                    <p className="flex-1 text-[12.5px] leading-snug">{item.text}</p>
                    <span className="shrink-0 text-[10.5px] text-[var(--muted)]">
                      {relativeTime(item.at, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <p className="mt-8 text-center text-[11.5px] text-[var(--muted)]">
        {t('settings.storage')} · {t('top.offline')}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card-flat flex items-baseline gap-2 px-3.5 py-2.5">
      <span className="font-[family-name:var(--font-head)] text-[20px] font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-[12px] text-[var(--muted)]">{label}</span>
    </div>
  );
}

function previewOf(note: { type: string; body?: string; items?: unknown[]; cells?: Record<string, string>; code?: { source: string } }): string {
  if (note.type === 'code' && note.code) return note.code.source.split('\n')[0] ?? '';
  if (note.type === 'table') return Object.values(note.cells ?? {}).slice(0, 4).join(' · ');
  if (note.body) {
    return note.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110);
  }
  return '';
}
