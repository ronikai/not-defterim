import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { produce } from 'immer';
import type { AppState, CalEvent, Lang, Note, NoteType, Settings, ViewId } from '../types';
import { createT, type Translate } from '../i18n';
import { uid } from '../lib/utils';
import { readState, removeState, writeState } from './db';
import { seedState, stripDemoContent } from './seed';
import { defaultTitle, exportBackup, noteDefaults, parseBackup } from './backup';
import { applyTheme } from '../ui/theme';

export type Toast = {
  id: string;
  text: string;
  tone: 'default' | 'success' | 'error';
  undo?: () => void;
  undoLabel?: string;
};

export type UIState = {
  view: ViewId;
  noteId: string | null;
  pickerOpen: boolean;
  settingsOpen: boolean;
  aiOpen: boolean;
  paletteOpen: boolean;
  eventDraft: { id?: string; date: string } | null;
  tourOpen: boolean;
};

type StoreValue = {
  state: AppState;
  ready: boolean;
  t: Translate;
  lang: Lang;
  settings: Settings;
  update: (recipe: (draft: AppState) => void) => void;
  ui: UIState;
  setUI: (patch: Partial<UIState>) => void;
  navigate: (view: ViewId) => void;
  openNote: (id: string | null) => void;
  createNote: (type: NoteType, category?: Note['category'], title?: string, options?: { open?: boolean }) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => string | null;
  addEvent: (partial: Partial<CalEvent> & { date: string; title: string }) => string;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;
  deleteEvent: (id: string) => void;
  startEvent: (date?: string, id?: string) => void;
  logActivity: (text: string, source?: 'ai' | 'user') => void;
  setSettings: (patch: Partial<Settings>) => void;
  toasts: Toast[];
  toast: (text: string, options?: { tone?: Toast['tone']; undo?: () => void; undoLabel?: string; duration?: number }) => void;
  dismissToast: (id: string) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  resetAll: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

function mergeState(loaded: AppState, lang: Lang): AppState {
  const base = seedState();
  return {
    ...base,
    ...loaded,
    settings: { ...base.settings, ...(loaded.settings ?? {}), lang },
    notes: Array.isArray(loaded.notes) ? loaded.notes : [],
    events: Array.isArray(loaded.events) ? loaded.events : [],
    dayNotes: loaded.dayNotes && typeof loaded.dayNotes === 'object' ? loaded.dayNotes : {},
    activity: Array.isArray(loaded.activity) ? loaded.activity : [],
    chat: Array.isArray(loaded.chat) ? loaded.chat : [],
    reminderLog: loaded.reminderLog ?? {},
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});
  const [ui, setUIState] = useState<UIState>({
    view: 'home',
    noteId: null,
    pickerOpen: false,
    settingsOpen: false,
    aiOpen: false,
    paletteOpen: false,
    eventDraft: null,
    tourOpen: false,
  });

  useEffect(() => {
    let alive = true;
    void readState().then((loaded) => {
      if (!alive) return;
      if (loaded) {
        const lang = (loaded.settings?.lang ?? 'tr') as Lang;
        setState(stripDemoContent(mergeState(loaded, lang)));
      } else {
        const fresh = seedState();
        setState(fresh);
        void writeState(fresh);
        setUIState((prev) => ({ ...prev, tourOpen: true }));
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Kalıcılık: değişikliklerden kısa süre sonra yaz
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void writeState(state);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      void writeState(state);
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [state, ready]);

  const t = useMemo(() => createT(state.settings.lang), [state.settings.lang]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    applyTheme(state.settings, media.matches);
  }, [state.settings]);

  const update = useCallback((recipe: (draft: AppState) => void) => {
    setState((current) => produce(current, recipe));
  }, []);

  const setUI = useCallback((patch: Partial<UIState>) => {
    setUIState((prev) => ({ ...prev, ...patch }));
  }, []);

  const navigate = useCallback(
    (view: ViewId) => {
      setUIState((prev) => ({ ...prev, view, noteId: null }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback<StoreValue['toast']>((text, options = {}) => {
    const id = uid('toast');
    const item: Toast = {
      id,
      text,
      tone: options.tone ?? 'default',
      undo: options.undo,
      undoLabel: options.undoLabel,
    };
    setToasts((prev) => [...prev.slice(-2), item]);
    timers.current[id] = window.setTimeout(
      () => {
        setToasts((prev) => prev.filter((entry) => entry.id !== id));
        delete timers.current[id];
      },
      options.undo ? 6000 : options.duration ?? 3000,
    );
  }, []);

  const logActivity = useCallback<StoreValue['logActivity']>(
    (text, source = 'user') => {
      update((draft) => {
        draft.activity.unshift({ id: uid('act'), at: Date.now(), source, text });
        draft.activity = draft.activity.slice(0, 40);
      });
    },
    [update],
  );

  const openNote = useCallback((id: string | null) => {
    setUIState((prev) => ({ ...prev, noteId: id }));
  }, []);

  const createNote = useCallback<StoreValue['createNote']>(
    (type, category = 'kisisel', title, options) => {
      const id = uid('note');
      const now = Date.now();
      update((draft) => {
        draft.notes.unshift({
          id,
          type,
          title: title ?? defaultTitle(type, draft.settings.lang),
          category,
          tags: [],
          pinned: false,
          archived: false,
          createdAt: now,
          updatedAt: now,
          ...noteDefaults(type, draft.settings.lang),
        });
      });
      setUIState((prev) => ({
        ...prev,
        noteId: options?.open === false ? prev.noteId : id,
        pickerOpen: false,
      }));
      return id;
    },
    [update],
  );

  const updateNote = useCallback<StoreValue['updateNote']>(
    (id, patch) => {
      update((draft) => {
        const found = draft.notes.find((item) => item.id === id);
        if (!found) return;
        Object.assign(found, patch, { updatedAt: Date.now() });
      });
    },
    [update],
  );

  const deleteNote = useCallback<StoreValue['deleteNote']>(
    (id) => {
      let removed: Note | undefined;
      update((draft) => {
        removed = draft.notes.find((item) => item.id === id);
        draft.notes = draft.notes.filter((item) => item.id !== id);
      });
      setUIState((prev) => ({ ...prev, noteId: prev.noteId === id ? null : prev.noteId }));
      if (removed) {
        const snapshot = removed;
        toast(t('notes.deleted'), {
          undoLabel: t('notes.undo'),
          undo: () => {
            update((draft) => {
              draft.notes.unshift(snapshot);
            });
          },
        });
      }
    },
    [t, toast, update],
  );

  const duplicateNote = useCallback<StoreValue['duplicateNote']>(
    (id) => {
      let newId: string | null = null;
      update((draft) => {
        const source = draft.notes.find((item) => item.id === id);
        if (!source) return;
        newId = uid('note');
        const copy: Note = {
          ...structuredClone(source),
          id: newId,
          title: `${source.title} (${draft.settings.lang === 'tr' ? 'kopya' : 'copy'})`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        draft.notes.unshift(copy);
      });
      if (newId) toast(t('common.done'), { tone: 'success' });
      return newId;
    },
    [t, toast, update],
  );

  const addEvent = useCallback<StoreValue['addEvent']>(
    (partial) => {
      const id = uid('event');
      const event: CalEvent = {
        id,
        title: partial.title,
        date: partial.date,
        time: partial.time ?? '',
        kind: partial.kind ?? 'event',
        category: partial.category ?? 'kisisel',
        note: partial.note ?? '',
        remind: partial.remind ?? true,
        notifiedAt: null,
      };
      update((draft) => {
        draft.events.push(event);
      });
      return id;
    },
    [update],
  );

  const updateEvent = useCallback<StoreValue['updateEvent']>(
    (id, patch) => {
      update((draft) => {
        const found = draft.events.find((item) => item.id === id);
        if (found) Object.assign(found, patch);
      });
    },
    [update],
  );

  const deleteEvent = useCallback<StoreValue['deleteEvent']>(
    (id) => {
      update((draft) => {
        draft.events = draft.events.filter((item) => item.id !== id);
      });
    },
    [update],
  );

  const startEvent = useCallback<StoreValue['startEvent']>((date, id) => {
    setUIState((prev) => ({ ...prev, eventDraft: { date: date ?? new Date().toISOString().slice(0, 10), id } }));
  }, []);

  const setSettings = useCallback<StoreValue['setSettings']>(
    (patch) => {
      update((draft) => {
        Object.assign(draft.settings, patch);
      });
    },
    [update],
  );

  const exportData = useCallback(() => {
    exportBackup(state);
    toast(t('toast.exported'), { tone: 'success' });
  }, [state, t, toast]);

  const importData = useCallback<StoreValue['importData']>(
    async (file) => {
      try {
        const text = await file.text();
        const next = parseBackup(text);
        setState(mergeState(next, next.settings?.lang ?? 'tr'));
        toast(t('toast.imported'), { tone: 'success' });
      } catch {
        toast(t('toast.importError'), { tone: 'error' });
      }
    },
    [t, toast],
  );

  const resetAll = useCallback(async () => {
    await removeState();
    const fresh = seedState();
    fresh.onboarded = true;
    fresh.settings = state.settings;
    setState(fresh);
    toast(t('toast.reset'), { tone: 'success' });
  }, [state.settings, t, toast]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      ready,
      t,
      lang: state.settings.lang,
      settings: state.settings,
      update,
      ui,
      setUI,
      navigate,
      openNote,
      createNote,
      updateNote,
      deleteNote,
      duplicateNote,
      addEvent,
      updateEvent,
      deleteEvent,
      startEvent,
      logActivity,
      setSettings,
      toasts,
      toast,
      dismissToast,
      exportData,
      importData,
      resetAll,
    }),
    [
      state,
      ready,
      t,
      update,
      ui,
      setUI,
      navigate,
      openNote,
      createNote,
      updateNote,
      deleteNote,
      duplicateNote,
      addEvent,
      updateEvent,
      deleteEvent,
      startEvent,
      logActivity,
      setSettings,
      toasts,
      toast,
      dismissToast,
      exportData,
      importData,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
