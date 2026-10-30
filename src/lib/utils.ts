export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Pazartesi = 0 */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDate(iso: string, lang: string, opts?: Intl.DateTimeFormatOptions): string {
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  return parseISODate(iso).toLocaleDateString(locale, opts ?? { day: 'numeric', month: 'long' });
}

export function formatDateTime(iso: string, time: string, lang: string): string {
  const base = formatDate(iso, lang, { day: 'numeric', month: 'long', weekday: 'short' });
  return time ? `${base} · ${time}` : base;
}

export function relativeTime(ts: number, lang: string): string {
  const diff = Date.now() - ts;
  const rtf = new Intl.RelativeTimeFormat(lang === 'tr' ? 'tr' : 'en', { numeric: 'auto' });
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, 'day');
  return rtf.format(-Math.round(days / 30), 'month');
}

/** Türkçe duyarsız arama: İSTANBUL = istanbul, ı = i */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matches(haystack: string, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(haystack).includes(q);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(text: string, filename: string, type = 'application/json'): void {
  downloadBlob(new Blob([text], { type }), filename);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripHtml(value: string): string {
  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent ?? '';
}

export function wordCount(value: string): number {
  const text = stripHtml(value).replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

export function pluralize(lang: string, count: number, one: string, many: string): string {
  return `${count} ${lang === 'tr' ? (count === 1 ? one : many) : count === 1 ? one : many}`;
}
