/**
 * Genera docs/IPHONE_REAL_DEVICE_TEST.md a partir de src/data/deviceChecklist.ts.
 *
 * El documento y la lista dentro de la app tienen que decir exactamente lo
 * mismo. Mantener dos copias a mano garantiza que en tres meses digan cosas
 * distintas, asi que solo hay una fuente y el documento se genera.
 *
 *   node scripts/gen-device-doc.mjs
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = resolve(root, 'node_modules/.cache/bodyfit-checklist.mjs');

mkdirSync(dirname(bundle), { recursive: true });
await build({
  entryPoints: [resolve(root, 'src/data/deviceChecklist.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'error',
});

const { DEVICE_CHECKLIST, CHECKLIST_ITEM_COUNT } = await import(pathToFileURL(bundle).href);

const lines = [
  '# Prueba en iPhone real',
  '',
  '> Documento generado desde `src/data/deviceChecklist.ts` con',
  '> `node scripts/gen-device-doc.mjs`. No lo edites a mano: edita la lista.',
  '',
  'La suite automatizada de BodyFit Prep cubre el dominio, el almacenamiento, las',
  'migraciones, las copias de seguridad, la navegacion completa y el renderizado en',
  'WebKit y Chromium a traves de Playwright. Lo que hay en este documento es lo que',
  'esa suite **no puede** comprobar, por mucho que emule el tamano de un iPhone.',
  '',
  '**Ninguna de estas comprobaciones se marca sola.** Ni este documento ni la app',
  'dan por aprobado nada que dependa de un dispositivo fisico. La lista equivalente',
  'dentro de la app esta en **Ajustes → Diagnostico → Prueba de iPhone**, y se puede',
  'imprimir desde ahi.',
  '',
  '## Antes de empezar',
  '',
  '1. Ten a mano un iPhone con iOS 17 o superior.',
  '2. Abre la direccion de produccion en **Safari** (no en Chrome ni en la vista web',
  '   de otra app: la instalacion en la pantalla de inicio solo funciona en Safari).',
  '3. Si vas a probar el borrado y la restauracion, **exporta una copia primero**',
  '   desde Ajustes → Datos y respaldo.',
  '',
  `## Comprobaciones (${CHECKLIST_ITEM_COUNT})`,
  '',
];

let n = 0;
for (const group of DEVICE_CHECKLIST) {
  lines.push(`### ${group.title}`, '');
  for (const item of group.items) {
    n++;
    lines.push(
      `#### ${n}. ${item.title}`,
      '',
      `- **Como:** ${item.how}`,
      `- **Se espera:** ${item.expected}`,
      `- **Por que no se automatiza:** ${item.whyManual}`,
      `- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________`,
      '',
    );
  }
}

lines.push(
  '## Si algo falla',
  '',
  '1. Ve a **Ajustes → Diagnostico** y pulsa **Descargar diagnostico**. El archivo',
  '   lista el entorno, el espacio usado y los ultimos errores registrados; no',
  '   incluye pesos, notas ni fotos.',
  '2. Exporta una copia de seguridad antes de tocar nada.',
  '3. Anota el modelo de iPhone y la version de iOS: casi todos los problemas de',
  '   area segura y de teclado dependen del modelo.',
  '',
  '## Que cubre la suite automatizada',
  '',
  'Para no repetir trabajo, esto ya esta comprobado y no hace falta verificarlo a mano:',
  '',
  '- Renderizado y navegacion de todas las pantallas en **WebKit**, el mismo motor',
  '  que usa Safari en iOS.',
  '- Ausencia de scroll horizontal, texto cortado y objetivos tactiles pequenos en',
  '  los tamanos de iPhone SE, iPhone moderno y iPad.',
  '- Errores de JavaScript y de React en consola durante los recorridos completos.',
  '- Copias de seguridad: creacion, verificacion de integridad, restauracion,',
  '  archivos danados y formatos antiguos.',
  '- Migraciones de esquema sin perdida de datos.',
  '- Manifiesto, service worker, iconos y rutas SPA sobre el build de produccion.',
  '',
);

const out = resolve(root, 'docs/IPHONE_REAL_DEVICE_TEST.md');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`docs/IPHONE_REAL_DEVICE_TEST.md generado — ${n} comprobaciones`);
