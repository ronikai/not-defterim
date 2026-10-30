import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { useStore } from './store/store';
import { TopBar, Logo } from './ui/TopBar';
import { BottomNav } from './ui/BottomNav';
import { Launcher } from './ui/Launcher';
import { NotesView } from './views/NotesView';
import { CalendarView } from './views/CalendarView';
import { MediaView } from './views/MediaView';
import { NoteEditor } from './ui/NoteEditor';
import { NotePicker } from './ui/NotePicker';
import { SettingsDialog } from './ui/SettingsDialog';
import { EventDialog } from './ui/EventDialog';
import { AiPanel } from './ui/AiPanel';
import { CommandPalette } from './ui/CommandPalette';
import { Onboarding } from './ui/Onboarding';
import { Toasts } from './ui/Toasts';
import { Reminders } from './ui/Reminders';
import { Button } from './ui/Button';

function Views() {
  const { ui } = useStore();
  switch (ui.view) {
    case 'notes':
      return <NotesView />;
    case 'calendar':
      return <CalendarView />;
    case 'sheet':
      return <MediaView type="table" />;
    case 'doc':
      return <MediaView type="doc" />;
    case 'flow':
      return <MediaView type="flow" />;
    case 'code':
      return <MediaView type="code" />;
    default:
      return <Launcher />;
  }
}

export default function App() {
  const { ready, t, ui, setUI, navigate } = useStore();

  useEffect(() => {
    document.title = `${t('app.name')} · ${t('app.subtitle')}`;
  }, [t, ui.view]);

  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.replace('#', '');
    const views = ['home', 'notes', 'calendar', 'sheet', 'doc', 'flow', 'code'];
    if (views.includes(hash)) navigate(hash as typeof ui.view);

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (!action) return;
    if (action === 'note') setUI({ pickerOpen: true });
    if (action === 'calendar') navigate('calendar');
    if (action === 'ai') setUI({ aiOpen: true });
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.hash}`);
  }, [ready, setUI, navigate]);

  const overlayOpen = Boolean(
    ui.noteId || ui.pickerOpen || ui.settingsOpen || ui.aiOpen || ui.paletteOpen || ui.eventDraft,
  );
  const overlayDepth = useRef(0);
  const skipPop = useRef(false);
  const suppressHash = useRef(false);
  const viewRef = useRef(ui.view);
  viewRef.current = ui.view;

  // Panel açılınca tarayıcı geçmişine bir adım ekle: geri tuşu siteyi bırakmasın.
  useEffect(() => {
    if (overlayOpen && overlayDepth.current === 0) {
      overlayDepth.current = 1;
      window.history.pushState({ ...(window.history.state ?? {}), ndOverlay: true }, '', window.location.href);
    } else if (!overlayOpen && overlayDepth.current === 1) {
      overlayDepth.current = 0;
      skipPop.current = true;
      suppressHash.current = true;
      window.setTimeout(() => {
        suppressHash.current = false;
      }, 300);
      window.history.back();
    }
  }, [overlayOpen]);

  useEffect(() => {
    const onPop = () => {
      if (skipPop.current) {
        skipPop.current = false;
        // Adres çubuğu eski görünüme dönmüş olabilir; bulunduğumuz görünümde tut.
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}#${viewRef.current}`,
        );
        return;
      }
      if (overlayDepth.current === 1) {
        overlayDepth.current = 0;
        setUI({
          noteId: null,
          pickerOpen: false,
          settingsOpen: false,
          aiOpen: false,
          paletteOpen: false,
          eventDraft: null,
        });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setUI]);

  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}#${ui.view}`);
  }, [ready, ui.view]);

  useEffect(() => {
    const onHash = () => {
      if (suppressHash.current) return;
      const hash = window.location.hash.replace('#', '');
      const views = ['home', 'notes', 'calendar', 'sheet', 'doc', 'flow', 'code'];
      if (views.includes(hash)) navigate(hash as typeof ui.view);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate, ui.view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setUI({ paletteOpen: !ui.paletteOpen });
        return;
      }
      if (!typing && !overlayOpen && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setUI({ pickerOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setUI, ui.paletteOpen, overlayOpen]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size={44} />
          <p className="text-[12.5px] text-[var(--muted)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackLabel={t('settings.reset')}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-[13px]"
      >
        {t('a11y.skip')}
      </a>
      <TopBar />
      <main id="main">
        <Views />
      </main>
      <BottomNav />

      <NoteEditor />
      <NotePicker />
      <SettingsDialog />
      <EventDialog />
      <AiPanel />
      <CommandPalette />
      <Onboarding />
      <Toasts />
      <Reminders />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode; fallbackLabel: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Not Defterim hatası:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-dvh place-items-center px-4">
          <div className="card max-w-[420px] p-6 text-center">
            <h1 className="text-[18px] font-semibold">Bir şeyler ters gitti</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
              Verilerin tarayıcında güvende. Sayfayı yenilemeyi dene.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => window.location.reload()}>{this.props.fallbackLabel}</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
