/**
 * Empaqueta y ejecuta la prueba de humo del dominio con esbuild (ya viene con
 * Vite), asi no hace falta anadir un runner de tests como dependencia.
 */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'node_modules/.cache/bodyfit-domain-tests.mjs');

await build({
  entryPoints: [resolve(root, 'scripts/smoke-test.mts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  alias: { '@': resolve(root, 'src') },
  logLevel: 'warning',
});

try {
  execFileSync(process.execPath, [out], { stdio: 'inherit' });
} catch {
  process.exitCode = 1;
} finally {
  rmSync(out, { force: true });
}
