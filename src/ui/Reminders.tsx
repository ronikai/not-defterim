import { useEffect } from 'react';
import { useStore } from '../store/store';
import { formatDate } from '../lib/utils';
import { playSound } from './sounds';

export function Reminders() {
  const { state, settings, t, lang, update, toast } = useStore();

  useEffect(() => {
    if (!settings.notifications) return;

    const tick = () => {
      const now = Date.now();
      const due = state.events.filter((event) => {
        if (!event.remind) return false;
        const stamp = new Date(`${event.date}T${event.time || '09:00'}:00`).getTime();
        if (Number.isNaN(stamp)) return false;
        const diff = stamp - now;
        if (diff <= 0 || diff > 24 * 3600 * 1000) return false;
        if (event.notifiedAt && now - event.notifiedAt < 12 * 3600 * 1000) return false;
        return true;
      });

      if (due.length) {
        playSound(settings.notificationSound ?? 'chime');
      }

      for (const event of due) {
        const when =
          event.date === new Date().toISOString().slice(0, 10)
            ? t('common.today')
            : formatDate(event.date, lang, { day: 'numeric', month: 'long' });
        const body = t('reminder.body', { title: event.title, when: event.time ? `${when} ${event.time}` : when });

        update((draft) => {
          const found = draft.events.find((item) => item.id === event.id);
          if (found) found.notifiedAt = now;
        });

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              void navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                  void registration.showNotification(t('reminder.title'), {
                    body,
                    tag: event.id,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    silent: true,
                  });
                } else {
                  new Notification(t('reminder.title'), { body, icon: '/icon-192.png', silent: true });
                }
              });
            } else {
              new Notification(t('reminder.title'), { body, icon: '/icon-192.png', silent: true });
            }
          } catch {
            toast(body);
          }
        } else {
          toast(body);
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [state.events, settings.notifications, settings.notificationSound, t, lang, update, toast]);

  return null;
}
