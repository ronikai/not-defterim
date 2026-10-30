import type { Lang } from '../types';
import { normalize } from '../lib/utils';

export type KnowledgeArticle = {
  id: string;
  keywords: string[];
  title: Record<Lang, string>;
  body: Record<Lang, string>;
};

/**
 * Uygulamanın kendi kullanım bilgisi. Asistan, "nasıl / nerede" sorularında
 * bu maddelerden en uygun olanı yanıtlar. Dış servise istek gitmez.
 */
export const ARTICLES: KnowledgeArticle[] = [
  {
    id: 'add-note',
    keywords: [
      'not ekle',
      'yeni not',
      'not olustur',
      'not nasil',
      'not al',
      'not tut',
      'add note',
      'new note',
      'create note',
      'how to add',
    ],
    title: { tr: 'Not ekleme', en: 'Adding a note' },
    body: {
      tr: [
        'Üstteki “+ Not ekle” düğmesine bas; Notlar ekranındaysan “+ Yeni not” da aynı işi yapar.',
        '',
        '1. Açılan pencerede başlığı yaz.',
        '2. Türü seç: metin, kontrol listesi, tablo, belge, kod veya akış.',
        '3. Not açılır; gövdeyi yaz, istersen etiket ekle.',
        '',
        'Her şey otomatik kaydedilir, ayrıca “Kaydet” demen gerekmez.',
      ].join('\n'),
      en: [
        'Use “+ Add note” at the top; on the Notes screen “+ New note” does the same.',
        '',
        '1. Type a title in the dialog.',
        '2. Pick a type: text, checklist, sheet, document, code or flow.',
        '3. The note opens; write the body and add tags if you like.',
        '',
        'Everything saves automatically, no “Save” button needed.',
      ].join('\n'),
    },
  },
  {
    id: 'calendar',
    keywords: [
      'takvim',
      'etkinlik ekle',
      'ozel gun',
      'hatirlat',
      'gun notu',
      'randevu',
      'calendar',
      'add event',
      'reminder',
      'special day',
      'day note',
    ],
    title: { tr: 'Takvim ve hatırlatma', en: 'Calendar and reminders' },
    body: {
      tr: [
        'Takvimde bir güne tıkla; sağdaki panelde o günün planı açılır.',
        '• “+ Etkinlik ekle” ile saatli etkinlik veya “Özel gün” ekleyebilirsin.',
        '• “Gün notu” alanına o günle ilgili serbest yazı yazabilirsin; otomatik kaydedilir.',
        '• “Bir gün önce hatırlat” açıksa etkinlikten 24 saat önce bildirim gelir.',
        '• Bildirim için Ayarlar → Bildirimler → “İzin ver” gerekir.',
      ].join('\n'),
      en: [
        'Click a day in the calendar; the day panel opens on the right.',
        '• Use “+ Add event” for a timed event or “Special day”.',
        '• The “Day note” field is free text for that day and saves automatically.',
        '• With “Remind me one day before”, you get a notification 24 hours ahead.',
        '• Notifications need Settings → Notifications → “Allow”.',
      ].join('\n'),
    },
  },
  {
    id: 'sheet',
    keywords: ['tablo', 'formul', 'hesap', 'sheet', 'formula', 'spreadsheet'],
    title: { tr: 'Tablo ve formüller', en: 'Sheets and formulas' },
    body: {
      tr: [
        'Tablo uygulamasında hücreye çift tıkla ve yaz. Formül için başına “=” koy:',
        '• =TOPLA(A1:A5) · =ORTALAMA(B1:B10) · =MAK(C1:C9) · =MİN(C1:C9) · =SAY(A1:A20)',
        '',
        'Alt satırdaki Σ sütun toplamını gösterir. “CSV” düğmesi tabloyu dosya olarak indirir.',
      ].join('\n'),
      en: [
        'Double-click a cell in the Sheet app and type. Start formulas with “=”:',
        '• =SUM(A1:A5) · =AVERAGE(B1:B10) · =MAX(C1:C9) · =MIN(C1:C9) · =COUNT(A1:A20)',
        '',
        'The Σ row shows column totals. “CSV” downloads the sheet as a file.',
      ].join('\n'),
    },
  },
  {
    id: 'doc',
    keywords: ['belge', 'dokuman', 'document', 'uzun yazi', 'rich text'],
    title: { tr: 'Belge yazma', en: 'Writing documents' },
    body: {
      tr: [
        'Belge uygulamasında başlık, alt başlık, kalın/italik, liste ve alıntı araç çubuğundan seçilir.',
        '',
        'Kelime sayısı araç çubuğunun sağında görünür. Yazdıkça otomatik kaydedilir.',
      ].join('\n'),
      en: [
        'In the Document app, headings, bold/italic, lists and quotes are in the toolbar.',
        '',
        'Word count appears on the right of the toolbar. It saves as you type.',
      ].join('\n'),
    },
  },
  {
    id: 'flow',
    keywords: ['akis', 'diyagram', 'sema', 'flowchart', 'flow chart', 'diagram'],
    title: { tr: 'Akış şeması', en: 'Flow charts' },
    body: {
      tr: [
        'Akış uygulamasında üstteki şekil düğmeleriyle kutu ekle: başlangıç, süreç, karar, bitiş.',
        '• Kutuyu sürükleyerek taşı, metnini içine yaz.',
        '• Bir kutuyu seçip “Bağla”ya bas, sonra diğer kutuya tıkla; ok oluşur.',
        '• “PNG indir” ile görseli dışa aktarabilirsin.',
      ].join('\n'),
      en: [
        'Add boxes with the shape buttons in Flow: start, process, decision, end.',
        '• Drag a box to move it and type inside it.',
        '• Select a box, press “Connect”, then click another box to draw an arrow.',
        '• “Download PNG” exports the chart as an image.',
      ].join('\n'),
    },
  },
  {
    id: 'code',
    keywords: ['kod', 'yazilim', 'hata', 'bug', 'code', 'review', 'incele'],
    title: { tr: 'Kod notu ve inceleme', en: 'Code notes and review' },
    body: {
      tr: [
        'Kod uygulamasında dil seçip kodu yazabilirsin.',
        '• JavaScript’te “Çalıştır” sonucu altta gösterir.',
        '• “AI ile incele” parantez dengesi, == kullanımı, eval, XSS, gizli anahtar gibi riskleri satır numarasıyla listeler.',
        '• Kod notların da otomatik kaydedilir.',
      ].join('\n'),
      en: [
        'Pick a language in the Code app and write your snippet.',
        '• “Run” shows JavaScript output below.',
        '• “Review with AI” lists risks with line numbers: bracket balance, ==, eval, XSS, hardcoded secrets.',
        '• Code notes save automatically too.',
      ].join('\n'),
    },
  },
  {
    id: 'themes',
    keywords: ['tema', 'gece modu', 'karanlik', 'renkli', 'palet', 'theme', 'dark mode', 'colorful', 'palette'],
    title: { tr: 'Tema ve renkler', en: 'Themes and colors' },
    body: {
      tr: [
        'Sağ üstteki Ayarlar → Görünüm bölümünde üç tema var: Açık, Gece, Renkli.',
        '• “Renkli” seçince 8 palet görünür; beğendiğine tıkla.',
        '• “Özel renk” ile kendi vurgu rengini seçebilirsin.',
        '• Tema ve palet seçimin bu tarayıcıda saklanır.',
      ].join('\n'),
      en: [
        'Settings → Appearance has three themes: Light, Dark, Colorful.',
        '• Colorful shows 8 palettes; click one.',
        '• “Pick a custom color” sets your own accent.',
        '• Theme and palette choices are stored in this browser.',
      ].join('\n'),
    },
  },
  {
    id: 'data',
    keywords: [
      'veri',
      'yedek',
      'backup',
      'kayit nerede',
      'gizlilik',
      'privacy',
      'restore',
      'ice aktar',
      'disa aktar',
      'export',
      'import',
    ],
    title: { tr: 'Veriler ve yedekleme', en: 'Data and backups' },
    body: {
      tr: [
        'Veriler yalnızca bu tarayıcıda (IndexedDB) saklanır; sunucuya gitmez.',
        '• Ayarlar → “Yedek indir” ile JSON dosyası alabilirsin.',
        '• “Yedekten yükle” ile başka cihazda geri yükleyebilirsin.',
        '• Tarayıcı verisi temizlenirse kayıtlar silinir; düzenli yedek al.',
      ].join('\n'),
      en: [
        'Data stays only in this browser (IndexedDB); nothing goes to a server.',
        '• Settings → “Download backup” gives you a JSON file.',
        '• “Restore from backup” loads it on another device.',
        '• Clearing browser data deletes the records; keep backups.',
      ].join('\n'),
    },
  },
  {
    id: 'install',
    keywords: ['uygulama kur', 'pwa', 'kurulum', 'install', 'cevrimdisi', 'offline'],
    title: { tr: 'Uygulama olarak kurma', en: 'Installing as an app' },
    body: {
      tr: [
        'Site kurulabilir bir uygulamadır (PWA).',
        '• Masaüstü Chrome/Edge: adres çubuğundaki kurulum simgesi veya İndir → “Uygulamayı yükle”.',
        '• Android: tarayıcı menüsü → “Uygulamayı yükle”.',
        '• iPhone/iPad: Paylaş → “Ana Ekrana Ekle”.',
        '',
        'Kurulduktan sonra çevrimdışı açılır.',
      ].join('\n'),
      en: [
        'The site is an installable app (PWA).',
        '• Desktop Chrome/Edge: install icon in the address bar, or Download → “Install app”.',
        '• Android: browser menu → “Install app”.',
        '• iPhone/iPad: Share → “Add to Home Screen”.',
        '',
        'Once installed it opens offline.',
      ].join('\n'),
    },
  },
  {
    id: 'shortcuts',
    keywords: ['kisayol', 'shortcut', 'ctrl k', 'klavye', 'keyboard'],
    title: { tr: 'Klavye kısayolları', en: 'Keyboard shortcuts' },
    body: {
      tr: [
        '• Ctrl/⌘ + K: komut paleti (not ara, tema değiştir, yeni not/etkinlik).',
        '• N: yeni not (bir yazı alanında değilken).',
        '• Esc: açık paneli kapat.',
        '• Enter: kontrol listesinde yeni madde; tabloda aşağı geç.',
        '• Tab: tablo hücresinde sağa geç.',
      ].join('\n'),
      en: [
        '• Ctrl/⌘ + K: command palette (find notes, switch theme, new note/event).',
        '• N: new note (when not typing in a field).',
        '• Esc: close the open panel.',
        '• Enter: new checklist item; move down in a sheet.',
        '• Tab: move right in a sheet.',
      ].join('\n'),
    },
  },
  {
    id: 'language',
    keywords: ['dil degistir', 'ingilizce', 'language', 'english', 'turkce'],
    title: { tr: 'Dil değiştirme', en: 'Changing language' },
    body: {
      tr: 'Ayarlar → Dil bölümünden Türkçe veya English seçebilirsin. Arayüz anında değişir; notların olduğu gibi kalır.',
      en: 'Go to Settings → Language and pick Türkçe or English. The interface changes instantly; your notes stay as they are.',
    },
  },
  {
    id: 'assistant',
    keywords: [
      'asistan',
      'yapay zeka',
      'sen kimsin',
      'kimsin',
      'ai',
      'assistant',
      'who are you',
      'what can you do',
    ],
    title: { tr: 'Asistan ne yapar?', en: 'What can the assistant do?' },
    body: {
      tr: [
        'Cihazında çalışan bir asistanım; internet gerekmez.',
        '• Not ekler, listeye madde ekler, takvime etkinlik yazar.',
        '• Notlarını özetler, içlerinde arar, koddaki hataları inceler.',
        '• Uygulamanın kullanımını anlatır (bu soru gibi).',
        '• Sohbeti ve verileri yalnızca bu tarayıcıda saklar.',
      ].join('\n'),
      en: [
        'I run on your device; no internet needed.',
        '• I add notes, list items and calendar events.',
        '• I summarize and search your notes and review code.',
        '• I explain how the app works (questions like this one).',
        '• Chat and data are stored only in this browser.',
      ].join('\n'),
    },
  },
  {
    id: 'nickname',
    keywords: ['hitap', 'nickname', 'call me', 'bana nasil', 'ismim'],
    title: { tr: 'Sana nasıl hitap edeyim?', en: 'What should I call you?' },
    body: {
      tr: '“Bana gardaş diye hitap et” yazman yeterli. Hitabı bu tarayıcıda hatırlarım; Ayarlar → Asistan bölümünden de değiştirebilirsin.',
      en: 'Just say “call me buddy”. I remember it in this browser; you can also change it in Settings → Assistant.',
    },
  },
];

export function findArticle(input: string, lang: Lang): { title: string; body: string } | null {
  const text = normalize(input);
  let best: KnowledgeArticle | null = null;
  let bestScore = 0;

  for (const article of ARTICLES) {
    let score = 0;
    for (const keyword of article.keywords) {
      const key = normalize(keyword);
      if (text.includes(key)) score += key.includes(' ') ? 2 : 1;
    }
    if (score > bestScore) {
      best = article;
      bestScore = score;
    }
  }

  if (!best || bestScore === 0) return null;
  return { title: best.title[lang], body: best.body[lang] };
}
