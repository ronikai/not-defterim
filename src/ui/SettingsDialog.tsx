import { useState } from 'react';
import {
  Bell,
  Check,
  Download,
  Globe2,
  HardDriveDownload,
  Info,
  Languages,
  Monitor,
  Moon,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../store/store';
import { Modal, Row, Switch } from './kit';
import { PALETTES } from './theme';
import { SOUNDS, playSound } from './sounds';
import { isStandalone, promptInstall, useCanInstall } from './pwa';
import type { AssistantTone, ThemeMode } from '../types';

const TONES: AssistantTone[] = ['friendly', 'formal', 'short', 'long', 'slang', 'polite'];

export function SettingsDialog() {
  const { ui, setUI, t, lang, settings, setSettings, exportData, importData, resetAll, toast } = useStore();
  const [permission, setPermission] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const canInstall = useCanInstall();
  const installed = isStandalone();

  const close = () => setUI({ settingsOpen: false });

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    setSettings({ notifications: result === 'granted' });
    toast(result === 'granted' ? t('toast.notifyOn') : t('toast.notifyOff'), {
      tone: result === 'granted' ? 'success' : 'default',
    });
  };

  const themes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: t('settings.light'), icon: Sun },
    { id: 'dark', label: t('settings.dark'), icon: Moon },
    { id: 'color', label: t('settings.color'), icon: Palette },
  ];

  return (
    <Modal
      open={ui.settingsOpen}
      onClose={close}
      title={t('settings.title')}
      width={620}
      footer={
        <button type="button" className="btn btn-primary h-9" onClick={close}>
          {t('common.done')}
        </button>
      }
    >
      <div className="space-y-5 pb-1">
        <section>
          <h3 className="mb-2 text-[12px] font-semibold text-[var(--muted)]">
            {t('settings.appearance')}
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const active = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSettings({ theme: theme.id })}
                  aria-pressed={active}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--line)',
                    background: active ? 'var(--wash)' : 'var(--surface)',
                  }}
                >
                  <Icon size={18} style={{ color: active ? 'var(--accent)' : 'var(--muted)' }} />
                  <span className="text-[12.5px] font-medium">{theme.label}</span>
                </button>
              );
            })}
          </div>

          {settings.theme === 'color' && (
            <div className="mt-3 rounded-xl border border-[var(--line)] p-3">
              <p className="label !mb-2">{t('settings.palette')}</p>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                {PALETTES.map((palette) => {
                  const active = settings.palette === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      title={palette.name[lang]}
                      aria-label={palette.name[lang]}
                      aria-pressed={active}
                      onClick={() => setSettings({ palette: palette.id, accent: '' })}
                      className="group relative overflow-hidden rounded-lg border p-1 transition-transform hover:-translate-y-0.5"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--line)',
                        background: palette.tokens.bg,
                      }}
                    >
                      <span
                        className="block h-6 w-full rounded"
                        style={{ background: palette.tokens.surface }}
                      />
                      <span
                        className="mt-1 block h-2 w-2/3 rounded-full"
                        style={{ background: palette.tokens.accent }}
                      />
                      <span className="mt-1 block truncate text-[9.5px] text-[var(--muted)]">
                        {palette.name[lang]}
                      </span>
                      {active && (
                        <span
                          className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full"
                          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
                        >
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <label className="flex flex-1 items-center gap-2 text-[12px] text-[var(--muted)]">
                  {t('settings.customColor')}
                  <input
                    type="color"
                    value={settings.accent || PALETTES.find((p) => p.id === settings.palette)?.tokens.accent}
                    onChange={(event) => setSettings({ accent: event.target.value })}
                    className="h-7 w-10 cursor-pointer rounded border border-[var(--line)] bg-transparent p-0.5"
                  />
                </label>
                <button
                  type="button"
                  className="text-[11.5px] text-[var(--muted)] underline-offset-2 hover:underline"
                  onClick={() => setSettings({ accent: '' })}
                >
                  {t('common.none')}
                </button>
              </div>
            </div>
          )}

          <Row>
            <div>
              <p className="text-[13px] font-medium">{t('settings.motion')}</p>
              <p className="text-[11.5px] text-[var(--muted)]">{t('settings.motionDesc')}</p>
            </div>
            <Switch
              checked={settings.reduceMotion}
              onChange={(next) => setSettings({ reduceMotion: next })}
              label={t('settings.motion')}
            />
          </Row>
        </section>

        <section className="border-t border-[var(--line)] pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)]">
            <Languages size={13} />
            {t('settings.language')}
          </h3>
          <div className="seg w-full">
            {(
              [
                ['tr', 'Türkçe'],
                ['en', 'English'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className="flex-1"
                data-on={settings.lang === code}
                onClick={() => setSettings({ lang: code })}
              >
                <Globe2 size={13} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)]">
            <Sparkles size={13} />
            {t('settings.assistant')}
          </h3>
          <label className="label" htmlFor="nickname">
            {t('settings.nickname')}
          </label>
          <input
            id="nickname"
            value={settings.nickname}
            maxLength={24}
            onChange={(event) => setSettings({ nickname: event.target.value })}
            placeholder={t('settings.nicknamePlaceholder')}
            className="field"
            autoComplete="off"
            name="nickname"
          />
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">{t('settings.nicknameHint')}</p>

          <p className="label mt-3">{t('settings.tone')}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {TONES.map((tone) => {
              const active = settings.tone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSettings({ tone })}
                  className="rounded-lg border p-2 text-left transition-colors"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--line)',
                    background: active ? 'var(--wash)' : 'var(--surface)',
                  }}
                >
                  <span
                    className="block text-[12px] font-semibold leading-tight"
                    style={{ color: active ? 'var(--accent)' : 'var(--ink)' }}
                  >
                    {t(`tone.${tone}`)}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-[var(--muted)]">
                    {t(`tone.${tone}.desc`)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">{t('settings.toneHint')}</p>
        </section>

        <section className="border-t border-[var(--line)] pt-4">
          <h3 className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)]">
            <Bell size={13} />
            {t('settings.notifications')}
          </h3>
          <Row>
            <div>
              <p className="text-[13px] font-medium">{t('settings.notificationsDesc')}</p>
              <p className="text-[11.5px] text-[var(--muted)]">
                {t('settings.permission')}:{' '}
                {permission === 'granted'
                  ? t('settings.permissionGranted')
                  : permission === 'denied'
                    ? t('settings.permissionDenied')
                    : permission === 'unsupported'
                      ? t('common.none')
                      : t('common.disabled')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission !== 'granted' && permission !== 'unsupported' && (
                <button type="button" className="btn btn-outline h-8 !px-2.5 text-[12px]" onClick={askPermission}>
                  {t('settings.enable')}
                </button>
              )}
              <Switch
                checked={settings.notifications}
                onChange={(next) => {
                  if (next && permission !== 'granted') {
                    void askPermission();
                    return;
                  }
                  setSettings({ notifications: next });
                  toast(next ? t('toast.notifyOn') : t('toast.notifyOff'));
                }}
                label={t('settings.notifications')}
              />
            </div>
          </Row>

          <p className="label mt-3">{t('settings.sound')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SOUNDS.map(({ id, custom }) => {
              const active = settings.notificationSound === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSettings({ notificationSound: id });
                    playSound(id);
                  }}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--line)',
                    background: active ? 'var(--wash)' : 'var(--surface)',
                  }}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--surface2)',
                      color: active ? 'var(--accent-ink)' : 'var(--muted)',
                    }}
                  >
                    <Play size={10} fill="currentColor" />
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] font-medium"
                    style={{ color: active ? 'var(--accent)' : 'var(--ink)' }}
                  >
                    {t(`sound.${id}`)}
                  </span>
                  {custom && (
                    <span className="shrink-0 text-[9.5px] italic text-[var(--muted)]">
                      {t('sound.custom')}
                    </span>
                  )}
                  {active && <Check size={13} className="shrink-0" style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">{t('settings.soundHint')}</p>
        </section>

        <section className="border-t border-[var(--line)] pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)]">
            <Monitor size={13} />
            {t('settings.data')}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn btn-outline justify-start h-9" onClick={exportData}>
              <HardDriveDownload size={15} />
              {t('settings.export')}
            </button>
            <label className="btn btn-outline h-9 cursor-pointer justify-start">
              <Upload size={15} />
              {t('settings.import')}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importData(file);
                  event.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-outline justify-start h-9"
              onClick={async () => {
                const outcome = await promptInstall();
                if (outcome === 'unavailable') toast(t('toast.installUnavailable'));
                if (outcome === 'accepted') toast(t('settings.installed'), { tone: 'success' });
              }}
              disabled={installed}
            >
              <Download size={15} />
              {installed ? t('settings.installed') : canInstall ? t('settings.install') : t('settings.install')}
            </button>
            <button
              type="button"
              className="btn btn-danger justify-start h-9"
              onClick={() => {
                if (window.confirm(t('settings.resetConfirm'))) {
                  void resetAll();
                  close();
                }
              }}
            >
              <Trash2 size={15} />
              {t('settings.reset')}
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-[var(--muted)]">
            <RotateCcw size={11} className="mt-0.5 shrink-0" />
            {t('settings.storage')}
            {!canInstall && ` ${t('settings.installHint')}`}
          </p>
        </section>

        <section className="flex items-start gap-2 border-t border-[var(--line)] pt-4">
          <Info size={14} className="mt-0.5 shrink-0 text-[var(--muted)]" />
          <div className="text-[11.5px] leading-relaxed text-[var(--muted)]">
            <p>
              <strong className="font-semibold text-[var(--ink)]">{t('app.name')}</strong> · v0.1 ·{' '}
              {t('settings.version')}
            </p>
            <p>{t('app.tagline')}</p>
          </div>
        </section>
      </div>
    </Modal>
  );
}
