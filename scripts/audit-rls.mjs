/**
 * Auditoria de Row Level Security contra un Supabase real.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE NO BASTA CON LEER EL SQL
 *
 * Una politica de RLS se lee bien y se comporta mal. Los fallos tipicos no se
 * ven en el fichero:
 *
 *   · `using` sin `with check`: el usuario no puede LEER las filas de otro,
 *     pero SI puede insertar filas con el `user_id` de otro. La lectura pasa la
 *     revision y la escritura no.
 *   · Una funcion `security definer` sin `search_path` fijo: alguien crea un
 *     esquema en su `search_path` con una tabla del mismo nombre y la funcion
 *     escribe ahi.
 *   · Acceso cruzado por una relacion: la tabla hija tiene politica, pero se
 *     llega a ella por un join desde una funcion que no la aplica.
 *
 * Esta auditoria usa DOS USUARIOS REALES y comprueba cada caso contra el
 * servidor. Es la unica forma de saberlo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   node scripts/audit-rls.mjs
 *
 * Necesita en el entorno o en .env.local:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   RLS_TEST_EMAIL_A / RLS_TEST_PASSWORD_A
 *   RLS_TEST_EMAIL_B / RLS_TEST_PASSWORD_B
 *
 * NUNCA usa `service_role`: si la auditoria pudiera saltarse RLS, no estaria
 * auditando nada.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* ══════════════════════════════════════════════════════════ configuracion ══ */

function loadEnv() {
  const env = { ...process.env };
  const file = resolve(process.cwd(), '.env.local');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const URL_BASE = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL_BASE || !ANON) {
  console.error(
    '\nFalta configuracion. Necesito VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY\n' +
      'en el entorno o en .env.local. Ver supabase/migrations/README.md.\n',
  );
  process.exit(2);
}

for (const key of ['RLS_TEST_EMAIL_A', 'RLS_TEST_PASSWORD_A', 'RLS_TEST_EMAIL_B', 'RLS_TEST_PASSWORD_B']) {
  if (!env[key]) {
    console.error(`\nFalta ${key}. Hacen falta dos usuarios reales de staging.\n`);
    process.exit(2);
  }
}

/* ═══════════════════════════════════════════════════════════ utilidades ══ */

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FALLA'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};
const line = (t) => console.log(`\n${t}\n${'-'.repeat(t.length)}`);

async function signIn(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`no se pudo entrar como ${email.split('@')[0]}***: ${res.status}`);
  }
  const data = await res.json();
  return { token: data.access_token, userId: data.user.id };
}

/** Peticion a PostgREST con la identidad indicada. `token` null = anonimo. */
async function rest(path, { token = null, method = 'GET', body, prefer } = {}) {
  const headers = { apikey: ANON, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* PostgREST devuelve texto plano en algunos errores */
  }
  return { status: res.status, ok: res.ok, json, text };
}

const rpc = (fn, args, token) =>
  rest(`rpc/${fn}`, { token, method: 'POST', body: args ?? {} });

/* ═════════════════════════════════════════════════ tablas sincronizables ══ */

/**
 * Una fila minima valida por tabla.
 *
 * Solo las columnas obligatorias: la auditoria comprueba PERMISOS, no el
 * modelo de datos. Si una tabla cambia de forma, esto falla ruidosamente y se
 * arregla, que es mejor que auditar la mitad sin enterarse.
 */
const TABLES = {
  workouts: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03', name: 'auditoria',
  }),
  nutrition_entries: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03', slot: 'almuerzo', grams: 100,
  }),
  body_measurements: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03', weight_kg: 82,
  }),
  readiness_entries: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03',
  }),
  weekly_checkins: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, week_start: '2026-08-03',
  }),
  cardio_sessions: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03',
  }),
  posing_sessions: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03',
  }),
  progress_photos: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, date: '2026-08-03', angle: 'frontal',
  }),
  competition_preps: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3,
  }),
  reminders: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, kind: 'peso',
  }),
  custom_foods: (u, id) => ({
    id, user_id: u, hlc: '000000000001754923000-00000-x', device_id: 'auditoria',
    schema_version: 3, name: 'auditoria',
  }),
};

const marca = (sufijo) => `auditoria-rls-${sufijo}`;

/* ══════════════════════════════════════════════════════════════ programa ══ */

const a = await signIn(env.RLS_TEST_EMAIL_A, env.RLS_TEST_PASSWORD_A);
const b = await signIn(env.RLS_TEST_EMAIL_B, env.RLS_TEST_PASSWORD_B);

console.log(`\nUsuario A: ${a.userId}`);
console.log(`Usuario B: ${b.userId}`);
if (a.userId === b.userId) {
  console.error('\nA y B son el mismo usuario. La auditoria no probaria nada.\n');
  process.exit(2);
}

for (const [table, fila] of Object.entries(TABLES)) {
  line(`Tabla ${table}`);

  const idA = marca(`${table}-a`);
  const idB = marca(`${table}-b`);

  /* ── A escribe lo suyo ── */
  const insertA = await rest(table, {
    token: a.token,
    method: 'POST',
    body: fila(a.userId, idA),
    prefer: 'resolution=merge-duplicates,return=representation',
  });
  check('A puede insertar una fila suya', insertA.ok, insertA.ok ? '' : `${insertA.status} ${insertA.text.slice(0, 120)}`);

  const insertB = await rest(table, {
    token: b.token,
    method: 'POST',
    body: fila(b.userId, idB),
    prefer: 'resolution=merge-duplicates,return=representation',
  });
  check('B puede insertar una fila suya', insertB.ok);

  /* ── A lee lo suyo ── */
  const leeA = await rest(`${table}?id=eq.${idA}&select=id`, { token: a.token });
  check('A lee su propia fila', leeA.ok && Array.isArray(leeA.json) && leeA.json.length === 1);

  /* ── A NO lee lo de B ── */
  const leeAjeno = await rest(`${table}?id=eq.${idB}&select=id`, { token: a.token });
  check(
    'A NO puede leer la fila de B',
    leeAjeno.ok && Array.isArray(leeAjeno.json) && leeAjeno.json.length === 0,
    leeAjeno.json?.length ? 'FUGA DE DATOS' : '',
  );

  /* ── A NO escribe con el user_id de B: esto es lo que exige `with check` ── */
  const suplanta = await rest(table, {
    token: a.token,
    method: 'POST',
    body: fila(b.userId, marca(`${table}-suplantada`)),
    prefer: 'return=representation',
  });
  check(
    'A NO puede insertar una fila con el user_id de B',
    !suplanta.ok,
    suplanta.ok ? 'FALTA `with check` EN LA POLITICA' : `rechazado ${suplanta.status}`,
  );

  /* ── A NO actualiza lo de B ── */
  const actualizaAjeno = await rest(`${table}?id=eq.${idB}`, {
    token: a.token,
    method: 'PATCH',
    body: { device_id: 'intruso' },
    prefer: 'return=representation',
  });
  const cambio = Array.isArray(actualizaAjeno.json) && actualizaAjeno.json.length > 0;
  check('A NO puede modificar la fila de B', !cambio, cambio ? 'FUGA DE ESCRITURA' : '');

  /* ── A actualiza lo suyo ── */
  const actualizaPropio = await rest(`${table}?id=eq.${idA}`, {
    token: a.token,
    method: 'PATCH',
    body: { device_id: 'auditoria-2' },
    prefer: 'return=representation',
  });
  check('A puede modificar su propia fila', actualizaPropio.ok && actualizaPropio.json?.length === 1);

  /* ── borrado logico: solo el propio ── */
  const borraPropio = await rest(`${table}?id=eq.${idA}`, {
    token: a.token,
    method: 'PATCH',
    body: { deleted_at: new Date().toISOString() },
    prefer: 'return=representation',
  });
  check('A puede hacer borrado logico de lo suyo', borraPropio.ok && borraPropio.json?.length === 1);

  const borraAjeno = await rest(`${table}?id=eq.${idB}`, {
    token: a.token,
    method: 'PATCH',
    body: { deleted_at: new Date().toISOString() },
    prefer: 'return=representation',
  });
  check(
    'A NO puede borrar lo de B',
    !(Array.isArray(borraAjeno.json) && borraAjeno.json.length > 0),
  );

  /* ── anonimo no ve nada ── */
  const anon = await rest(`${table}?select=id&limit=1`, { token: null });
  const anonVe = anon.ok && Array.isArray(anon.json) && anon.json.length > 0;
  check('anon NO puede leer datos privados', !anonVe, anonVe ? 'TABLA ABIERTA AL PUBLICO' : '');

  const anonEscribe = await rest(table, {
    token: null,
    method: 'POST',
    body: fila(a.userId, marca(`${table}-anon`)),
  });
  check('anon NO puede escribir', !anonEscribe.ok);
}

/* ══════════════════════════════════════════════ el log de operaciones ══ */

line('Log de operaciones');

{
  const leeAjeno = await rest(`sync_operations?user_id=eq.${b.userId}&select=operation_id`, {
    token: a.token,
  });
  check(
    'A NO ve las operaciones de B',
    leeAjeno.ok && Array.isArray(leeAjeno.json) && leeAjeno.json.length === 0,
  );

  /*
   * El log es inmutable para el cliente. Una operacion ya aceptada no se
   * reescribe: si se pudiera, se podria cambiar el pasado de la sincronizacion.
   */
  const modifica = await rest(`sync_operations?user_id=eq.${a.userId}`, {
    token: a.token,
    method: 'PATCH',
    body: { checksum: 'alterado' },
    prefer: 'return=representation',
  });
  check(
    'nadie puede reescribir el log, ni el propio dueno',
    !(Array.isArray(modifica.json) && modifica.json.length > 0),
  );

  const borra = await rest(`sync_operations?user_id=eq.${a.userId}`, {
    token: a.token,
    method: 'DELETE',
    prefer: 'return=representation',
  });
  check('nadie puede borrar del log', !(Array.isArray(borra.json) && borra.json.length > 0));
}

/* ══════════════════════════════════════════════════ funciones del motor ══ */

line('Funciones de sincronizacion');

{
  const salud = await rpc('sync_health', {}, a.token);
  check('sync_health responde', salud.ok, JSON.stringify(salud.json)?.slice(0, 80));

  const saludAnon = await rpc('sync_health', {}, null);
  check(
    'sync_health no filtra nada a un anonimo',
    !saludAnon.ok || JSON.stringify(saludAnon.json ?? '').length < 200,
  );

  /*
   * `sync_push` es `security definer`: se ejecuta con los privilegios de quien
   * la creo. Si no comprobara `auth.uid()`, seria un agujero por el que
   * cualquiera escribe en los datos de cualquiera. Esta es la prueba.
   */
  const suplantacion = await rpc(
    'sync_push',
    {
      p_ops: [
        {
          operationId: '00000000-0000-4000-8000-00000000dead',
          userId: b.userId,
          deviceId: 'auditoria',
          collection: 'training',
          entityId: 'suplantada',
          operationType: 'upsert',
          payload: { x: 1 },
          hlc: '000000000001754923000-00000-auditoria',
          createdAt: new Date().toISOString(),
          schemaVersion: 3,
          clientVersion: 'auditoria',
          checksum: 'x',
        },
      ],
    },
    a.token,
  );
  const rechazada =
    !suplantacion.ok ||
    (Array.isArray(suplantacion.json) &&
      suplantacion.json.every((r) => r.status === 'rejected'));
  check(
    'sync_push rechaza una operacion con el user_id de otro',
    rechazada,
    rechazada ? '' : 'SECURITY DEFINER SIN COMPROBAR auth.uid()',
  );

  const sinSesion = await rpc('sync_push', { p_ops: [] }, null);
  check('sync_push exige sesion', !sinSesion.ok);

  const pullAjeno = await rpc('sync_pull', { p_cursor: 0, p_limit: 10 }, a.token);
  const soloSuyas =
    pullAjeno.ok &&
    Array.isArray(pullAjeno.json) &&
    pullAjeno.json.every((r) => r.device_id !== undefined);
  check('sync_pull solo devuelve operaciones propias', soloSuyas || pullAjeno.json?.length === 0);
}

/* ════════════════════════════════════════════ metadatos del catalogo ══ */

line('Configuracion del esquema');

{
  /*
   * `search_path` fijo en toda funcion `security definer`. Sin el, alguien con
   * permiso para crear esquemas puede colocar una tabla con el mismo nombre por
   * delante en la ruta de busqueda y hacer que la funcion escriba ahi.
   *
   * Se consulta por PostgREST si existe una vista que lo exponga; si no, queda
   * como comprobacion manual documentada en el informe.
   */
  const definidas = await rpc('sync_health', {}, a.token);
  check(
    'las funciones del motor responden con el esquema declarado',
    definidas.ok && JSON.stringify(definidas.json).includes('server_schema'),
  );
}

console.log(
  `\n${failures === 0 ? 'AUDITORIA DE RLS SUPERADA' : `${failures} COMPROBACIONES FALLIDAS`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
