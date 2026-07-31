/**
 * Inventario de texto visible sin traducir.
 *
 * Busca dos cosas en los .tsx: nodos de texto JSX y literales pasados a props
 * que acaban en pantalla (title, label, placeholder, aria-label...). Lo que
 * lleve acentos, enes o palabras castellanas se considera pendiente.
 *
 *   node scripts/i18n-audit.mjs           lista por archivo
 *   node scripts/i18n-audit.mjs --count   solo el total
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('src/**/*.tsx').sort();

/** Props cuyo valor de cadena se muestra al usuario. */
const TEXT_PROPS =
  /\b(title|subtitle|label|placeholder|aria-label|description|hint|unit|message|confirmLabel|emptyText)=\{?["'`]([^"'`]{2,})["'`]\}?/g;

/** Nodo de texto JSX: entre > y < sin llaves ni etiquetas. */
const JSX_TEXT = />(\s*[^<>{}\n][^<>{}]*)</g;

const SPANISH =
  /[áéíóúñÁÉÍÓÚÑ¿¡]|\b(el|la|los|las|un|una|de|del|con|sin|para|por|que|tu|tus|mi|mis|no|si|se|es|son|hay|mas|dias|semana|peso|comida|entrenamiento|ajustes|guardar|anadir|borrar|copia|datos|fotos|error|nada|todo|todos|todas|cuando|desde|hasta|sobre|entre|cada|solo|ya|aun|tras|antes|despues)\b/i;

const results = [];
let total = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const found = new Set();

  for (const m of src.matchAll(TEXT_PROPS)) {
    const value = m[2].trim();
    if (value.length > 2 && SPANISH.test(value)) found.add(`${m[1]}="${value}"`);
  }
  for (const m of src.matchAll(JSX_TEXT)) {
    const value = m[1].trim();
    if (value.length > 2 && SPANISH.test(value) && !value.startsWith('//')) found.add(value);
  }

  if (found.size) {
    results.push({ file, strings: [...found] });
    total += found.size;
  }
}

if (process.argv.includes('--count')) {
  console.log(total);
} else {
  for (const { file, strings } of results.sort((a, b) => b.strings.length - a.strings.length)) {
    console.log(`\n── ${file}  (${strings.length})`);
    for (const s of strings) console.log(`   ${s.slice(0, 110)}`);
  }
  console.log(`\nTOTAL: ${total} cadenas en ${results.length} archivos`);
}
