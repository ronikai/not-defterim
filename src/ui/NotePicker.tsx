import { useEffect, useState } from 'react';
import { NOTE_TYPES, type NoteType } from '../types';
import { useStore } from '../store/store';
import { Modal } from '../ui/kit';
import { NOTE_TYPE_META } from '../ui/meta';

export function NotePicker() {
  const { ui, setUI, t, createNote } = useStore();
  const [title, setTitle] = useState('');
  const [hovered, setHovered] = useState<NoteType | null>(null);

  useEffect(() => {
    if (!ui.pickerOpen) return;
    setTitle('');
    setHovered(null);
  }, [ui.pickerOpen]);

  const close = () => setUI({ pickerOpen: false });

  return (
    <Modal
      open={ui.pickerOpen}
      onClose={close}
      title={t('picker.title')}
      subtitle={t('picker.subtitle')}
      width={680}
    >
      <div className="mb-4">
        <label className="label" htmlFor="new-note-title">
          {t('picker.titleField')}
        </label>
        <input
          id="new-note-title"
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('picker.titlePlaceholder')}
          className="field"
          autoComplete="off"
          name="new-note-title"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {NOTE_TYPES.map((type) => {
          const meta = NOTE_TYPE_META[type];
          const Icon = meta.icon;
          const active = hovered === type;
          return (
            <button
              key={type}
              type="button"
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(type)}
              onClick={() => createNote(type, 'kisisel', title.trim() || undefined)}
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-all"
              style={{
                borderColor: active ? `color-mix(in srgb, ${meta.tab} 42%, var(--line))` : 'var(--line)',
                background: active ? meta.wash : 'var(--surface)',
              }}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px]"
                style={{ background: meta.wash, color: meta.tab }}
              >
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold leading-tight">{t(meta.labelKey)}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--muted)]">
                  {t(meta.descKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
