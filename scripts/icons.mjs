import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const svg = await readFile(path.join(root, 'public/icon.svg'));

async function make(size, name, padding = 0) {
  const inner = Math.round(size * (1 - padding * 2));
  const offset = Math.round((size - inner) / 2);
  const icon = await sharp(svg).resize(inner, inner).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 31, g: 107, b: 79, alpha: 1 },
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toFile(path.join(root, 'public', name));

  console.log(`${name} yazıldı`);
}

await make(192, 'icon-192.png');
await make(512, 'icon-512.png');
await make(512, 'icon-maskable-512.png', 0.1);
await make(180, 'apple-touch-icon.png');
