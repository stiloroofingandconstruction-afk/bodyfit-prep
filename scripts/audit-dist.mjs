/**
 * Auditoria del build de produccion.
 *
 * Comprueba que `dist/` es un artefacto desplegable y coherente: que el HTML
 * referencia archivos que existen, que el manifest y sus iconos son validos,
 * que el service worker precachea solo archivos reales y que la configuracion
 * de Vercel cubre las rutas SPA.
 *
 *   node scripts/audit-dist.mjs [rutaDist] [rutaProyecto]
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[3] ?? resolve(here, '..'));
const DIST = resolve(process.argv[2] ?? join(ROOT, 'dist'));

let failures = 0;
let warnings = 0;
const ok = (name, detail = '') => console.log(`  ok    ${name}${detail ? ` — ${detail}` : ''}`);
const bad = (name, detail = '') => {
  console.log(`  FALLA ${name}${detail ? ` — ${detail}` : ''}`);
  failures++;
};
const warn = (name, detail = '') => {
  console.log(`  aviso ${name}${detail ? ` — ${detail}` : ''}`);
  warnings++;
};
const check = (cond, name, detail = '') => (cond ? ok(name, detail) : bad(name, detail));
const section = (t) => console.log(`\n${t}\n${'-'.repeat(t.length)}`);

const has = (p) => existsSync(join(DIST, p.replace(/^\//, '')));
const size = (p) => statSync(join(DIST, p.replace(/^\//, ''))).size;

/* ------------------------------------------------------------- estructura */
section('Estructura del build');

check(existsSync(DIST), 'existe dist/', DIST);
if (!existsSync(DIST)) process.exit(1);

for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  check(has(f), `dist/${f}`, has(f) ? `${size(f)} bytes` : 'no encontrado');
}
check(existsSync(join(DIST, 'assets')), 'dist/assets/');
check(existsSync(join(DIST, 'icons')), 'dist/icons/');

const workbox = readdirSync(DIST).filter((f) => /^workbox-.*\.js$/.test(f));
check(workbox.length === 1, 'runtime de workbox', workbox.join(', ') || 'no encontrado');

/* ------------------------------------------------------------------ html */
section('index.html');

const html = readFileSync(join(DIST, 'index.html'), 'utf8');

// Todos los recursos referenciados deben existir en el artefacto
const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
const missing = refs.filter((r) => !has(r));
check(missing.length === 0, 'todos los recursos referenciados existen', missing.join(', ') || `${refs.length} recursos`);

check(/<link rel="manifest" href="\/manifest\.webmanifest">/.test(html), 'enlaza el manifest');
check(/rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png"/.test(html), 'apple-touch-icon para iOS');
check(/name="apple-mobile-web-app-capable" content="yes"/.test(html), 'modo standalone en iOS');
check(/viewport-fit=cover/.test(html), 'viewport-fit=cover (notch)');
check(/name="theme-color" content="#0B0F14"/.test(html), 'theme-color');
check(/<div id="root">/.test(html), 'punto de montaje de React');
check(!/localhost|127\.0\.0\.1|http:\/\//.test(html), 'sin localhost ni http:// en el HTML');
check(/type="module"/.test(html), 'bundle ES modules');

/* -------------------------------------------------------------- manifest */
section('manifest.webmanifest');

const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'));
check(manifest.name === 'BodyFit Prep', 'name', manifest.name);
check(manifest.short_name?.length <= 12, 'short_name cabe bajo el icono', manifest.short_name);
check(manifest.display === 'standalone', 'display standalone');
check(manifest.start_url === '/', 'start_url en la raiz', manifest.start_url);
check(manifest.scope === '/', 'scope en la raiz', manifest.scope);
check(!!manifest.id, 'id declarado (evita duplicar la instalacion)', manifest.id ?? 'ausente');
check(/^#[0-9A-Fa-f]{6}$/.test(manifest.theme_color ?? ''), 'theme_color', manifest.theme_color);
check(
  manifest.theme_color === manifest.background_color,
  'theme y background coinciden (sin destello al abrir)',
);

const iconMissing = (manifest.icons ?? []).filter((i) => !has(i.src));
check(iconMissing.length === 0, 'los iconos del manifest existen', iconMissing.map((i) => i.src).join(', ') || `${manifest.icons.length} iconos`);
check(
  (manifest.icons ?? []).some((i) => i.sizes === '192x192'),
  'icono 192x192 (requisito de instalabilidad)',
);
check(
  (manifest.icons ?? []).some((i) => i.sizes === '512x512'),
  'icono 512x512 (requisito de instalabilidad)',
);
check(
  (manifest.icons ?? []).some((i) => i.purpose === 'maskable'),
  'icono maskable (Android adaptativo)',
);

/* -------------------------------------------------- iconos: PNG de verdad */
section('Iconos');

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const name of readdirSync(join(DIST, 'icons'))) {
  const buf = readFileSync(join(DIST, 'icons', name));
  const isPng = buf.subarray(0, 8).equals(PNG_SIG);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  check(isPng, `${name} es un PNG valido`, isPng ? `${w}x${h}, RGBA=${colorType === 6}` : 'firma incorrecta');
}

const apple = readFileSync(join(DIST, 'icons/apple-touch-icon.png'));
check(apple.readUInt32BE(16) === 180 && apple.readUInt32BE(20) === 180, 'apple-touch-icon es 180x180');

/* -------------------------------------------------------- service worker */
section('Service worker');

const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
// El manifiesto va minificado: las claves pueden ir sin comillas (url:"...")
const entries = [...sw.matchAll(/(?:"url"|url)\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
check(entries.length > 0, 'el service worker tiene manifiesto de precache', `${entries.length} entradas`);

const swMissing = entries.filter((e) => !has(e));
check(swMissing.length === 0, 'todo lo precacheado existe en dist', swMissing.slice(0, 5).join(', ') || 'sin huerfanos');

check(/index\.html/.test(sw), 'navigateFallback a index.html (rutas SPA offline)');
check(/clientsClaim|clients\.claim/.test(sw), 'clientsClaim activo');
check(/skipWaiting|skip_waiting|skipwaiting/i.test(sw), 'skipWaiting (autoUpdate)');
check(entries.some((e) => e.includes('index.html')), 'index.html precacheado');
check(entries.some((e) => e.includes('icons/icon-192')), 'iconos precacheados');
check(entries.some((e) => e.endsWith('.css')), 'CSS precacheado');

const totalPrecache = entries.filter((e) => has(e)).reduce((n, e) => n + size(e), 0);
ok('peso total del precache', `${(totalPrecache / 1024).toFixed(1)} KiB`);
if (totalPrecache > 5 * 1024 * 1024) warn('el precache supera 5 MiB');

/* ------------------------------------------------------------ bundle JS */
section('Bundle de produccion');

const assets = readdirSync(join(DIST, 'assets'));
const js = assets.filter((f) => f.endsWith('.js'));
const css = assets.filter((f) => f.endsWith('.css'));
check(js.length > 0 && css.length > 0, 'hay JS y CSS', `${js.length} js, ${css.length} css`);
check(
  js.every((f) => /-[A-Za-z0-9_-]{8,}\.js$/.test(f)),
  'todos los JS llevan hash (cache-busting)',
);
check(!assets.some((f) => f.endsWith('.map')), 'sin source maps publicados');

const entryJs = refs.find((r) => r.startsWith('/assets/') && r.endsWith('.js'));
const entrySrc = entryJs ? readFileSync(join(DIST, entryJs.slice(1)), 'utf8') : '';
check(!!entryJs, 'entrada localizada', entryJs ?? '');
check(!/localhost:\d+/.test(entrySrc), 'sin localhost en el bundle de entrada');
check(!/\bdebugger\b/.test(entrySrc), 'sin sentencias debugger');
check(entrySrc.length > 0 && !/process\.env\.NODE_ENV/.test(entrySrc), 'NODE_ENV ya resuelto (build de produccion)');

const totalJs = js.reduce((n, f) => n + statSync(join(DIST, 'assets', f)).size, 0);
ok('peso total de JS', `${(totalJs / 1024).toFixed(1)} KiB sin comprimir`);

// Las rutas deben estar troceadas: si todo cayera en un chunk, el arranque sufre
check(js.length >= 8, 'code splitting por ruta activo', `${js.length} chunks`);

/* ------------------------------------------------------- vercel.json ---- */
section('Configuracion de Vercel');

const vercelPath = join(ROOT, 'vercel.json');
check(existsSync(vercelPath), 'existe vercel.json');
if (existsSync(vercelPath)) {
  const v = JSON.parse(readFileSync(vercelPath, 'utf8'));
  check(v.framework === 'vite', 'framework vite', v.framework);
  check(v.buildCommand === 'npm run build', 'buildCommand', v.buildCommand);
  check(v.outputDirectory === 'dist', 'outputDirectory', v.outputDirectory);

  const spa = (v.rewrites ?? []).some((r) => r.destination === '/index.html');
  check(spa, 'rewrite SPA a /index.html');

  const headerFor = (src) => (v.headers ?? []).find((h) => h.source === src);
  const swH = headerFor('/sw.js');
  check(!!swH, 'cabeceras para /sw.js');
  check(
    /max-age=0/.test(swH?.headers?.find((h) => h.key === 'Cache-Control')?.value ?? ''),
    'sw.js sin cache (las actualizaciones llegan)',
  );
  const assetH = headerFor('/assets/(.*)');
  check(
    /immutable/.test(assetH?.headers?.find((h) => h.key === 'Cache-Control')?.value ?? ''),
    'assets con hash cacheados como immutable',
  );
  const manH = headerFor('/manifest.webmanifest');
  check(
    /application\/manifest\+json/.test(manH?.headers?.find((h) => h.key === 'Content-Type')?.value ?? ''),
    'content-type del manifest',
  );
}

/* -------------------------------------------------- integridad del repo -- */
section('Integridad del proyecto');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
check(pkg.scripts?.build === 'tsc --noEmit && vite build', 'script build hace typecheck', pkg.scripts?.build);
check(!!pkg.private, 'package privado (no publicable por error)');

const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
for (const entry of ['node_modules', 'dist', '.env']) {
  check(gitignore.includes(entry), `.gitignore ignora ${entry}`);
}

/*
 * Nada de secretos en el arbol.
 *
 * `.env.example` es la excepcion y es deliberada: documenta que variables hacen
 * falta sin llevar ningun valor. Prohibirlo obligaria a documentarlas en otro
 * sitio, que envejece peor.
 *
 * Lo que se comprueba entonces no es que el archivo no exista, sino algo mas
 * util: que no contenga credenciales de verdad. Alguien rellena la plantilla
 * para probar, se olvida, y la sube.
 */
const envFiles = readdirSync(ROOT).filter((f) => f.startsWith('.env') && f !== '.env.example');
check(envFiles.length === 0, 'sin archivos .env con valores en el repositorio', envFiles.join(', ') || 'ninguno');

if (existsSync(join(ROOT, '.env.example'))) {
  /*
   * Solo las lineas de valor. Los comentarios de la plantilla NOMBRAN
   * `service_role` para explicar por que no puede estar ahi, y escanear el
   * archivo entero convertia esa advertencia en un fallo.
   */
  const example = readFileSync(join(ROOT, '.env.example'), 'utf8')
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('#'))
    .join('\n');
  const conValores = [
    [/https:\/\/[a-z0-9]{20}\.supabase\.co/, 'una URL de proyecto real'],
    [/sb_publishable_[A-Za-z0-9_-]{10,}/, 'una clave publishable real'],
    [/sb_secret_|service_role|eyJ[A-Za-z0-9_-]{20,}/, 'una clave secreta o un JWT'],
    [/^[A-Z0-9_]*PASSWORD\s*=\s*\S+/m, 'una contrasena rellenada'],
  ];
  for (const [pattern, what] of conValores) {
    check(!pattern.test(example), `.env.example no contiene ${what}`);
  }
}

/* ---------------------------------------------------------------------- */
console.log(
  `\n${failures === 0 ? 'AUDITORIA SUPERADA' : `${failures} FALLOS`}${warnings ? ` (${warnings} avisos)` : ''}\n`,
);
process.exit(failures === 0 ? 0 : 1);
