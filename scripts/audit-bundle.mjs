/**
 * Guardia del peso de arranque.
 *
 * Los catalogos volvieron al chunk de entrada una vez y nadie se entero: basto
 * con que un store importara `EXERCISE_BY_ID`. Es un error facil de cometer y
 * dificil de ver, porque no rompe nada — solo hace que todos los usuarios
 * descarguen 70 KB que la mayoria no usara nunca.
 *
 * Esta auditoria falla si eso vuelve a pasar.
 *
 *   node scripts/audit-bundle.mjs
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

/** Techo del arranque, en KB comprimidos. Bajarlo esta bien; subirlo hay que justificarlo. */
const LIMITE_ARRANQUE_KB = 150;

/*
 * Contenido que NO puede viajar en el arranque, con un fragmento que lo
 * identifica. Son catalogos: solo hacen falta al entrar en su pantalla.
 */
/*
 * Los marcadores son NOMBRES de contenido, no identificadores.
 *
 * Primer intento fallido: `pollo-pechuga-cocida` parecia buen marcador del
 * catalogo de alimentos, pero es un id que el dominio usa en sus listas de
 * complementos. La auditoria fallaba senalando un catalogo que si estaba
 * diferido.
 */
const PROHIBIDO_EN_ARRANQUE = [
  ['catalogo de ejercicios', 'press-banca'],
  ['fichas de tecnica', 'escapulas'],
  ['catalogo de alimentos', 'Pechuga de pollo'],
  ['rutinas de fabrica', 'Push / Pull / Legs'],
  ['diccionario en ingles', 'You have never made a backup'],
  ['poses de posing', 'holdSeconds'],
];

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FALLA'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const entryNames = new Set([...html.matchAll(/\/assets\/([A-Za-z0-9._-]+)/g)].map((m) => m[1]));

const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
const entryFiles = files.filter((f) => entryNames.has(f));

console.log('\nPeso de arranque');
console.log('-'.repeat(56));

let totalGz = 0;
for (const name of entryFiles) {
  const raw = readFileSync(resolve(ASSETS, name));
  const gz = gzipSync(raw, { level: 9 }).length;
  totalGz += gz;
  console.log(`   ${name.padEnd(32)} ${(gz / 1024).toFixed(1).padStart(6)} KB gz`);
}
const totalKb = Math.round((totalGz / 1024) * 10) / 10;

check(
  `el arranque cabe en ${LIMITE_ARRANQUE_KB} KB comprimidos`,
  totalKb <= LIMITE_ARRANQUE_KB,
  `${totalKb} KB`,
);

console.log('\nCatalogos fuera del arranque');
console.log('-'.repeat(56));

const entryText = entryFiles
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(resolve(ASSETS, f), 'utf8'))
  .join('\n');

for (const [label, needle] of PROHIBIDO_EN_ARRANQUE) {
  check(`${label} no viaja en el arranque`, !entryText.includes(needle));
}

/* ═════════════════════════════════ la sincronizacion no arranca sola ══ */
/*
 * Produccion no puede inicializar sincronizacion.
 *
 * El motor, la cola y el adaptador de Supabase viajan diferidos, y el flag va
 * en `disabled`. Si alguien anade un import estatico desde codigo que se carga
 * siempre —el Layout, un store, la barra de pestanas— la sincronizacion pasaria
 * a formar parte del arranque de todo el mundo sin que nadie lo decidiera.
 */
for (const [label, needle] of [
  ['el motor de sincronizacion', 'bodyfit-sync'],
  ['las llamadas al servidor', 'sync_push'],
  /*
   * `dead-letter` y no `outbox`: `outbox` es tambien el nombre de una propiedad
   * que lee el indicador de estado, que si vive en el arranque. El marcador
   * tiene que ser exclusivo del modulo, no de su vocabulario.
   */
  ['la maquina de estados de la cola', 'dead-letter'],
]) {
  check(`${label} no viaja en el arranque`, !entryText.includes(needle));
}

/*
 * Y ninguna credencial, ni siquiera la publica.
 *
 * La clave anon esta pensada para viajar en el navegador y lo que protege los
 * datos es RLS. Pero en el bundle de PRODUCCION no debe estar ninguna, porque
 * produccion no habla con Supabase: si aparece, alguien puso las variables de
 * staging en el entorno equivocado.
 */
const secretos = [
  ['una URL de Supabase', /https:\/\/[a-z0-9]{20}\.supabase\.co/],
  ['una clave publishable', /sb_publishable_[A-Za-z0-9_-]{10,}/],
  ['una clave de servicio', /service_role|sb_secret_/],
];
const todoElBundle = files
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(resolve(ASSETS, f), 'utf8'))
  .join('\n');

for (const [label, pattern] of secretos) {
  check(`no viaja ${label} en ningun chunk`, !pattern.test(todoElBundle));
}

/* El espanol si viaja: `t()` cae a el cuando falta una clave en otro idioma. */
check(
  'el diccionario espanol si esta disponible desde el primer pintado',
  entryText.includes('Nunca has hecho una copia'),
  'es la red de seguridad de t()',
);

console.log(
  `\n${failures === 0 ? 'AUDITORIA DE BUNDLE SUPERADA' : `${failures} COMPROBACIONES FALLIDAS`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
