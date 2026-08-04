/**
 * Punto de entrada de la auditoria de dos dispositivos contra staging.
 *
 * Se separa del modulo para que este pueda importarse desde otras pruebas sin
 * ejecutarse al cargarlo.
 */
import { runTwoDeviceAudit } from './audit-two-devices.mts';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FALLA'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};
const line = (t: string) => console.log(`\n${t}\n${'-'.repeat(t.length)}`);

await runTwoDeviceAudit(check, line);

console.log(
  `\n${failures === 0 ? 'DOS DISPOSITIVOS CONTRA STAGING: SUPERADO' : `${failures} COMPROBACIONES FALLIDAS`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
