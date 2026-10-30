import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src');
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
}
await walk(root);

const i18n = await readFile(path.join(root, 'i18n.ts'), 'utf8');
const trBlock = i18n.slice(i18n.indexOf('const tr = {'), i18n.indexOf('} as const;'));
const enBlock = i18n.slice(i18n.indexOf('const en: Dict = {'), i18n.indexOf('export const dictionaries'));
const keysTr = new Set([...trBlock.matchAll(/'([A-Za-z0-9.]+)':/g)].map((m) => m[1]));
const keysEn = new Set([...enBlock.matchAll(/'([A-Za-z0-9.]+)':/g)].map((m) => m[1]));

const used = new Map();
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\bt\(\s*'([a-zA-Z0-9.]+)'/g)) {
    used.set(match[1], path.relative(root, file));
  }
}

const missing = [...used.keys()].filter((key) => !keysTr.has(key));
const missingEn = [...keysTr].filter((key) => !keysEn.has(key));
const unused = [...keysTr].filter((key) => !used.has(key));

console.log('Kullanılan anahtar:', used.size, '| tr:', keysTr.size, '| en:', keysEn.size);
console.log('\nEksik (tr):', missing);
console.log('\nEksik (en):', missingEn);
console.log('\nKullanılmayan:', unused);
