/**
 * Auditoria Lighthouse sobre el build de produccion.
 *
 * Levanta `vite preview`, lanza Chromium (el que ya instalo Playwright) y
 * audita las rutas principales en perfil movil.
 *
 *   node scripts/run-lighthouse.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const PORT = 4188;
const BASE = `http://localhost:${PORT}`;
const OUT = resolve('e2e/lighthouse');
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ['inicio', '/'],
  ['nutricion', '/nutricion'],
  ['tecnica', '/ejercicios/sentadilla'],
];

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* aun no escucha */
    }
    await wait(500);
  }
  return false;
}

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore', shell: process.platform === 'win32' },
);

let browser;
try {
  if (!(await waitForServer(BASE))) throw new Error('el servidor de preview no arranco');

  // Se reutiliza el Chromium de Playwright con el puerto de depuracion abierto
  browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
  await wait(1000);

  const results = [];

  for (const [name, route] of ROUTES) {
    const runner = await lighthouse(
      `${BASE}${route}`,
      {
        port: 9222,
        output: ['json', 'html'],
        logLevel: 'error',
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3 },
        throttlingMethod: 'simulate',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    );

    const lhr = runner.lhr;
    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]),
    );

    const metrics = {
      fcp: lhr.audits['first-contentful-paint']?.displayValue,
      lcp: lhr.audits['largest-contentful-paint']?.displayValue,
      tbt: lhr.audits['total-blocking-time']?.displayValue,
      cls: lhr.audits['cumulative-layout-shift']?.displayValue,
      si: lhr.audits['speed-index']?.displayValue,
    };

    const failedA11y = Object.values(lhr.audits)
      .filter(
        (a) =>
          a.score !== null &&
          a.score < 1 &&
          lhr.categories.accessibility.auditRefs.some((r) => r.id === a.id),
      )
      .map((a) => a.title);

    results.push({ name, route, scores, metrics, failedA11y });

    writeFileSync(resolve(OUT, `${name}.html`), runner.report[1]);
    console.log(
      `\n${route}\n  rendimiento ${scores.performance} · accesibilidad ${scores.accessibility} · ` +
        `buenas practicas ${scores['best-practices']} · SEO ${scores.seo}`,
    );
    console.log(
      `  FCP ${metrics.fcp} · LCP ${metrics.lcp} · TBT ${metrics.tbt} · CLS ${metrics.cls}`,
    );
    if (failedA11y.length) console.log(`  accesibilidad pendiente: ${failedA11y.join(' | ')}`);
  }

  writeFileSync(resolve(OUT, 'resumen.json'), JSON.stringify(results, null, 2));
  console.log(`\nInformes HTML en ${OUT}`);
} finally {
  await browser?.close();
  server.kill();
}
