/**
 * Mide el peso real que descarga el usuario.
 *
 * No basta con mirar el tamano de `dist/`: lo que importa es cuanto pesa el
 * arranque (lo que se descarga si o si) frente a lo que llega solo cuando se
 * entra en una pantalla. Este script separa las dos cosas y mide gzip, que es
 * lo que viaja por la red.
 *
 *   node scripts/measure-bundle.mjs            imprime la tabla
 *   node scripts/measure-bundle.mjs --json     para comparar entre commits
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const ASSETS = resolve(DIST, 'assets');

if (!existsSync(ASSETS)) {
  console.error('No hay build. Ejecuta primero: npm run build');
  process.exit(1);
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

/** Lo que el navegador pide antes de pintar nada: index.html y lo que referencia. */
function entryChunks() {
  const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  return [...html.matchAll(/\/assets\/([A-Za-z0-9._-]+)/g)].map((m) => m[1]);
}

const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
const entry = new Set(entryChunks());

const rows = files.map((name) => {
  const raw = readFileSync(resolve(ASSETS, name));
  return {
    name,
    raw: raw.length,
    gz: gzipSync(raw, { level: 9 }).length,
    entry: entry.has(name),
  };
});

/*
 * Marcadores de contenido: sirven para saber en que trozo acabo cada catalogo.
 * Si un catalogo aparece en un chunk de arranque, es que no esta diferido.
 */
const MARKERS = {
  ejercicios: 'press-banca',
  tecnica: 'escapulas',
  alimentos: 'Pechuga de pollo',
  poses: 'holdSeconds',
  'i18n es': 'Nunca has hecho una copia',
  'i18n en': 'You have never made a backup',
  rutinas: 'Push / Pull / Legs',
};

const located = {};
for (const [label, needle] of Object.entries(MARKERS)) {
  const hit = rows.find((r) => r.name.endsWith('.js') && readFileSync(resolve(ASSETS, r.name), 'utf8').includes(needle));
  located[label] = hit ? { chunk: hit.name, gz: kb(hit.gz), enArranque: hit.entry } : null;
}

const entryRows = rows.filter((r) => r.entry).sort((a, b) => b.gz - a.gz);
const lazyRows = rows.filter((r) => !r.entry).sort((a, b) => b.gz - a.gz);

const totalEntryGz = entryRows.reduce((n, r) => n + r.gz, 0);
const totalLazyGz = lazyRows.reduce((n, r) => n + r.gz, 0);

const summary = {
  arranqueGz: kb(totalEntryGz),
  arranqueRaw: kb(entryRows.reduce((n, r) => n + r.raw, 0)),
  diferidoGz: kb(totalLazyGz),
  totalGz: kb(totalEntryGz + totalLazyGz),
  chunks: rows.length,
  catalogos: located,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log('\nARRANQUE — se descarga siempre');
console.log('-'.repeat(62));
for (const r of entryRows) {
  console.log(`  ${r.name.padEnd(34)} ${String(kb(r.gz)).padStart(7)} KB gz  (${kb(r.raw)} KB)`);
}
console.log(`  ${'TOTAL'.padEnd(34)} ${String(kb(totalEntryGz)).padStart(7)} KB gz`);

console.log('\nDIFERIDO — solo al entrar en la pantalla');
console.log('-'.repeat(62));
for (const r of lazyRows.slice(0, 12)) {
  console.log(`  ${r.name.padEnd(34)} ${String(kb(r.gz)).padStart(7)} KB gz`);
}
if (lazyRows.length > 12) console.log(`  ... y ${lazyRows.length - 12} chunks mas`);
console.log(`  ${'TOTAL'.padEnd(34)} ${String(kb(totalLazyGz)).padStart(7)} KB gz`);

console.log('\nDONDE ACABO CADA CATALOGO');
console.log('-'.repeat(62));
for (const [label, info] of Object.entries(located)) {
  if (!info) {
    console.log(`  ${label.padEnd(12)} no encontrado`);
    continue;
  }
  const mark = info.enArranque ? 'EN EL ARRANQUE' : 'diferido';
  console.log(`  ${label.padEnd(12)} ${info.chunk.padEnd(32)} ${mark}`);
}

console.log(`\nArranque: ${kb(totalEntryGz)} KB gz  ·  Diferido: ${kb(totalLazyGz)} KB gz\n`);
