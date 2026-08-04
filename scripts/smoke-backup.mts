/**
 * Pruebas del formato de copia de seguridad.
 *
 * Es la parte de la app que menos se usa y mas duele cuando falla: si una copia
 * no se puede restaurar, el usuario lo descubre justo cuando ya no tiene los
 * datos. Por eso se prueban tambien los casos feos — archivo truncado, formato
 * antiguo, fotos corruptas, checksum manipulado.
 */
import {
  BACKUP_FORMAT,
  backupDue,
  buildBackup,
  canonicalize,
  checksum,
  countEntries,
  daysSince,
  fmtBytes,
  parseBackup,
} from '@bodyfit/domain/backup';

export function runBackupTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  line('Copias de seguridad: formato');

  const sample = {
    profile: { state: { profile: { name: 'Gustavo', heightCm: 178 } }, version: 2 },
    body: {
      state: { readiness: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], measurements: [{ id: 'm' }] },
      version: 1,
    },
    training: { state: { workouts: [] }, version: 1 },
  };
  const photos = [
    { id: 'p1', type: 'image/jpeg', size: 3, data: 'AAEC' },
    { id: 'p2', type: 'image/jpeg', size: 3, data: 'AwQF' },
  ];

  const file = buildBackup({
    data: sample,
    photos,
    appVersion: '2.1.0',
    exportedAt: '2026-07-31T10:00:00.000Z',
  });

  check('el archivo declara la version del formato', file.format === BACKUP_FORMAT);
  check('el archivo guarda la version de cada store', file.storeVersions.profile === 2);
  check('cuenta colecciones y fotos', file.counts.collections === 3 && file.counts.photos === 2);
  check('cuenta los bytes de foto', file.counts.photoBytes === 6);

  /* ── ida y vuelta ── */
  const round = parseBackup(JSON.stringify(file));
  check('una copia recien creada se lee sin errores', round.ok, round.errors.join(' | '));
  check('la integridad se verifica correctamente', round.checksumOk === true);
  check('sin advertencias en una copia sana', round.warnings.length === 0, round.warnings.join(' | '));
  check('conserva las dos fotos', round.photos === 2);
  check(
    'cuenta los registros de cada coleccion',
    round.collections.find((c) => c.key === 'body')?.entries === 4,
    JSON.stringify(round.collections),
  );

  /* ── canonicalizacion: el orden de las claves no cambia el hash ── */
  check(
    'el checksum no depende del orden de las claves',
    checksum({ a: 1, b: { c: 2, d: 3 } }) === checksum({ b: { d: 3, c: 2 }, a: 1 }),
  );
  check(
    'el checksum SI cambia si cambia un valor',
    checksum({ a: 1 }) !== checksum({ a: 2 }),
  );
  check(
    'canonicalize ordena las claves anidadas',
    JSON.stringify(canonicalize({ b: 1, a: { d: 1, c: 2 } })) === '{"a":{"c":2,"d":1},"b":1}',
  );
  check('canonicalize conserva el orden de los arrays',
    JSON.stringify(canonicalize([3, 1, 2])) === '[3,1,2]');

  /* ── archivos rotos ── */
  line('Copias de seguridad: archivos danados');

  const truncated = parseBackup(JSON.stringify(file).slice(0, 200));
  check('un archivo truncado se rechaza', !truncated.ok && truncated.errors.length > 0);

  const notBackup = parseBackup('{"hola":"mundo"}');
  check('un JSON que no es copia se rechaza', !notBackup.ok);

  const empty = parseBackup(JSON.stringify({ ...file, data: {} }));
  check('una copia sin colecciones se rechaza', !empty.ok);

  const future = parseBackup(JSON.stringify({ ...file, format: BACKUP_FORMAT + 5 }));
  check(
    'una copia de una version futura se rechaza con explicacion',
    !future.ok && future.errors[0]?.includes('Actualiza'),
  );

  const tampered = parseBackup(
    JSON.stringify({
      ...file,
      data: { ...sample, profile: { state: { profile: { name: 'Otro' } }, version: 2 } },
    }),
  );
  check(
    'un archivo editado a mano se detecta por el checksum',
    tampered.ok && tampered.checksumOk === false,
  );
  check(
    'aun asi se puede restaurar, avisando',
    tampered.file !== null && tampered.warnings.some((w) => w.includes('verificacion')),
  );

  const badPhotos = parseBackup(
    JSON.stringify({
      ...file,
      photos: [...photos, { id: 'p3', data: '!!! no es base64 !!!' }, { data: 'AAEC' }],
    }),
  );
  check('las fotos ilegibles se descartan sin tumbar la copia', badPhotos.ok && badPhotos.photos === 2);
  check(
    'y se avisa de cuantas se descartaron',
    badPhotos.warnings.some((w) => w.includes('2')),
    badPhotos.warnings.join(' | '),
  );

  /* ── formato antiguo ── */
  line('Copias de seguridad: formato antiguo');

  const old = JSON.stringify({
    app: 'BodyFit Prep',
    schema: 1,
    exportedAt: '2026-01-15T08:00:00.000Z',
    data: sample,
  });
  const legacy = parseBackup(old);
  check('una copia del formato 1 se sigue leyendo', legacy.ok, legacy.errors.join(' | '));
  check('se migra al formato actual', legacy.file?.format === BACKUP_FORMAT);
  check('conserva todas las colecciones', legacy.collections.length === 3);
  check(
    'avisa de que ese formato no llevaba fotos',
    legacy.warnings.some((w) => w.includes('fotos')),
    legacy.warnings.join(' | '),
  );
  check('no inventa un checksum que no existia', legacy.checksumOk === null);

  /* ── recuento de registros ── */
  check('countEntries suma los arrays del estado', countEntries(sample.body) === 4);
  check('countEntries tolera basura', countEntries(null) === 0 && countEntries('x') === 0);

  /* ── recordatorios ── */
  line('Copias de seguridad: recordatorio');

  const now = new Date('2026-07-31T12:00:00.000Z');
  check(
    'no molesta a un usuario recien instalado',
    backupDue({ lastBackupAt: null, everyDays: 7, entries: 2, now }) === false,
  );
  check(
    'avisa si nunca hubo copia y ya hay datos',
    backupDue({ lastBackupAt: null, everyDays: 7, entries: 40, now }) === true,
  );
  check(
    'no avisa si la copia es reciente',
    backupDue({ lastBackupAt: '2026-07-29T12:00:00.000Z', everyDays: 7, entries: 40, now }) === false,
  );
  check(
    'avisa cuando se pasa el intervalo',
    backupDue({ lastBackupAt: '2026-07-20T12:00:00.000Z', everyDays: 7, entries: 40, now }) === true,
  );
  check('daysSince cuenta bien', daysSince('2026-07-24T12:00:00.000Z', now) === 7);
  check('daysSince tolera una fecha invalida', daysSince('no-es-fecha', now) === null);

  /* ── formato legible ── */
  check('fmtBytes en KB', fmtBytes(2048) === '2 KB');
  check('fmtBytes en MB', fmtBytes(5 * 1024 * 1024) === '5.0 MB');
  check('fmtBytes con cero', fmtBytes(0) === '0 KB');
}
