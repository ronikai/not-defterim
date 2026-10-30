import { useEffect, useState } from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { useStore } from '../store/store';
import { Modal, Switch } from './kit';
import { CATEGORIES, type CalEvent, type CategoryId } from '../types';
import { todayISO } from '../lib/utils';
import { categoryColor } from './meta';

type Form = {
  title: string;
  date: string;
  time: string;
  kind: CalEvent['kind'];
  category: CategoryId;
  note: string;
  remind: boolean;
};

const EMPTY: Form = {
  title: '',
  date: todayISO(),
  time: '',
  kind: 'event',
  category: 'kisisel',
  note: '',
  remind: true,
};

export function EventDialog() {
  const { ui, setUI, state, addEvent, updateEvent, deleteEvent, t, toast, logActivity } = useStore();
  const draft = ui.eventDraft;
  const existing = draft?.id ? state.events.find((event) => event.id === draft.id) : null;
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    if (!draft) return;
    if (existing) {
      setForm({
        title: existing.title,
        date: existing.date,
        time: existing.time,
        kind: existing.kind,
        category: existing.category,
        note: existing.note,
        remind: existing.remind,
      });
    } else {
      setForm({ ...EMPTY, date: draft.date });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id, draft?.date]);

  if (!draft) return null;

  const close = () => setUI({ eventDraft: null });
  const patch = (value: Partial<Form>) => setForm((prev) => ({ ...prev, ...value }));

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    if (draft.id) {
      updateEvent(draft.id, { ...form, title, notifiedAt: null });
      logActivity(`${t('cal.editTitle')}: ${title}`);
    } else {
      addEvent({ ...form, title });
      logActivity(`${t('cal.newTitle')}: ${title}`);
    }
    toast(t('toast.saved'), { tone: 'success' });
    close();
  };

  return (
    <Modal
      open={Boolean(draft)}
      onClose={close}
      title={draft.id ? t('cal.editTitle') : t('cal.newTitle')}
      width={560}
      footer={
        <>
          {draft.id && (
            <button
              type="button"
              className="btn btn-danger mr-auto h-9"
              onClick={() => {
                if (!window.confirm(t('cal.deleteConfirm'))) return;
                deleteEvent(draft.id!);
                toast(t('notes.deleted'));
                close();
              }}
            >
              <Trash2 size={15} />
              {t('common.delete')}
            </button>
          )}
          <button type="button" className="btn btn-ghost h-9" onClick={close}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary h-9" onClick={save} disabled={!form.title.trim()}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3 pb-1">
        <div>
          <label className="label" htmlFor="event-title">
            {t('cal.titleField')}
          </label>
          <input
            id="event-title"
            autoFocus
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
            }}
            className="field"
            placeholder={t('cal.titleField')}
            autoComplete="off"
            name="event-title"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="event-date">
              {t('cal.date')}
            </label>
            <input
              id="event-date"
              type="date"
              value={form.date}
              onChange={(event) => patch({ date: event.target.value })}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="event-time">
              {t('cal.time')}
            </label>
            <input
              id="event-time"
              type="time"
              value={form.time}
              onChange={(event) => patch({ time: event.target.value })}
              className="field"
            />
          </div>
        </div>

        <div>
          <span className="label">{t('cal.kind')}</span>
          <div className="seg w-full">
            {(
              [
                ['event', t('cal.event')],
                ['special', t('cal.special')],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                data-on={form.kind === kind}
                className="flex-1"
                onClick={() => patch({ kind })}
              >
                {kind === 'special' ? '★ ' : ''}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="event-category">
            {t('editor.category')}
          </label>
          <select
            id="event-category"
            value={form.category}
            onChange={(event) => patch({ category: event.target.value as CategoryId })}
            className="field"
            style={{ color: categoryColor(form.category) }}
          >
            {CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {t(`cat.${id}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="event-note">
            {t('cal.note')}
          </label>
          <textarea
            id="event-note"
            value={form.note}
            onChange={(event) => patch({ note: event.target.value })}
            className="area"
            rows={2}
            placeholder={t('cal.note')}
            autoComplete="off"
            name="event-note"
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface2)] p-3">
          <div className="flex items-start gap-2.5">
            <BellRing size={16} className="mt-0.5 text-[var(--muted)]" />
            <div>
              <p className="text-[13px] font-medium">{t('cal.remind')}</p>
              <p className="text-[11.5px] leading-snug text-[var(--muted)]">{t('cal.remindHint')}</p>
            </div>
          </div>
          <Switch checked={form.remind} onChange={(next) => patch({ remind: next })} label={t('cal.remind')} />
        </div>
      </div>
    </Modal>
  );
}
