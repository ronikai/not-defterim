import type { AssistantTone, Lang } from '../types';

function upperFirst(value: string, lang: Lang): string {
  if (!value) return value;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

/** Kullanıcı "merhaba" dediğinde verilen kısa yanıt. */
export function toneGreeting(tone: AssistantTone, nickname: string, lang: Lang): string {
  const tr = lang === 'tr';
  const nick = nickname.trim();
  const name = nick ? ` ${nick}` : '';

  switch (tone) {
    case 'formal':
      return tr
        ? `Merhaba${name}. Bugün size nasıl yardımcı olabilirim?`
        : `Hello${name}. How can I help you today?`;
    case 'short':
      return tr ? 'Merhaba. Ne yapalım?' : 'Hi. What do you need?';
    case 'long':
      return tr
        ? `Merhaba${name}. Not, takvim, liste, özet veya kod incelemesi... Hangisiyle başlayalım?`
        : `Hi${name}. Notes, calendar, lists, summaries or code review... Where should we start?`;
    case 'slang':
      return tr ? `Selam${name}! Ne lazımsa yaz, hallederiz.` : `Hey${name}! Tell me what you need and we'll sort it out.`;
    case 'polite':
      return tr
        ? `Merhaba${name}. Bugün size nasıl yardımcı olabilirim?`
        : `Hello${name}. How may I help you today?`;
    default:
      return tr
        ? `Merhaba${name}! Bugün ne yapıyoruz? Not ekleyebilir, takvime etkinlik yazabilir, listeni güncelleyebilirim.`
        : `Hi${name}! What are we doing today? I can add notes, put events on your calendar and update lists.`;
  }
}

/** Asistan panelindeki ilk karşılama balonu. */
export function toneWelcome(tone: AssistantTone, nickname: string, lang: Lang): string {
  const tr = lang === 'tr';
  const nick = nickname.trim();
  const name = nick ? ` ${nick}` : '';

  switch (tone) {
    case 'formal':
      return tr
        ? `Merhaba${name}. Size notlar, takvim, tablolar ve kod incelemesi konularında yardımcı olabilirim.`
        : `Hello${name}. I can help you with notes, calendar, sheets and code review.`;
    case 'short':
      return tr ? 'Merhaba. Not, takvim, kod. Ne yapalım?' : 'Hi. Notes, calendar, code. What do you need?';
    case 'long':
      return tr
        ? `Merhaba${name}. Not ekleyebilir, takvime etkinlik yazabilir, listelerini güncelleyebilir, notlarını özetleyebilir ve kodunu inceleyebilirim.\n\nAyrıca uygulamanın kullanımını da anlatırım: “takvime nasıl etkinlik eklerim?” gibi bir soru yeterli.`
        : `Hi${name}. I can add notes, put events on your calendar, update lists, summarize notes and review code.\n\nI can also explain the app: just ask “how do I add a calendar event?”.`;
    case 'slang':
      return tr
        ? `Selam${name}! Not, takvim, kod... ne lazımsa yaz, hallederiz.`
        : `Hey${name}! Notes, calendar, code... tell me what you need and we'll sort it out.`;
    case 'polite':
      return tr
        ? `Merhaba${name}. Dilerseniz not ekleyebilir, takviminizi planlayabilir, notlarınızı özetleyebilir veya kodunuzu inceleyebilirim.`
        : `Hello${name}. If you wish, I can add notes, plan your calendar, summarize your notes or review your code.`;
    default:
      return tr
        ? `Merhaba${name}. Not ekleyebilir, takvime etkinlik yazabilir, listelerini güncelleyebilir, notlarını özetleyebilir ve kodunu inceleyebilirim.`
        : `Hi${name}. I can add notes, put events on your calendar, update lists, summarize notes and review your code.`;
  }
}

/**
 * Motorun ürettiği metni seçilen tarza göre biçimlendirir.
 * İşlem sonuçları eklendikten sonra çağrılmalı; aksi hâlde kapanış cümlesi
 * sonuç satırlarının üstünde kalır.
 */
export function applyTone(
  text: string,
  tone: AssistantTone,
  lang: Lang,
  options: { hasActions: boolean },
): string {
  const tr = lang === 'tr';
  let out = text.trim();
  if (!out) return out;

  if (tone === 'short') {
    const lines = out.split('\n').filter((line) => line.trim().length > 0);
    return lines.slice(0, 5).join('\n');
  }

  // Selamlaşma cümleleri kendi üslubunu taşır; ön ek/kapanış eklenmez.
  if (/^(merhaba|selam|hi|hello|hey|günaydın|gunaydin)\b/i.test(out)) {
    return out;
  }

  if (tone === 'formal' && options.hasActions) {
    out = `${tr ? 'Anlaşıldı.' : 'Understood.'} ${upperFirst(out, lang)}`;
  } else if (tone === 'polite' && options.hasActions) {
    out = `${tr ? 'Elbette.' : 'Of course.'} ${upperFirst(out, lang)}`;
  } else if (tone === 'slang') {
    out = options.hasActions
      ? `${tr ? 'Tamam.' : 'Alright.'} ${upperFirst(out, lang)}`
      : `${tr ? 'Bak şimdi:' : 'Here you go:'} ${out}`;
  } else if (tone === 'polite' && !options.hasActions) {
    out = `${tr ? 'Elbette.' : 'Of course.'} ${upperFirst(out, lang)}`;
  }

  if (tone === 'long') {
    out += tr
      ? '\n\nİstersen bir sonraki adımı birlikte yapalım; nerede takıldığını yazman yeterli.'
      : '\n\nIf you like, we can do the next step together; just tell me where you get stuck.';
  }

  if (!options.hasActions && out.length > 140) {
    if (tone === 'formal') {
      out += tr
        ? '\n\nBaşka bir talebiniz olursa yazabilirsiniz.'
        : '\n\nLet me know if you need anything else.';
    } else if (tone === 'polite') {
      out += tr
        ? '\n\nRica ederim, başka bir isteğiniz olursa buradayım.'
        : '\n\nYou are welcome; I am here if you need anything else.';
    } else if (tone === 'slang') {
      out += tr ? '\n\nTakıldığın yerde çekinme, yaz.' : '\n\nJust shout if you get stuck.';
    }
  }

  return out;
}
