import type { Settings } from '../types';

export type ThemeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  wash: string;
};

export const LIGHT: ThemeTokens = {
  bg: '#f4f4ef',
  surface: '#ffffff',
  surface2: '#fafaf5',
  line: '#e2e3d9',
  ink: '#191d19',
  muted: '#6c7268',
  accent: '#1f6b4f',
  accentInk: '#ffffff',
  wash: '#e6efe8',
};

export const DARK: ThemeTokens = {
  bg: '#101310',
  surface: '#171b16',
  surface2: '#1d221c',
  line: '#2a3028',
  ink: '#e9ece4',
  muted: '#9aa295',
  accent: '#6fd3a8',
  accentInk: '#0d1a13',
  wash: '#1d3228',
};

export type Palette = {
  id: string;
  name: { tr: string; en: string };
  tokens: ThemeTokens;
};

export const PALETTES: Palette[] = [
  {
    id: 'murekkep',
    name: { tr: 'Mürekkep', en: 'Ink' },
    tokens: {
      bg: '#f2f4ee',
      surface: '#ffffff',
      surface2: '#f7f9f3',
      line: '#dfe4d7',
      ink: '#16211b',
      muted: '#68756c',
      accent: '#1f6b4f',
      accentInk: '#ffffff',
      wash: '#e2efe6',
    },
  },
  {
    id: 'seker',
    name: { tr: 'Şeker', en: 'Candy' },
    tokens: {
      bg: '#fdf1ee',
      surface: '#ffffff',
      surface2: '#fdf7f4',
      line: '#f0dad3',
      ink: '#2a1c19',
      muted: '#79625d',
      accent: '#bf3f59',
      accentInk: '#ffffff',
      wash: '#fbe1e6',
    },
  },
  {
    id: 'orman',
    name: { tr: 'Orman', en: 'Forest' },
    tokens: {
      bg: '#eff5ec',
      surface: '#ffffff',
      surface2: '#f5f9f2',
      line: '#dbe6d3',
      ink: '#14231a',
      muted: '#5f705f',
      accent: '#2c7a3f',
      accentInk: '#ffffff',
      wash: '#dcf0df',
    },
  },
  {
    id: 'okyanus',
    name: { tr: 'Okyanus', en: 'Ocean' },
    tokens: {
      bg: '#edf4f9',
      surface: '#ffffff',
      surface2: '#f4f9fc',
      line: '#d6e3ed',
      ink: '#12212e',
      muted: '#5c7080',
      accent: '#12618b',
      accentInk: '#ffffff',
      wash: '#dceef8',
    },
  },
  {
    id: 'lavanta',
    name: { tr: 'Lavanta', en: 'Lavender' },
    tokens: {
      bg: '#f3f0fa',
      surface: '#ffffff',
      surface2: '#f8f6fd',
      line: '#e2dcf0',
      ink: '#1e1a2a',
      muted: '#6b6480',
      accent: '#5849a6',
      accentInk: '#ffffff',
      wash: '#e9e3fa',
    },
  },
  {
    id: 'gunbatimi',
    name: { tr: 'Gün batımı', en: 'Sunset' },
    tokens: {
      bg: '#fdf2e9',
      surface: '#ffffff',
      surface2: '#fdf8f2',
      line: '#f0ddca',
      ink: '#2a1b12',
      muted: '#7d6455',
      accent: '#bd5528',
      accentInk: '#ffffff',
      wash: '#fbe4d3',
    },
  },
  {
    id: 'kagit',
    name: { tr: 'Kâğıt', en: 'Paper' },
    tokens: {
      bg: '#f5f2e7',
      surface: '#fffdf6',
      surface2: '#faf7ec',
      line: '#e5dfcd',
      ink: '#231f17',
      muted: '#736c5b',
      accent: '#7a5a2a',
      accentInk: '#fffdf6',
      wash: '#efe6cf',
    },
  },
  {
    id: 'neon',
    name: { tr: 'Neon', en: 'Neon' },
    tokens: {
      bg: '#0d1210',
      surface: '#141a17',
      surface2: '#1a221d',
      line: '#283630',
      ink: '#e8f6ee',
      muted: '#8fa79a',
      accent: '#35d07f',
      accentInk: '#06130c',
      wash: '#123024',
    },
  },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function tokensFor(settings: Settings): ThemeTokens {
  if (settings.theme === 'light') return LIGHT;
  if (settings.theme === 'dark') return DARK;
  const base = paletteById(settings.palette).tokens;
  if (!settings.accent) return base;
  return { ...base, accent: settings.accent };
}

function isDark(color: string): boolean {
  const hex = color.replace('#', '');
  const value = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function applyTheme(settings: Settings, reduceMotionOS: boolean): void {
  const root = document.documentElement;
  const tokens = tokensFor(settings);
  root.dataset.theme = settings.theme;
  root.dataset.palette = settings.palette;
  root.lang = settings.lang;
  root.classList.toggle('no-motion', settings.reduceMotion || reduceMotionOS);
  const dark = isDark(tokens.bg);
  root.classList.toggle('is-dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, value);
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tokens.bg);
}
