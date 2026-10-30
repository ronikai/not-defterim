import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Trash2, X } from 'lucide-react';
import { useStore } from '../store/store';
import { respond, type AiAction } from '../ai/engine';
import { applyTone, toneWelcome } from '../ai/persona';
import { formatDate, uid } from '../lib/utils';
import type { ChatMessage, FlowNode } from '../types';

export function AiPanel() {
  const {
    ui,
    setUI,
    state,
    t,
    lang,
    update,
    createNote,
    updateNote,
    addEvent,
    logActivity,
    toast,
    setSettings,
    navigate,
  } = useStore();
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ui.aiOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [ui.aiOpen]);

  useEffect(() => {
    if (!ui.aiOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUI({ aiOpen: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ui.aiOpen, setUI]);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [state.chat.length, thinking, ui.aiOpen]);

  if (!ui.aiOpen) return null;

  const execute = (action: AiAction): string => {
    switch (action.kind) {
      case 'createNote': {
        createNote(action.noteType, action.category, action.title, { open: false });
        logActivity(`${t('ai.actionNote')}: ${action.title}`, 'ai');
        return `• ${t('ai.actionNote')}: ${action.title}`;
      }
      case 'createEvent': {
        addEvent({
          title: action.title,
          date: action.date,
          time: action.time,
          kind: action.special ? 'special' : 'event',
          category: action.category,
          remind: true,
        });
        logActivity(`${t('ai.actionEvent')}: ${action.title}`, 'ai');
        return `• ${t('ai.actionEvent')}: ${action.title} · ${formatDate(action.date, lang, {
          day: 'numeric',
          month: 'long',
        })}${action.time ? ` ${action.time}` : ''}`;
      }
      case 'addItem': {
        if (action.noteId) {
          const target = state.notes.find((note) => note.id === action.noteId);
          if (target) {
            const items = target.items ?? [];
            updateNote(target.id, {
              items: [...items, { id: uid('item'), text: action.item, done: false }],
            });
            logActivity(`${t('ai.actionItem')}: ${action.item}`, 'ai');
            return `• ${t('ai.actionItem')}: ${action.item} → ${target.title}`;
          }
        }
        const id = createNote('checklist', action.category, action.noteTitle, { open: false });
        updateNote(id, { items: [{ id: uid('item'), text: action.item, done: false }] });
        logActivity(`${t('ai.actionItem')}: ${action.item}`, 'ai');
        return `• ${t('ai.actionItem')}: ${action.item} → ${action.noteTitle}`;
      }
      case 'createFlow': {
        const id = createNote('flow', 'fikir', action.title, { open: false });
        const chain: FlowNode[] = [];
        const push = (kind: FlowNode['kind'], text: string) => {
          const prev = chain[chain.length - 1];
          let x = prev ? prev.x + 234 : 80;
          let y = prev ? prev.y : 140;
          if (x + 162 > 900) {
            x = 80;
            y = (prev?.y ?? 140) + 136;
          }
          chain.push({ id: uid('n'), x, y, kind, text });
        };
        push('start', lang === 'tr' ? 'Başla' : 'Start');
        for (const step of action.steps) {
          const kind: FlowNode['kind'] = /^(bitir|bitiş|bitis|son|end|finish)\b/i.test(step)
            ? 'end'
            : /^(karar|decision)\b/i.test(step)
              ? 'decision'
              : 'process';
          push(kind, step);
        }
        const edges = chain.slice(1).map((node, index) => ({ from: chain[index].id, to: node.id }));
        updateNote(id, { flow: { nodes: chain, edges } });
        navigate('flow');
        setUI({ aiOpen: false });
        logActivity(`${t('ai.actionFlow')}: ${action.title}`, 'ai');
        return `• ${t('ai.actionFlow')}: ${action.title}`;
      }
      case 'setNickname': {
        setSettings({ nickname: action.nickname });
        logActivity(
          action.nickname ? `${t('ai.actionNickname')}: ${action.nickname}` : t('ai.actionNickname'),
          'ai',
        );
        return `• ${t('ai.actionNickname')}: ${action.nickname || t('common.none')}`;
      }
      default: {
        return '';
      }
    }
  };

  const send = (value: string) => {
    const text = value.trim();
    if (!text || thinking) return;

    const userMessage: ChatMessage = { id: uid('msg'), role: 'user', text, at: Date.now() };
    update((draftState) => {
      draftState.chat.push(userMessage);
      if (draftState.chat.length > 80) draftState.chat = draftState.chat.slice(-80);
    });
    setDraft('');
    setThinking(true);

    const reply = respond(text, state, t, lang, ui.noteId);
    const results = reply.actions.map(execute);
    const rawText = results.length ? `${reply.text}\n\n${results.join('\n')}` : reply.text;
    const finalText = applyTone(rawText, state.settings.tone ?? 'friendly', lang, {
      hasActions: results.length > 0,
    });

    if (results.length) toast(t('toast.saved'), { tone: 'success' });

    window.setTimeout(() => {
      const aiMessage: ChatMessage = { id: uid('msg'), role: 'ai', text: finalText, at: Date.now() };
      update((draftState) => {
        draftState.chat.push(aiMessage);
      });
      setThinking(false);
    }, 420);
  };

  const suggestions = [
    t('ai.suggest1'),
    t('ai.suggest2'),
    t('ai.suggest3'),
    t('ai.suggest4'),
    t('ai.suggest5'),
    ...(state.settings.nickname.trim() ? [] : [t('ai.suggestNick')]),
  ];

  return (
    <>
      <div
        className="no-print fixed inset-0 z-[64] bg-[color-mix(in_srgb,var(--ink)_22%,transparent)] md:bg-transparent"
        onClick={() => setUI({ aiOpen: false })}
        aria-hidden
      />
      <aside className="side-panel no-print" role="dialog" aria-modal="true" aria-label={t('ai.title')}>
        <header className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-[10px]"
            style={{ background: 'var(--wash)', color: 'var(--accent)' }}
          >
            <Sparkles size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14.5px] font-semibold leading-tight">{t('ai.title')}</h2>
            <p className="truncate text-[11px] text-[var(--muted)]">{t('ai.offline')}</p>
          </div>
          <button
            type="button"
            className="icon-btn h-8 w-8"
            aria-label={t('ai.clear')}
            title={t('ai.clear')}
            onClick={() => update((draftState) => { draftState.chat = []; })}
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            className="icon-btn h-8 w-8"
            aria-label={t('common.close')}
            onClick={() => setUI({ aiOpen: false })}
          >
            <X size={17} />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {state.chat.length === 0 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Avatar />
                <div className="max-w-[300px] rounded-2xl rounded-tl-md bg-[var(--surface2)] px-3 py-2.5 text-[13px] leading-relaxed">
                  {toneWelcome(state.settings.tone ?? 'friendly', state.settings.nickname, lang)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-8">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="chip text-left transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.chat.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-2xl rounded-tr-md px-3 py-2 text-[13px] leading-relaxed"
                  style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-2">
                <Avatar />
                <div className="max-w-[86%] whitespace-pre-line rounded-2xl rounded-tl-md bg-[var(--surface2)] px-3 py-2.5 text-[13px] leading-relaxed">
                  {message.text}
                </div>
              </div>
            ),
          )}

          {thinking && (
            <div className="flex gap-2" aria-live="polite">
              <Avatar />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-[var(--surface2)] px-3 py-3">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)]"
                    style={{ animationDelay: `${index * 140}ms` }}
                  />
                ))}
                <span className="ml-1 text-[11px] text-[var(--muted)]">{t('ai.thinking')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--line)] px-3 py-2.5">
          <div className="flex items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1.5 focus-within:border-[color-mix(in_srgb,var(--accent)_50%,var(--line))]">
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              onChange={(event) => {
                setDraft(event.target.value);
                const el = event.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                  if (inputRef.current) inputRef.current.style.height = 'auto';
                }
              }}
              placeholder={t('ai.placeholder')}
              aria-label={t('ai.placeholder')}
              autoComplete="off"
              name="assistant-message"
              className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] outline-none placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                send(draft);
                if (inputRef.current) inputRef.current.style.height = 'auto';
              }}
              disabled={!draft.trim() || thinking}
              aria-label={t('ai.send')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              <ArrowUp size={16} strokeWidth={2.4} />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10.5px] text-[var(--muted)]">{t('ai.subtitle')}</p>
        </div>
      </aside>
    </>
  );
}

function Avatar() {
  return (
    <span
      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md"
      style={{ background: 'var(--wash)', color: 'var(--accent)' }}
      aria-hidden
    >
      <Sparkles size={13} />
    </span>
  );
}
