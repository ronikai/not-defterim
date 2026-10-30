/**
 * Bildirim sesleri. Hepsi Web Audio ile anlık üretilir; dosya indirilmez,
 * telif riski yoktur ve çevrimdışı çalışır.
 */

export type SoundId =
  | 'chime'
  | 'bell'
  | 'ding'
  | 'pop'
  | 'marimba'
  | 'soft'
  | 'alert'
  | 'coin'
  | 'defter'
  | 'murekkep';

export const SOUNDS: { id: SoundId; custom?: boolean }[] = [
  { id: 'chime' },
  { id: 'bell' },
  { id: 'ding' },
  { id: 'pop' },
  { id: 'marimba' },
  { id: 'soft' },
  { id: 'alert' },
  { id: 'coin' },
  { id: 'defter', custom: true },
  { id: 'murekkep', custom: true },
];

let audio: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audio) audio = new Ctor();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    context();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  options: { type?: OscillatorType; gain?: number; glide?: number } = {},
): void {
  const at = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, at);
  if (options.glide) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.glide), at + duration);
  }
  const peak = options.gain ?? 0.16;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(dest);
  osc.start(at);
  osc.stop(at + duration + 0.03);
}

function noise(
  ctx: AudioContext,
  dest: AudioNode,
  start: number,
  duration: number,
  volume: number,
  center: number,
): void {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = center;
  filter.Q.value = 0.9;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(dest);
  source.start(ctx.currentTime + start);
}

export function playSound(id: string): void {
  const ctx = context();
  if (!ctx) return;

  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  switch (id) {
    case 'bell':
      tone(ctx, master, 1046, 0, 1.4, { gain: 0.14 });
      tone(ctx, master, 1568, 0, 1.1, { type: 'triangle', gain: 0.06 });
      tone(ctx, master, 2093, 0.01, 0.9, { gain: 0.04 });
      break;
    case 'ding':
      tone(ctx, master, 1568, 0, 0.5, { gain: 0.18 });
      tone(ctx, master, 2349, 0, 0.35, { gain: 0.05 });
      break;
    case 'pop':
      tone(ctx, master, 520, 0, 0.14, { gain: 0.22, glide: 180 });
      break;
    case 'marimba':
      tone(ctx, master, 659, 0, 0.35, { type: 'triangle', gain: 0.2 });
      tone(ctx, master, 988, 0.11, 0.5, { type: 'triangle', gain: 0.16 });
      break;
    case 'soft':
      tone(ctx, master, 440, 0, 0.8, { gain: 0.11 });
      tone(ctx, master, 554, 0.15, 0.9, { gain: 0.09 });
      break;
    case 'alert':
      tone(ctx, master, 740, 0, 0.13, { type: 'triangle', gain: 0.1 });
      tone(ctx, master, 740, 0.18, 0.13, { type: 'triangle', gain: 0.1 });
      tone(ctx, master, 740, 0.36, 0.16, { type: 'triangle', gain: 0.1 });
      break;
    case 'coin':
      tone(ctx, master, 988, 0, 0.09, { gain: 0.16 });
      tone(ctx, master, 1319, 0.09, 0.28, { gain: 0.14 });
      break;
    case 'defter':
      // Özel: kâğıt hışırtısı + kurşun kalem tıkırtısı + sıcak bir ton.
      noise(ctx, master, 0, 0.18, 0.1, 1800);
      tone(ctx, master, 320, 0.04, 0.12, { type: 'triangle', gain: 0.1, glide: 170 });
      tone(ctx, master, 660, 0.16, 0.45, { gain: 0.13 });
      break;
    case 'murekkep':
      // Özel: alçalan-sonra yükselen üç notalı mürekkep motifi.
      tone(ctx, master, 523, 0, 0.42, { type: 'triangle', gain: 0.13 });
      tone(ctx, master, 392, 0.18, 0.5, { type: 'triangle', gain: 0.11 });
      tone(ctx, master, 659, 0.4, 0.72, { gain: 0.12 });
      break;
    case 'chime':
    default:
      tone(ctx, master, 880, 0, 0.9, { gain: 0.16 });
      tone(ctx, master, 1318, 0.12, 1.1, { gain: 0.12 });
      break;
  }
}
