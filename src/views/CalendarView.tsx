import { useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import { useStore } from '../store/store';
import type { CalEvent } from '../types';
import { addDays, formatDate, parseISODate, startOfMonth, toISODate, todayISO, weekdayIndex, sameDay } from '../lib/utils';
import { categoryColor } from '../ui/meta';
import { EmptyState } from '../ui/kit';

export function CalendarView() {
  const { state, t, lang, startEvent, update } = useStore();
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(todayISO());

  const today = new Date();

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const offset = weekdayIndex(first);
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const event of state.events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    }
    return map;
  }, [state.events]);

  const selectedEvents = byDate.get(selected) ?? [];
  const selectedNote = state.dayNotes[selected] ?? '';
  const monthEvents = state.events.filter((event) => {
    const date = parseISODate(event.date);
    return date.getMonth() === cursor.getMonth() && date.getFullYear() === cursor.getFullYear();
  });

  const upcoming = [...state.events]
    .filter((event) => event.date >= todayISO())
    .sort((a, b) => `${a.date}${a.time || '99:99'}`.localeCompare(`${b.date}${b.time || '99:99'}`))
    .slice(0, 6);

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    addDays(new Date(2024, 0, 1), index).toLocaleDateString(locale, { weekday: 'short' }),
  );

  const move = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="wrap pb-24 pt-5 md:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-head)] text-[26px] font-semibold tracking-[-0.03em]">
            {t('cal.title')}
          </h1>
          <p className="text-[12.5px] text-[var(--muted)]">
            {t('cal.subtitle', { count: monthEvents.length })}
          </p>
        </div>
        <button type="button" className="btn btn-primary h-9" onClick={() => startEvent(selected)}>
          <Plus size={16} />
          {t('cal.add')}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_318px]">
        <section className="card overflow-hidden p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-head)] text-[17px] font-semibold capitalize">
              {cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </h2>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="btn btn-outline h-8 !px-2.5 text-[12px]"
                onClick={() => {
                  setCursor(startOfMonth(new Date()));
                  setSelected(todayISO());
                }}
              >
                {t('cal.today')}
              </button>
              <button type="button" className="icon-btn h-8 w-8" onClick={() => move(-1)} aria-label="Önceki ay">
                <ChevronLeft size={17} />
              </button>
              <button type="button" className="icon-btn h-8 w-8" onClick={() => move(1)} aria-label="Sonraki ay">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {weekdays.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10.5px] font-semibold tracking-[0.02em] text-[var(--muted)]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date) => {
              const iso = toISODate(date);
              const events = byDate.get(iso) ?? [];
              const isToday = sameDay(date, today);
              const inMonth = date.getMonth() === cursor.getMonth();
              const isSelected = selected === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  className="cal-day"
                  data-today={isToday}
                  data-outside={!inMonth}
                  data-selected={isSelected}
                  onClick={() => setSelected(iso)}
                  onDoubleClick={() => startEvent(iso)}
                  aria-label={formatDate(iso, lang, { day: 'numeric', month: 'long', weekday: 'long' })}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-1">
                    <span className="cal-day-num">{date.getDate()}</span>
                    {events.some((event) => event.kind === 'special') && (
                      <Star size={9} style={{ color: 'var(--tab-flow)' }} fill="currentColor" aria-hidden />
                    )}
                    {state.dayNotes[iso]?.trim() && (
                      <Pencil
                        size={8}
                        className="text-[var(--muted)]"
                        aria-label={t('cal.dayNote')}
                      />
                    )}
                  </span>
                  {events.slice(0, 2).map((event) => (
                    <span
                      key={event.id}
                      className="cal-pill"
                      style={{ ['--tab' as string]: categoryColor(event.category) }}
                    >
                      {event.time && <span className="mr-1 tabular-nums opacity-70">{event.time}</span>}
                      {event.title}
                    </span>
                  ))}
                  {events.length > 2 && (
                    <span className="pl-1 text-[10px] font-medium text-[var(--muted)]">
                      +{events.length - 2}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-2.5 text-[11px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
              {t('cal.legendEvent')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={10} style={{ color: 'var(--tab-flow)' }} fill="currentColor" />
              {t('cal.legendSpecial')}
            </span>
            <span className="ml-auto hidden items-center gap-1 sm:inline-flex">
              <Sparkles size={11} />
              {t('cal.remindHint').split('.')[0]}
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-semibold">{t('cal.dayDetail')}</h2>
                <p className="text-[11.5px] capitalize text-[var(--muted)]">
                  {formatDate(selected, lang, { day: 'numeric', month: 'long', weekday: 'long' })}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn h-8 w-8 border border-[var(--line)]"
                onClick={() => startEvent(selected)}
                aria-label={t('cal.add')}
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="mt-3 space-y-1.5">
              {selectedEvents.length === 0 ? (
                <p className="py-3 text-[12.5px] text-[var(--muted)]">{t('cal.emptyDay')}</p>
              ) : (
                selectedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => startEvent(event.date, event.id)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--surface2)]"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: categoryColor(event.category) }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium">{event.title}</span>
                        {event.kind === 'special' && (
                          <Star size={10} style={{ color: 'var(--tab-flow)' }} fill="currentColor" />
                        )}
                        {event.remind && <Bell size={10} className="text-[var(--muted)]" />}
                      </span>
                      <span className="block text-[11.5px] text-[var(--muted)]">
                        {event.time || t('cal.special')}
                        {event.note ? ` · ${event.note}` : ''}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 border-t border-[var(--line)] pt-3">
              <label
                htmlFor="day-note"
                className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--muted)]"
              >
                <Pencil size={12} />
                {t('cal.dayNote')}
              </label>
              <textarea
                id="day-note"
                value={selectedNote}
                onChange={(event) => {
                  const value = event.target.value;
                  update((draft) => {
                    if (value.trim()) draft.dayNotes[selected] = value;
                    else delete draft.dayNotes[selected];
                  });
                }}
                placeholder={t('cal.dayNotePlaceholder')}
                rows={3}
                name="day-note"
                autoComplete="off"
                className="area !text-[13px]"
              />
              <p className="mt-1 text-right text-[10.5px] text-[var(--muted)]">{t('cal.dayNoteHint')}</p>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
              <CalendarDays size={15} className="text-[var(--muted)]" />
              {t('cal.upcoming')}
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={18} />}
                title={t('cal.none')}
                description={t('cal.emptyUpcoming')}
                action={
                  <button type="button" className="btn btn-outline" onClick={() => startEvent(todayISO())}>
                    {t('cal.add')}
                  </button>
                }
              />
            ) : (
              <ul className="space-y-1">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => startEvent(event.date, event.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--surface2)]"
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10.5px] font-semibold tabular-nums"
                        style={{
                          background: `color-mix(in srgb, ${categoryColor(event.category)} 12%, var(--surface))`,
                          color: categoryColor(event.category),
                        }}
                      >
                        {parseISODate(event.date).getDate()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">{event.title}</span>
                        <span className="block text-[10.5px] capitalize text-[var(--muted)]">
                          {formatDate(event.date, lang, { day: 'numeric', month: 'short' })}
                          {event.time ? ` · ${event.time}` : ''}
                        </span>
                      </span>
                      {event.kind === 'special' && (
                        <Star size={11} style={{ color: 'var(--tab-flow)' }} fill="currentColor" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
