/**
 * El adaptador de Supabase, contra un servidor de verdad.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE NO BASTA CON EL SERVIDOR SIMULADO
 *
 * `scripts/smoke-sync-world.mts` prueba que las REGLAS convergen: catorce dias,
 * dos dispositivos, ni un dato perdido. Lo hace contra un servidor en memoria
 * que se comporta como yo creo que se comporta Postgres.
 *
 * Esta auditoria prueba lo otro: que PostgREST, GoTrue y plpgsql se comportan
 * como yo creo. Son cosas distintas y la segunda solo se puede saber
 * conectandose.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   node scripts/audit-adapter.mjs
 *
 * Necesita lo mismo que `audit-rls.mjs`. Nunca usa `service_role`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

function loadEnv() {
  const env = { ...process.env };
  const file = resolve(process.cwd(), '.env.local');
  if (existsSync(file)) {
    for (const l of readFileSync(file, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const URL_BASE = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL_BASE || !ANON || !env.RLS_TEST_EMAIL_A) {
  console.error('\nFalta configuracion. Ver scripts/audit-rls.mjs.\n');
  process.exit(2);
}

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
  if (!res.ok) throw new Error(`login fallido: ${res.status}`);
  const d = await res.json();
  return { token: d.access_token, refresh: d.refresh_token, userId: d.user.id };
}

async function rpc(fn, args, token) {
  const headers = { apikey: ANON, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args ?? {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* error en texto plano */
  }
  return { status: res.status, ok: res.ok, json, text };
}

const DEVICE = randomUUID();
const HLC_BASE = 1_754_923_000_000;
let counter = 0;

/** Un HLC valido y creciente, con el mismo formato que emite el cliente. */
function hlc(offset = 0) {
  counter++;
  const wall = String(HLC_BASE + offset + counter).padStart(18, '0');
  return `${wall}-${String(counter).padStart(5, '0')}-${DEVICE}`;
}

function op(overrides = {}) {
  return {
    operationId: randomUUID(),
    userId: null,
    deviceId: DEVICE,
    collection: 'training',
    entityId: randomUUID(),
    operationType: 'upsert',
    payload: { peso: 100, reps: 8 },
    hlc: hlc(),
    createdAt: new Date().toISOString(),
    schemaVersion: 3,
    clientVersion: 'auditoria',
    checksum: 'auditoria',
    ...overrides,
  };
}

/* ══════════════════════════════════════════════════════════════ programa ══ */

const a = await signIn(env.RLS_TEST_EMAIL_A, env.RLS_TEST_PASSWORD_A);
const b = await signIn(env.RLS_TEST_EMAIL_B, env.RLS_TEST_PASSWORD_B);
console.log(`\nDispositivo de prueba: ${DEVICE}`);

/* ─────────────────────────────────────────────────────────── healthCheck ── */
line('healthCheck');
{
  const r = await rpc('sync_health', {}, a.token);
  check('responde y declara su esquema', r.ok && r.json?.[0]?.server_schema > 0,
    `esquema ${r.json?.[0]?.server_schema}`);
}

/* ────────────────────────────────────────────────────────── registerDevice ── */
line('registerDevice');
{
  const r = await rpc('register_device', {
    p_device_id: DEVICE, p_label: 'auditoria', p_platform: 'node', p_client_version: '2.1.0',
  }, a.token);
  check('registra el dispositivo', r.ok, r.ok ? '' : r.text.slice(0, 120));

  // Idempotente: llamarlo dos veces no duplica ni falla
  const r2 = await rpc('register_device', {
    p_device_id: DEVICE, p_label: 'auditoria', p_platform: 'node', p_client_version: '2.1.0',
  }, a.token);
  check('llamarlo dos veces no falla', r2.ok);
}

/* ────────────────────────────────────────────────────────────── cursores ── */
line('Cursores');
{
  const inicial = await rpc('sync_get_cursor', { p_device_id: DEVICE }, a.token);
  check('un dispositivo nuevo empieza en 0', inicial.ok && Number(inicial.json) === 0);

  const inexistente = await rpc('sync_get_cursor', { p_device_id: randomUUID() }, a.token);
  check('un dispositivo desconocido devuelve 0, no error', inexistente.ok && Number(inexistente.json) === 0);

  await rpc('sync_set_cursor', { p_device_id: DEVICE, p_cursor: 50 }, a.token);
  const tras = await rpc('sync_get_cursor', { p_device_id: DEVICE }, a.token);
  check('guarda el cursor', tras.ok && Number(tras.json) === 50);

  /*
   * Un cursor que retrocede solo obliga a releer —la idempotencia lo absorbe—
   * pero guardarlo hacia atras dejaria al dispositivo repitiendo el mismo
   * trabajo en cada arranque.
   */
  await rpc('sync_set_cursor', { p_device_id: DEVICE, p_cursor: 10 }, a.token);
  const atras = await rpc('sync_get_cursor', { p_device_id: DEVICE }, a.token);
  check('el cursor no retrocede al guardarlo', atras.ok && Number(atras.json) === 50);

  await rpc('sync_set_cursor', { p_device_id: DEVICE, p_cursor: 0 }, a.token);
}

/* ────────────────────────────────────────────────────────── pushOperations ── */
line('pushOperations');
{
  const vacio = await rpc('sync_push', { p_ops: [] }, a.token);
  check('un lote vacio no es un error', vacio.ok, vacio.ok ? '' : vacio.text.slice(0, 100));

  const una = op();
  const r1 = await rpc('sync_push', { p_ops: [una] }, a.token);
  check('acepta una operacion', r1.ok && r1.json?.[0]?.status === 'applied', r1.json?.[0]?.status);

  /* Duplicado: la misma operacion otra vez */
  const r2 = await rpc('sync_push', { p_ops: [una] }, a.token);
  check(
    'la misma operacion otra vez es duplicate, no error',
    r2.ok && r2.json?.[0]?.status === 'duplicate',
    r2.json?.[0]?.status,
  );

  /* Esquema por encima del servidor: cliente por delante */
  const futura = await rpc('sync_push', { p_ops: [op({ schemaVersion: 99 })] }, a.token);
  check(
    'rechaza un esquema mas nuevo que el servidor',
    futura.ok && futura.json?.[0]?.status === 'rejected',
    futura.json?.[0]?.reason?.slice(0, 60),
  );

  /* Esquema por debajo del minimo */
  const vieja = await rpc('sync_push', { p_ops: [op({ schemaVersion: 1 })] }, a.token);
  check(
    'rechaza un esquema por debajo del minimo',
    vieja.ok && vieja.json?.[0]?.status === 'rejected',
    vieja.json?.[0]?.reason?.slice(0, 60),
  );

  /* Usuario incorrecto */
  const ajena = await rpc('sync_push', { p_ops: [op({ userId: b.userId })] }, a.token);
  check(
    'rechaza una operacion de otro usuario',
    ajena.ok && ajena.json?.[0]?.status === 'rejected',
    ajena.json?.[0]?.reason?.slice(0, 60),
  );

  /* Operacion invalida: sin campos obligatorios */
  const rota = await rpc('sync_push', { p_ops: [{ operationId: 'no-es-uuid' }] }, a.token);
  check('una operacion malformada no tumba el servidor', rota.status < 500, `HTTP ${rota.status}`);

  /* Lote por encima del limite */
  const enorme = await rpc('sync_push', { p_ops: Array.from({ length: 101 }, () => op()) }, a.token);
  check('rechaza un lote por encima de 100', !enorme.ok, `HTTP ${enorme.status}`);
}

/* ──────────────────────────────────────────────────── 500 operaciones ── */
line('500 operaciones en lotes de 100');
{
  const todas = Array.from({ length: 500 }, () => op());
  let aplicadas = 0;
  const t0 = Date.now();

  for (let i = 0; i < todas.length; i += 100) {
    const lote = todas.slice(i, i + 100);
    const r = await rpc('sync_push', { p_ops: lote }, a.token);
    if (!r.ok) {
      check(`el lote ${i / 100 + 1} se acepta`, false, r.text.slice(0, 120));
      break;
    }
    aplicadas += r.json.filter((x) => x.status === 'applied').length;
  }
  const ms = Date.now() - t0;
  check('las 500 se aplican', aplicadas === 500, `${aplicadas}/500 en ${ms} ms`);

  /* Reenviar el lote entero: todo duplicate, nada nuevo */
  const reenvio = await rpc('sync_push', { p_ops: todas.slice(0, 100) }, a.token);
  const todosDuplicados = reenvio.ok && reenvio.json.every((x) => x.status === 'duplicate');
  check('reenviar un lote ya aceptado no duplica nada', todosDuplicados);
}

/* ────────────────────────────────────────────────────────── pullOperations ── */
line('pullOperations');
{
  const p1 = await rpc('sync_pull', { p_cursor: 0, p_limit: 100 }, a.token);
  check('devuelve una pagina', p1.ok && Array.isArray(p1.json) && p1.json.length > 0,
    `${p1.json?.length} operaciones`);

  const seqs = (p1.json ?? []).map((r) => Number(r.seq));
  const ordenadas = seqs.every((s, i) => i === 0 || s > seqs[i - 1]);
  check('vienen ordenadas por seq y sin repetir', ordenadas);

  /* Paginacion: la segunda pagina continua donde acabo la primera */
  const ultimo = seqs[seqs.length - 1];
  const p2 = await rpc('sync_pull', { p_cursor: ultimo, p_limit: 100 }, a.token);
  const sinSolape = (p2.json ?? []).every((r) => Number(r.seq) > ultimo);
  check('la siguiente pagina no repite nada', sinSolape);

  /* Cursor por delante de todo */
  const vacio = await rpc('sync_pull', { p_cursor: 999999999, p_limit: 100 }, a.token);
  check('un cursor por delante devuelve vacio, no error', vacio.ok && vacio.json?.length === 0);

  /* Cursor negativo */
  const negativo = await rpc('sync_pull', { p_cursor: -5, p_limit: 10 }, a.token);
  check('un cursor negativo no rompe nada', negativo.ok);

  /* Aislamiento entre usuarios */
  const deB = await rpc('sync_pull', { p_cursor: 0, p_limit: 500 }, b.token);
  const contaminado = (deB.json ?? []).some((r) => r.device_id === DEVICE);
  check('B no recibe las operaciones de A', !contaminado, contaminado ? 'FUGA ENTRE USUARIOS' : '');

  /* Limite superior */
  const grande = await rpc('sync_pull', { p_cursor: 0, p_limit: 5000 }, a.token);
  check('el limite se recorta a 500', grande.ok && (grande.json?.length ?? 0) <= 500,
    `${grande.json?.length}`);
}

/* ─────────────────────────────────────────────── token caducado y refresco ── */
line('Sesion');
{
  const malo = await rpc('sync_health', {}, 'token.invalido.aqui');
  check('un token invalido se rechaza', !malo.ok, `HTTP ${malo.status}`);

  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ refresh_token: a.refresh }),
  });
  check('el token se puede renovar', res.ok, `HTTP ${res.status}`);
}

/* ──────────────────────────────────────────────────── perdida de red ── */
line('Perdida de red');
{
  /*
   * Un host que no existe simula el corte. Lo que importa no es el error, sino
   * que sea un fallo de transporte —que el motor reintenta— y no una respuesta
   * del servidor que se confundiria con un rechazo definitivo.
   */
  let fallo = null;
  try {
    await fetch('https://este-host-no-existe.bodyfit.invalid/rest/v1/rpc/sync_health', {
      method: 'POST',
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    fallo = err;
  }
  check('un corte de red produce un error de transporte, no una respuesta', fallo !== null);
}

console.log(
  `\n${failures === 0 ? 'AUDITORIA DEL ADAPTADOR SUPERADA' : `${failures} COMPROBACIONES FALLIDAS`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
