/**
 * Empaqueta y ejecuta una prueba de humo con esbuild (ya viene con Vite), asi
 * no hace falta anadir un runner de tests como dependencia.
 *
 *   node scripts/run-domain-tests.mjs                          dominio
 *   node scripts/run-domain-tests.mjs scripts/smoke-collections.mts
 *
 * Las pruebas se escriben en TypeScript y leen `src/` con los mismos alias que
 * la aplicacion, para que no puedan quedar desincronizadas con ella.
 */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = resolve(root, process.argv[2] ?? 'scripts/smoke-test.mts');
const out = resolve(root, `node_modules/.cache/bodyfit-${basename(entry, '.mts')}.mjs`);

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  alias: {
    '@': resolve(root, 'src'),
    '@bodyfit/domain': resolve(root, 'packages/domain/src'),
  },
  logLevel: 'warning',
});

try {
  execFileSync(process.execPath, [out], { stdio: 'inherit' });
} catch {
  process.exitCode = 1;
} finally {
  rmSync(out, { force: true });
}
