/**
 * Guardia del registro de colecciones y del gestor de versiones.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUE PROTEGE
 *
 * Que nadie pueda crear una coleccion nueva sin registrarla. El sistema de
 * tipos ya impide llamar a `persisted()` con una clave desconocida, pero eso
 * solo cubre el camino previsto: quedan `localStorage.setItem` directos,
 * claves inventadas en un servicio, o alguien que amplie el registro y se
 * olvide de escribir el store.
 *
 * Estas comprobaciones leen el codigo fuente de verdad y lo comparan con el
 * registro. Si divergen, fallan aqui y no meses despues, cuando la
 * sincronizacion se deje una coleccion fuera en silencio.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BACKUP_COLLECTIONS,
  COLLECTION_KEYS,
  COLLECTION_REGISTRY,
  MIGRATED_COLLECTIONS,
  STORAGE_PREFIX,
  SYNC_COLLECTIONS,
  collectionFromStorageKey,
  isCollectionKey,
  storageKey,
} from '@bodyfit/domain/collections';
import {
  APP_SCHEMA_VERSION,
  BACKUP_FORMAT_VERSION,
  MIN_SUPPORTED_SCHEMA,
  canRollback,
  checkCompatibility,
  checksum,
  isReadable,
  versionOf,
  versionRegistryProblems,
  versionSummary,
} from '@bodyfit/domain/versioning';

const SRC = resolve(process.cwd(), 'src');

function read(relative: string): string {
  return readFileSync(resolve(SRC, relative), 'utf8');
}

function filesIn(dir: string): string[] {
  return readdirSync(resolve(SRC, dir))
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => `${dir}/${f}`);
}

/** Todos los .ts y .tsx bajo src/, recursivo. */
function allSources(dir = ''): string[] {
  const full = resolve(SRC, dir);
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...allSources(rel));
    else if (/\.tsx?$/.test(entry.name)) out.push(rel);
  }
  return out;
}

export function runCollectionTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  /* ═══════════════════════════════ D1 · registro contra codigo real ═══ */
  line('Colecciones: el registro contra el codigo');

  console.log(`   ${COLLECTION_KEYS.length} colecciones registradas`);

  /*
   * Que colecciones persiste el codigo de verdad. Se lee el fuente en vez de
   * importar los stores porque importarlos arrastraria React y zustand a un
   * proceso de Node.
   */
  const persistedInCode = new Set<string>();
  for (const file of filesIn('store')) {
    for (const m of read(file).matchAll(/persisted<[^>]*>\(\s*'([^']+)'/g)) {
      persistedInCode.add(m[1]);
    }
  }

  const sinRegistrar = [...persistedInCode].filter((k) => !isCollectionKey(k));
  check(
    'ningun store persiste una coleccion sin registrar',
    sinRegistrar.length === 0,
    sinRegistrar.length ? `sin registrar: ${sinRegistrar.join(', ')}` : `${persistedInCode.size} stores`,
  );

  const sinStore = COLLECTION_KEYS.filter((k) => !persistedInCode.has(k));
  check(
    'ninguna coleccion registrada se quedo sin store',
    sinStore.length === 0,
    sinStore.join(', '),
  );

  /*
   * Escrituras directas al almacenamiento saltandose el adaptador.
   *
   * El registro de errores y el modo seguro escriben a proposito con su propio
   * prefijo `bodyfit:` (sin version) porque tienen que funcionar cuando el
   * resto ha fallado. Cualquier otra cosa con el prefijo versionado es un
   * puente por debajo del registro.
   */
  const PERMITIDOS = [
    'domain/collections.ts', // aqui se define el prefijo
    'services/errorLog.ts', // escribe con su propio prefijo, sin version
    'services/storage/localAdapter.ts', // es quien aplica el prefijo
  ];

  /** Quita comentarios: mencionar la clave al explicar algo no es construirla. */
  const sinComentarios = (text: string): string =>
    text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');

  const escrituras: string[] = [];
  for (const file of allSources()) {
    if (PERMITIDOS.includes(file)) continue;
    const code = sinComentarios(read(file));
    if (code.includes(`'${STORAGE_PREFIX}`) || code.includes(`\`${STORAGE_PREFIX}`)) {
      escrituras.push(file);
    }
  }
  check(
    'nadie construye claves de almacenamiento a mano',
    escrituras.length === 0,
    escrituras.join(', '),
  );

  /* ── el registro es coherente consigo mismo ── */
  const migracionesDeclaradas = new Set(MIGRATED_COLLECTIONS);
  const migracionesEscritas = new Set<string>();
  for (const m of read('store/migrations.ts').matchAll(/export const (\w+)Migrations/g)) {
    // profileMigrations -> profile ; checkinMigrations -> checkins
    migracionesEscritas.add(m[1] === 'checkin' ? 'checkins' : m[1]);
  }

  const declaradasSinEscribir = [...migracionesDeclaradas].filter((k) => !migracionesEscritas.has(k));
  check(
    'toda coleccion que declara migraciones las tiene escritas',
    declaradasSinEscribir.length === 0,
    declaradasSinEscribir.join(', '),
  );

  const escritasSinDeclarar = [...migracionesEscritas].filter(
    (k) => isCollectionKey(k) && !migracionesDeclaradas.has(k),
  );
  check(
    'toda migracion escrita esta declarada en el registro',
    escritasSinDeclarar.length === 0,
    escritasSinDeclarar.join(', '),
  );

  /* ── las migraciones estan enganchadas de verdad ── */
  const sinEnganchar: string[] = [];
  for (const key of MIGRATED_COLLECTIONS) {
    const store = filesIn('store').find((f) => read(f).includes(`persisted<`) && read(f).includes(`'${key}'`));
    if (!store) {
      sinEnganchar.push(`${key}: sin store`);
      continue;
    }
    if (!read(store).includes('migrations:')) sinEnganchar.push(`${key}: no pasa migrations`);
  }
  check(
    'las colecciones con migraciones las conectan al persistir',
    sinEnganchar.length === 0,
    sinEnganchar.join(' | '),
  );

  /* ── subconjuntos coherentes ── */
  check(
    'todo lo que se sincroniza entra tambien en la copia',
    SYNC_COLLECTIONS.every((k) => BACKUP_COLLECTIONS.includes(k)),
    SYNC_COLLECTIONS.filter((k) => !BACKUP_COLLECTIONS.includes(k)).join(', '),
  );
  check(
    'lo marcado como propio del dispositivo no se sincroniza',
    COLLECTION_KEYS.filter((k) => COLLECTION_REGISTRY[k].device).every(
      (k) => !COLLECTION_REGISTRY[k].sync,
    ),
  );

  /* ── claves de almacenamiento ── */
  check('storageKey compone con el prefijo', storageKey('profile') === `${STORAGE_PREFIX}profile`);
  check(
    'collectionFromStorageKey deshace storageKey',
    COLLECTION_KEYS.every((k) => collectionFromStorageKey(storageKey(k)) === k),
  );
  check(
    'una clave ajena no se confunde con una coleccion',
    collectionFromStorageKey('otra-app:profile') === null &&
      collectionFromStorageKey(`${STORAGE_PREFIX}inventada`) === null,
  );

  /* ═══════════════════════════════════ D2 · gestor de versiones ═══════ */
  line('Versionado: una sola autoridad');

  const problemas = versionRegistryProblems();
  check('el registro de versiones es coherente', problemas.length === 0, problemas.join(' | '));

  check(
    'toda coleccion tiene version',
    COLLECTION_KEYS.every((k) => Number.isInteger(versionOf(k)) && versionOf(k) >= 1),
  );
  check(
    'las colecciones sin migraciones se quedan en la version 1',
    COLLECTION_KEYS.filter((k) => !COLLECTION_REGISTRY[k].migrations).every(
      (k) => versionOf(k) === 1,
    ),
    'evita disparar migraciones que no existen',
  );

  /* ── compatibilidad ── */
  check('la version actual es compatible consigo misma', checkCompatibility(APP_SCHEMA_VERSION).kind === 'igual');
  check(
    'una version anterior soportada se migra',
    checkCompatibility(APP_SCHEMA_VERSION - 1).kind === 'migrar',
  );
  check(
    'una version futura se rechaza',
    checkCompatibility(APP_SCHEMA_VERSION + 1).kind === 'demasiado-nueva',
  );
  check('una version imposible se rechaza', checkCompatibility(0).kind === 'demasiado-antigua');
  check(
    'isReadable acepta lo migrable y rechaza lo futuro',
    isReadable(MIN_SUPPORTED_SCHEMA) && !isReadable(APP_SCHEMA_VERSION + 1),
  );

  /* ── rollback ── */
  check('se permite restaurar una copia mas antigua', canRollback(MIN_SUPPORTED_SCHEMA));
  check('no se permite restaurar una copia mas nueva', !canRollback(APP_SCHEMA_VERSION + 1));
  check('no se permite restaurar por debajo del minimo', !canRollback(MIN_SUPPORTED_SCHEMA - 1));

  /* ── checksum ── */
  check(
    'el checksum no depende del orden de las claves',
    checksum({ a: 1, b: { c: 2, d: 3 } }) === checksum({ b: { d: 3, c: 2 }, a: 1 }),
  );
  check('el checksum cambia si cambia un valor', checksum({ a: 1 }) !== checksum({ a: 2 }));

  /* ── una sola numeracion en todo el proyecto ── */
  const numeracionesViejas: string[] = [];
  for (const file of allSources()) {
    const text = read(file);
    if (file !== 'domain/versioning.ts' && /\bSTORE_VERSION\b/.test(text)) {
      numeracionesViejas.push(`${file}: STORE_VERSION`);
    }
    if (file !== 'domain/versioning.ts' && /\bexport const SCHEMA_VERSION\b/.test(text)) {
      numeracionesViejas.push(`${file}: SCHEMA_VERSION`);
    }
  }
  check(
    'no quedan numeraciones de esquema paralelas',
    numeracionesViejas.length === 0,
    numeracionesViejas.join(' | '),
  );

  /* ═════════════════ el contrato de sincronizacion se usa entero ══════ */
  line('Contrato de sincronizacion');

  /*
   * Todo metodo declarado en `SyncAdapter` tiene que invocarlo alguien fuera de
   * los propios adaptadores.
   *
   * `registerDevice` estuvo escrito, con su funcion SQL, con su prueba de
   * auditoria en verde... y sin que la aplicacion lo llamara nunca. Se descubrio
   * mirando la tabla `devices` vacia despues de un inicio de sesion real.
   *
   * Una auditoria que prueba un metodo demuestra que el metodo FUNCIONA, no que
   * alguien lo USE. Son cosas distintas y por ese hueco se colo este.
   */
  const contrato = read('services/sync/adapters/types.ts');
  const metodos = [...contrato.matchAll(/^\s{2}(\w+)\(/gm)]
    .map((m) => m[1])
    .filter((name) => name !== 'readonly');

  const consumidores = allSources()
    .filter((f) => f.startsWith('services/sync/') && !f.includes('/adapters/'))
    .concat(allSources().filter((f) => f.startsWith('features/') || f.startsWith('store/')))
    .map((f) => read(f))
    .join('\n');

  const sinUsar = metodos.filter((m) => !consumidores.includes(`${m}(`));
  check(
    'todo metodo del adaptador lo llama alguien',
    sinUsar.length === 0,
    sinUsar.length ? `nadie invoca: ${sinUsar.join(', ')}` : `${metodos.length} metodos`,
  );

  const summary = versionSummary();
  check(
    'el resumen de versiones cubre todas las colecciones',
    summary.collections.length === COLLECTION_KEYS.length,
  );
  check(
    'el formato de copia y el esquema son numeros distintos y declarados',
    Number.isInteger(BACKUP_FORMAT_VERSION) && Number.isInteger(APP_SCHEMA_VERSION),
    `esquema ${APP_SCHEMA_VERSION} · formato de copia ${BACKUP_FORMAT_VERSION}`,
  );
}
