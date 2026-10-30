import type { AppState, CategoryId, NoteType } from '../types';
import type { Lang } from '../types';
import type { Translate } from '../i18n';
import { addDays, formatDate, matches, normalize, toISODate, todayISO } from '../lib/utils';
import { reviewCode, summarizeFindings } from './review';
import { findArticle } from './knowledge';
import { toneGreeting } from './persona';

export type AiAction =
  | { kind: 'createNote'; noteType: NoteType; title: string; category: CategoryId; body?: string }
  | { kind: 'addItem'; item: string; category: CategoryId; noteId?: string; noteTitle: string }
  | { kind: 'createEvent'; title: string; date: string; time: string; special: boolean; category: CategoryId }
  | { kind: 'createFlow'; title: string; steps: string[] }
  | { kind: 'setNickname'; nickname: string };

export type AiReply = { text: string; actions: AiAction[] };

const MONTHS: Record<string, number> = {
  ocak: 0,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  agustos: 7,
  eylul: 8,
  ekim: 9,
  kasim: 10,
  aralik: 11,
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const WEEKDAYS: Record<string, number> = {
  pazar: 0,
  pazartesi: 1,
  sali: 2,
  carsamba: 3,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const CATEGORY_WORDS: Record<CategoryId, string[]> = {
  alisveris: ['alisveris', 'market', 'shopping', 'grocery', 'groceries', 'manav'],
  odev: ['odev', 'homework', 'ders', 'okul', 'school', 'sinav', 'exam', 'universite'],
  is: ['work', 'ofis', 'office', 'toplanti', 'meeting', 'sunum', 'presentation', 'musteri', 'client'],
  kod: ['kod', 'code', 'yazilim', 'software', 'bug', 'script', 'program', 'fonksiyon'],
  fikir: ['fikir', 'idea', 'brainstorm', 'ilham'],
  kisisel: ['kisisel', 'personal', 'saglik', 'health', 'spor', 'gym', 'aile', 'family'],
};

/** Türkçe harfleri de kelime sınırı sayan yardımcı. */
function W(pattern: string, flags = 'gi'): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, `${flags}u`);
}

function detectCategory(input: string): CategoryId | null {
  const raw = input.toLocaleLowerCase('tr-TR');
  const text = normalize(input);
  if (W('iş', 'i').test(raw)) return 'is';
  for (const [category, words] of Object.entries(CATEGORY_WORDS) as [CategoryId, string[]][]) {
    if (words.some((word) => W(word, 'i').test(text))) return category;
  }
  return null;
}

function detectDate(input: string): string | null {
  const raw = input.trim();
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const text = normalize(input);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (/\bbugun\b|\btoday\b|\bbu aksam\b|\btonight\b/.test(text)) return toISODate(today);
  if (/\byarin\b|\btomorrow\b/.test(text)) return toISODate(addDays(today, 1));
  if (/\bobur gun\b|\bday after tomorrow\b/.test(text)) return toISODate(addDays(today, 2));

  const dayWord = Object.keys(WEEKDAYS).find((day) => new RegExp(`\\b${day}\\b`).test(text));
  if (dayWord) {
    const target = WEEKDAYS[dayWord];
    let delta = (target - today.getDay() + 7) % 7;
    if (delta === 0) delta = 7;
    return toISODate(addDays(today, delta));
  }

  const monthWord = Object.keys(MONTHS).find((month) => new RegExp(`\\b${month}\\b`).test(text));
  if (monthWord) {
    const numbers = text.match(/\b\d{1,2}\b/g)?.map(Number) ?? [];
    const day = numbers.find((value) => value >= 1 && value <= 31) ?? 1;
    const month = MONTHS[monthWord];
    let year = today.getFullYear();
    const candidate = new Date(year, month, day);
    if (candidate < today) year += 1;
    return toISODate(new Date(year, month, day));
  }

  const dotted = /\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/.exec(raw);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]) - 1;
    let year = dotted[3] ? Number(dotted[3]) : today.getFullYear();
    if (year < 100) year += 2000;
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return toISODate(new Date(year, month, day));
    }
  }

  return null;
}

function detectTime(input: string): string {
  const raw = input.toLocaleLowerCase('tr-TR');
  const clock = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.exec(raw);
  if (clock) return `${clock[1].padStart(2, '0')}:${clock[2]}`;

  const suffixed = /\b([01]?\d|2[0-3])['’]?(da|de|ta|te)\b/.exec(raw);
  if (suffixed) return `${suffixed[1].padStart(2, '0')}:00`;

  const saat = /\b(?:saat|at|around)\s*([01]?\d|2[0-3])\b/.exec(raw);
  if (saat) return `${saat[1].padStart(2, '0')}:00`;

  if (/\bogle\b|\bnoon\b/.test(raw)) return '12:00';
  return '';
}

function stripTemporal(input: string): string {
  let out = input;
  out = out.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ');
  out = out.replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g, ' ');
  out = out.replace(/\b([01]?\d|2[0-3])['’]?(da|de|ta|te)\b/gi, ' ');
  out = out.replace(
    W('bugün|bugun|yarın|yarin|öbür gün|obur gun|bu akşam|bu aksam|today|tomorrow|tonight|day after tomorrow'),
    ' ',
  );
  out = out.replace(
    W('pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar|monday|tuesday|wednesday|thursday|friday|saturday|sunday'),
    ' ',
  );
  out = out.replace(
    W('ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik|january|february|march|april|may|june|july|august|september|october|november|december'),
    ' ',
  );
  out = out.replace(W('saat|at|around'), ' ');
  return out;
}

function stripVerbs(input: string): string {
  return input
    .replace(
      W('ekle|ekleyin|ekler misin|ekleyebilir misin|add|create|schedule|planla|kaydet|save|oluştur|olustur|lütfen|lutfen|please|kategorisine|kategoriye|kategoride|kategori|categories?|category|takvime|takvim|calendar|etkinlik|event|randevu|appointment|notu|not|notes?|için|icin|bir|the|my|to'),
      ' ',
    )
    .replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function bestChecklist(state: AppState, category: CategoryId) {
  const lists = state.notes.filter((note) => note.type === 'checklist' && !note.archived);
  return lists.find((note) => note.category === category);
}

function formatEventLine(title: string, date: string, time: string, language: Lang): string {
  const when = formatDate(date, language, { day: 'numeric', month: 'long' });
  return time ? `${title} · ${when} ${time}` : `${title} · ${when}`;
}

export function respond(
  input: string,
  state: AppState,
  t: Translate,
  language: Lang,
  contextNoteId?: string | null,
): AiReply {
  const tr = language === 'tr';
  const raw = input.trim();
  const text = normalize(raw);
  const today = todayISO();
  const nick = state.settings.nickname?.trim() ?? '';
  const lead = (sentence: string) => (nick ? `${nick}, ${sentence}` : sentence);

  if (!raw) {
    return { text: tr ? 'Bir şey yaz, hemen bakalım.' : 'Write something and I will take a look.', actions: [] };
  }

  if (/^(merhaba|selam|hey|hi|hello|günaydın|gunaydin|iyi akşamlar)\b/.test(text) && raw.length < 24) {
    return {
      text: toneGreeting(state.settings.tone ?? 'friendly', nick, language),
      actions: [],
    };
  }

  if (/(ne yapabilirsin|neler yapabilirsin|yardım|yardim|help|what can you do)/.test(text)) {
    return {
      text: tr
        ? [
            'Şunları yapabilirim:',
            '• Not ekle: “sunum notu ekle”',
            '• Listeye madde ekle: “alışveriş listeme süt ekle”',
            '• Takvime etkinlik koy: “yarın 14:00 dişçi randevusu ekle”',
            '• Notlarını özetle: “notlarımı özetle”',
            '• Notlarında ara: “bütçe ile ilgili notları ara”',
            '• Kodu incele: “bu kodu incele”',
            '• Akış şeması: “şema oluştur: başla, kontrol et, bitir”',
            '• Uygulamayı anlat: “takvime nasıl etkinlik eklerim?”',
            '',
            'Hepsi cihazında çalışır, internet gerekmez.',
          ].join('\n')
        : [
            'Here is what I can do:',
            '• Add a note: “add a presentation note”',
            '• Add a list item: “add milk to my shopping list”',
            '• Put an event on the calendar: “add a dentist appointment tomorrow at 14:00”',
            '• Summarize your notes: “summarize my notes”',
            '• Search your notes: “find notes about budget”',
            '• Review code: “review this code”',
            '• Flow chart: “create a flow: start, check, finish”',
            '• Explain the app: “how do I add a calendar event?”',
            '',
            'Everything runs on your device, no internet needed.',
          ].join('\n'),
      actions: [],
    };
  }

  if (/(bana nasıl hitap|bana nasil hitap|hangi isimle|what do you call me)/.test(text)) {
    return {
      text: nick
        ? tr
          ? `Sana “${nick}” diyorum. Değiştirmek için “bana ... diye hitap et” yazabilirsin.`
          : `I call you “${nick}”. Say “call me ...” to change it.`
        : tr
          ? 'Henüz bir hitap seçmedin. “Bana gardaş diye hitap et” yazabilirsin.'
          : 'No nickname yet. Try “call me buddy”.',
      actions: [],
    };
  }

  const nickPatterns = [
    /bana\s+(.{1,24}?)\s+diye\s+hitap\s+et/i,
    /bana\s+(.{1,24}?)\s+diye\s+seslen/i,
    /beni\s+(.{1,24}?)\s+diye\s+çağır/i,
    /benim\s+adım\s+(.{1,24})/i,
    /call me\s+(.{1,24})/i,
    /my name is\s+(.{1,24})/i,
  ];
  for (const pattern of nickPatterns) {
    const match = pattern.exec(raw);
    if (!match) continue;
    const nickname = match[1].replace(/[.,!?;:"“”']/g, '').trim();
    if (!nickname || /^(ne|nedir|kim|kimim|what|who)$/i.test(nickname)) continue;
    return {
      text: tr
        ? `Tamam ${nickname}, artık sana böyle hitap edeceğim. Bu tarayıcıda hatırlıyorum.`
        : `Got it, ${nickname}. I'll call you that from now on and remember it in this browser.`,
      actions: [{ kind: 'setNickname', nickname }],
    };
  }

  if (/(hitab[ıi]|hitabi)\s+(kaldır|kaldir|sıfırla|sifirla|temizle)|normal hitap|call me by my name/.test(text)) {
    return {
      text: tr ? 'Tamam, artık bir hitap kullanmayacağım.' : "Okay, I won't use a nickname.",
      actions: [{ kind: 'setNickname', nickname: '' }],
    };
  }

  if (/(ne konuştuk|neler konuştuk|ne konustuk|neler konustuk|hatırlıyor musun|hatirliyor musun|geçmişi|gecmisi|what did we talk|do you remember)/.test(text)) {
    const recent = state.chat.filter((message) => message.role === 'user').slice(-5);
    if (!recent.length) {
      return {
        text: tr ? 'Henüz konuşmadık; ilk mesajını bekliyorum.' : "We haven't talked yet; waiting for your first message.",
        actions: [],
      };
    }
    return {
      text: [
        tr ? 'Son konuştuklarımız:' : 'Here is what we talked about:',
        '',
        ...recent.map((message) => `• ${message.text}`),
        '',
        tr
          ? 'Sohbet bu tarayıcıda saklandığı için yeniden açtığında da hatırlıyorum.'
          : 'The chat is stored in this browser, so I remember it when you come back.',
      ].join('\n'),
      actions: [],
    };
  }

  const asksQuestion =
    /\?\s*$/.test(raw) ||
    /(nasıl|nasil|nerede|nedir|ne işe|ne ise|ne demek|hangi|how (do|can|does|to)|where (is|are|do)|what is|what does)/.test(
      text,
    );

  if (asksQuestion) {
    const article = findArticle(raw, language);
    if (article) {
      return { text: `${article.title}\n\n${article.body}`, actions: [] };
    }
  }

  if (/(özetle|ozetle|özet|ozet|summar|neler var|ne var|what.*(pending|today|do i have))/.test(text)) {
    const active = state.notes.filter((note) => !note.archived);
    const pinned = active.filter((note) => note.pinned).length;
    const todays = state.events.filter((event) => event.date === today);
    const upcoming = state.events
      .filter((event) => event.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 3);

    const lines: string[] = [];
    lines.push(
      lead(
        tr
          ? `${active.length} notun var${pinned ? `, ${pinned} tanesi sabitli` : ''}. Bugün ${todays.length} etkinlik görünüyor.`
          : `You have ${active.length} notes${pinned ? `, ${pinned} pinned` : ''}. ${todays.length} events today.`,
      ),
    );

    if (upcoming.length) {
      lines.push('');
      lines.push(tr ? 'Yaklaşan:' : 'Upcoming:');
      for (const event of upcoming) {
        lines.push(`• ${formatEventLine(event.title, event.date, event.time, language)}`);
      }
    }

    if (!active.length) lines.push(tr ? t('ai.noNotes') : t('ai.noNotes'));

    return { text: lines.join('\n'), actions: [] };
  }

  if (/(kod|code|hata|bug|incele|review|analiz|analyze)/.test(text) && !detectDate(raw)) {
    const target =
      state.notes.find((note) => note.id === contextNoteId && note.type === 'code') ??
      state.notes
        .filter((note) => note.type === 'code' && !note.archived)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (!target?.code?.source) {
      return {
        text: tr
          ? 'İnceleyeceğim bir kod notu bulamadım. “Kod” uygulamasından yeni bir kod notu aç, sonra “bu kodu incele” yaz.'
          : 'I could not find a code note to review. Open a new code note in the Code app, then say “review this code”.',
        actions: [],
      };
    }

    const findings = reviewCode(target.code.source, target.code.lang, language);
    const lines = [summarizeFindings(findings, language)];
    if (findings.length) {
      lines.push('');
      for (const finding of findings.slice(0, 6)) {
        const prefix =
          finding.severity === 'error' ? '⛔' : finding.severity === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${prefix}${finding.line ? ` ${finding.line}. satır:` : ''} ${finding.message}`);
      }
    }
    return { text: `${target.title}\n\n${lines.join('\n')}`, actions: [] };
  }

  if (/(ara|bul|find|search|göster|goster)/.test(text)) {
    const query = stripVerbs(stripTemporal(raw.replace(/\b(ara|bul|find|search|göster|goster|notlarımda|notlarimda|in my notes)\b/gi, ' ')));
    if (!query) {
      return {
        text: tr ? 'Neyi arayayım? Örnek: “bütçe notlarını ara”.' : 'What should I look for? Example: “find budget notes”.',
        actions: [],
      };
    }
    const found = state.notes
      .filter(
        (note) =>
          !note.archived &&
          matches(
            `${note.title} ${note.body ?? ''} ${note.code?.source ?? ''} ${note.items?.map((item) => item.text).join(' ') ?? ''}`,
            query,
          ),
      )
      .slice(0, 6);

    if (!found.length) {
      return { text: tr ? `“${query}” için bir şey bulamadım.` : `I found nothing for “${query}”.`, actions: [] };
    }

    return {
      text: [
        t('ai.found', { count: found.length }),
        '',
        ...found.map((note) => `• ${note.title} · ${t(`cat.${note.category}`)}`),
      ].join('\n'),
      actions: [],
    };
  }

  const wantsList = /(liste|list)/.test(text) && /(ekle|add|koy|put)/.test(text);
  if (wantsList) {
    const category = detectCategory(raw) ?? 'alisveris';
    const item = stripVerbs(
      stripTemporal(
        raw
          .replace(W('liste\\w*|list\\w*|alışveriş|alisveris|market|shopping|grocery|groceries'), ' ')
          .replace(W('ekle|add|koy|put|to|my|the'), ' '),
      ),
    );
    if (!item) {
      return {
        text: tr ? 'Listeye ne ekleyeyim? Örnek: “alışveriş listeme süt ekle”.' : 'What should I add? Example: “add milk to my shopping list”.',
        actions: [],
      };
    }
    const target = bestChecklist(state, category);
    return {
      text: lead(tr ? `“${item}” maddesini listeye ekliyorum.` : `Adding “${item}” to the list.`),
      actions: [
        {
          kind: 'addItem',
          item,
          category,
          noteId: target?.id,
          noteTitle: target?.title ?? (tr ? `${t(`cat.${category}`)} listesi` : `${t(`cat.${category}`)} list`),
        },
      ],
    };
  }

  const wantsFlow =
    /(şema|sema|akış|akis|diyagram|flowchart|flow chart|diagram)/.test(text) &&
    /(oluştur|olustur|çiz|ciz|hazırla|hazirla|create|make|draw|kur)/.test(text);

  if (wantsFlow) {
    const tail = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : '';
    const steps = tail
      ? tail
          .split(/,|->|→|;|\bsonra\b/i)
          .map((step) => step.replace(/^[\s.-]+|[\s.]+$/g, '').trim())
          .filter((step) => Boolean(step) && !/^(başla|basla|start)$/i.test(step))
          .slice(0, 6)
      : [];

    return {
      text: tr
        ? 'Akış şemasını oluşturuyorum; “Başla” düğümüyle başlıyor. Akış ekranında eklediğin her şekil zincirin sonuna bağlanır.'
        : 'Creating the flow chart, starting with “Start”. Every shape you add in the Flow app connects to the end of the chain.',
      actions: [{ kind: 'createFlow', title: tr ? 'Yeni akış' : 'New flow', steps }],
    };
  }

  const wantsNote = /(not|note)/.test(text) && /(ekle|add|oluştur|olustur|kaydet|save|new|yeni|al\b)/.test(text);  if (wantsNote) {
    const category = detectCategory(raw) ?? 'kisisel';
    const title = stripVerbs(
      stripTemporal(
        raw
          .replace(/\b(notlarım|notlarim|notuma|nota|notu|not|notes?|yeni|new)\b/gi, ' '),
      ),
    )
      .replace(
        W('alışveriş|alisveris|ödev|odev|iş|kişisel|kisisel|fikir|shopping|homework|work|personal|idea'),
        ' ',
      )
      .replace(/\s+/g, ' ')
      .trim();
    if (!title) {
      return { text: t('ai.needTitle'), actions: [] };
    }
    return {
      text: lead(tr ? `“${title}” notunu oluşturuyorum.` : `Creating the note “${title}”.`),
      actions: [{ kind: 'createNote', noteType: 'text', title, category }],
    };
  }

  const eventish = /(toplantı|toplanti|meeting|randevu|appointment|etkinlik|event|hatırlat|hatirlat|remind|doğum günü|dogum gunu|birthday|ders|class|program|schedule)/.test(
    text,
  );
  const date = detectDate(raw);
  const time = detectTime(raw);

  if (date || (eventish && /(ekle|add|planla|schedule|koy|put)/.test(text))) {
    const category = detectCategory(raw) ?? 'kisisel';
    const title = stripVerbs(stripTemporal(raw)) || (tr ? 'Etkinlik' : 'Event');
    const special = /(doğum günü|dogum gunu|birthday|özel gün|ozel gun|anniversary|yıl dönümü)/.test(text);
    return {
      text: lead(tr ? 'Takvime ekliyorum.' : 'Adding it to your calendar.'),
      actions: [
        {
          kind: 'createEvent',
          title,
          date: date ?? today,
          time,
          special,
          category,
        },
      ],
    };
  }

  return {
    text: [
      t('ai.unknown'),
      '',
      `• ${t('ai.suggest1')}`,
      `• ${t('ai.suggest2')}`,
      `• ${t('ai.suggest3')}`,
      `• ${t('ai.suggest4')}`,
      '',
      t('ai.hint'),
    ].join('\n'),
    actions: [],
  };
}
