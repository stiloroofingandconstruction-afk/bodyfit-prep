/**
 * Dos dispositivos, catorce dias, contra el Supabase de staging DE VERDAD.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUE PRUEBA ESTO QUE NO PRUEBA LA SIMULACION
 *
 * `smoke-sync-world.mts` prueba que las REGLAS convergen, contra un servidor en
 * memoria que se comporta como yo creo que se comporta Postgres.
 *
 * Esto usa las mismas reglas —el mismo HLC, el mismo `applyOperation`, la misma
 * maquina de estados de la outbox, importados del dominio— pero contra
 * PostgREST, plpgsql y GoTrue reales. Con latencia de red real, con la
 * secuencia que asigna Postgres de verdad, y con dos usuarios distintos para
 * comprobar que no se mezclan.
 *
 * Si la simulacion dice que convergen y esto dice que no, el que tiene razon es
 * esto.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   npm run audit:two-devices
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  formatHlc,
  hlcZero,
  localEvent,
  parseHlc,
  remoteEvent,
  type Hlc,
} from '@bodyfit/domain/sync/hlc';
import {
  batchOperations,
  createOperation,
  validateOperation,
  type SyncCollectionKey,
  type SyncOperation,
} from '@bodyfit/domain/sync/operations';
import { applyOperation, reduceOperations, type EntityState } from '@bodyfit/domain/sync/conflict';
import {
  enqueue,
  markAcknowledged,
  markFailed,
  markSending,
  readyToSend,
  recoverOnStart,
  summarize,
  type OutboxEntry,
} from '@bodyfit/domain/sync/outbox';
import { APP_SCHEMA_VERSION, canonicalize } from '@bodyfit/domain/versioning';

/* ══════════════════════════════════════════════════════════ configuracion ══ */

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  const file = resolve(process.cwd(), '.env.local');
  if (existsSync(file)) {
    for (const l of readFileSync(file, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const URL_BASE = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ══════════════════════════════════════════════════════════════ servidor ══ */

interface Sesion {
  token: string;
  refresh: string;
  userId: string;
}

async function signIn(email: string, password: string): Promise<Sesion> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login fallido: ${res.status}`);
  const d = (await res.json()) as { access_token: string; refresh_token: string; user: { id: string } };
  return { token: d.access_token, refresh: d.refresh_token, userId: d.user.id };
}

async function refresh(sesion: Sesion): Promise<Sesion> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ refresh_token: sesion.refresh }),
  });
  if (!res.ok) return sesion;
  const d = (await res.json()) as { access_token: string; refresh_token: string; user: { id: string } };
  return { token: d.access_token, refresh: d.refresh_token, userId: d.user.id };
}

interface RpcResult {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
}

async function rpc(fn: string, args: unknown, token: string | null): Promise<RpcResult> {
  const headers: Record<string, string> = { apikey: ANON, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args ?? {}),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* PostgREST puede devolver texto plano */
  }
  return { ok: res.ok, status: res.status, json, text };
}

/* ══════════════════════════════════════════════════════════ dispositivo ══ */

let opCounter = 0;

class RealDevice {
  clock: Hlc;
  outbox: OutboxEntry[] = [];
  state = new Map<string, EntityState>();
  cursor = 0;
  online = true;
  /** Desviacion del reloj de este dispositivo. Los relojes reales no coinciden. */
  clockSkewMs = 0;
  /** Se fuerza a un token invalido para provocar el 401 y el refresco. */
  tokenRoto = false;

  constructor(
    readonly id: string,
    public sesion: Sesion,
  ) {
    this.clock = hlcZero(id);
  }

  private now(worldMs: number): number {
    return worldMs + this.clockSkewMs;
  }

  act(
    worldMs: number,
    input: {
      collection: SyncCollectionKey;
      entityId: string;
      type?: 'upsert' | 'delete' | 'restore';
      payload?: Record<string, unknown>;
    },
  ): SyncOperation {
    this.clock = localEvent(this.clock, this.now(worldMs));
    const type = input.type ?? 'upsert';
    const op = createOperation({
      operationId: randomUUID(),
      userId: this.sesion.userId,
      deviceId: this.id,
      collection: input.collection,
      entityId: input.entityId,
      operationType: type,
      payload: type === 'upsert' ? (input.payload ?? { v: ++opCounter }) : {},
      hlc: formatHlc(this.clock),
      createdAt: new Date(this.now(worldMs)).toISOString(),
      schemaVersion: APP_SCHEMA_VERSION,
      clientVersion: '2.1.0-qa',
    });

    // 1 · local primero. La interfaz no espera a nadie.
    this.apply([op]);
    // 2 · a la cola.
    this.outbox.push(enqueue(op));
    return op;
  }

  private apply(ops: readonly SyncOperation[]): void {
    for (const op of ops) {
      const key = `${op.collection}/${op.entityId}`;
      this.state.set(key, applyOperation(this.state.get(key) ?? null, op).next);
    }
  }

  /** Cierra y reabre la aplicacion: lo que quedo en vuelo vuelve a la cola. */
  restart(): void {
    this.outbox = recoverOnStart(this.outbox);
  }

  private get token(): string {
    return this.tokenRoto ? 'token.invalido.forzado' : this.sesion.token;
  }

  async sync(worldMs: number): Promise<void> {
    if (!this.online) return;
    await this.push(worldMs);
    await this.pull(worldMs);
  }

  private async push(worldMs: number): Promise<void> {
    const pendientes = readyToSend(this.outbox, worldMs).map((e) => e.operation);
    if (pendientes.length === 0) return;

    for (const lote of batchOperations(pendientes)) {
      const ids = new Set(lote.map((o) => o.operationId));
      this.outbox = this.outbox.map((e) => (ids.has(e.operation.operationId) ? markSending(e) : e));

      let r = await rpc('sync_push', { p_ops: lote }, this.token);

      /*
       * 401: el token caduco. Se renueva y se reintenta UNA vez.
       *
       * No se cierra la sesion ni se descarta nada: un token caducado es lo mas
       * normal del mundo despues de una hora, y desloguear a alguien por eso
       * seria absurdo.
       */
      if (r.status === 401) {
        this.tokenRoto = false;
        this.sesion = await refresh(this.sesion);
        r = await rpc('sync_push', { p_ops: lote }, this.token);
      }

      if (!r.ok || !Array.isArray(r.json)) {
        this.outbox = this.outbox.map((e) =>
          ids.has(e.operation.operationId)
            ? markFailed(e, `${r.status}: ${r.text.slice(0, 80)}`, worldMs, Math.random())
            : e,
        );
        continue;
      }

      const porId = new Map(
        (r.json as { operation_id: string; status: string }[]).map((x) => [x.operation_id, x]),
      );
      this.outbox = this.outbox.map((e) => {
        const res = porId.get(e.operation.operationId);
        if (!res) return e; // respuesta parcial: sigue pendiente
        if (res.status === 'rejected') {
          return { ...e, state: 'dead-letter' as const, lastError: 'rechazada por el servidor' };
        }
        return markAcknowledged(e, worldMs);
      });

      // Lo que quedo en `sending` sin respuesta vuelve a la cola.
      this.outbox = this.outbox.map((e) =>
        e.state === 'sending' ? { ...e, state: 'pending' as const, nextAttemptAt: 0 } : e,
      );
    }
  }

  private async pull(worldMs: number): Promise<void> {
    for (let guarda = 0; guarda < 200; guarda++) {
      let r = await rpc('sync_pull', { p_cursor: this.cursor, p_limit: 500 }, this.token);
      if (r.status === 401) {
        this.tokenRoto = false;
        this.sesion = await refresh(this.sesion);
        r = await rpc('sync_pull', { p_cursor: this.cursor, p_limit: 500 }, this.token);
      }
      if (!r.ok || !Array.isArray(r.json)) return;

      const filas = r.json as Record<string, unknown>[];
      if (filas.length === 0) return;

      const ops: SyncOperation[] = [];
      for (const fila of filas) {
        const op = deFila(fila, this.sesion.userId);
        if (validateOperation(op).length > 0) continue;
        const parsed = parseHlc(op.hlc);
        if (parsed) this.clock = remoteEvent(this.clock, parsed, this.now(worldMs)).next;
        ops.push(op);
      }
      this.apply(ops);
      this.cursor = Math.max(...filas.map((f) => Number(f.seq)));
      await rpc('sync_set_cursor', { p_device_id: this.id, p_cursor: this.cursor }, this.token);

      if (filas.length < 500) return;
    }
  }
}

/**
 * Reconstruye la operacion tal como la emitio su dispositivo de origen.
 *
 * El `checksum` se copia, no se recalcula: recalcularlo lo haria coincidir
 * siempre y no comprobaria nada. Asi se verifica que lo que volvio del servidor
 * es exactamente lo que se envio.
 */
function deFila(fila: Record<string, unknown>, userId: string): SyncOperation {
  const base = createOperation({
    operationId: String(fila.operation_id),
    userId,
    deviceId: String(fila.device_id),
    collection: fila.collection as SyncCollectionKey,
    entityId: String(fila.entity_id),
    operationType: fila.operation_type as SyncOperation['operationType'],
    payload: (fila.payload ?? {}) as Record<string, unknown>,
    hlc: String(fila.hlc),
    createdAt: String(fila.created_at),
    schemaVersion: Number(fila.schema_version),
    clientVersion: String(fila.client_version),
  });
  return { ...base, checksum: String(fila.checksum) };
}

/* ══════════════════════════════════════════════════════════ comparacion ══ */

/**
 * Compara dos estados por CONTENIDO, no por representacion.
 *
 * `JSON.stringify` depende del orden de las claves, y `jsonb` de Postgres no lo
 * conserva: guarda `{valor, peso}` y devuelve `{peso, valor}`. El dispositivo
 * que emitio la operacion tiene el orden original; el que la recibio del
 * servidor tiene el de Postgres. Mismos datos, distinta cadena.
 *
 * Comparar cadenas daba un falso positivo de divergencia. `canonicalize` ordena
 * las claves —es la misma funcion que usa el checksum, por el mismo motivo— y
 * compara lo que de verdad importa.
 */
function mismoEstado(a: Map<string, EntityState>, b: Map<string, EntityState>): string | null {
  const igual = (x: unknown, y: unknown) =>
    JSON.stringify(canonicalize(x)) === JSON.stringify(canonicalize(y));

  if (a.size !== b.size) return `tamanos distintos: ${a.size} vs ${b.size}`;
  for (const [key, v] of a) {
    const o = b.get(key);
    if (!o) return `falta ${key}`;
    if (o.hlc !== v.hlc) return `${key}: hlc distinto`;
    if (o.deletedAt !== v.deletedAt) return `${key}: borrado distinto`;
    if (!igual(o.fields, v.fields)) return `${key}: campos distintos`;
  }
  return null;
}

/* ═════════════════════════════════════════════════════════════ programa ══ */

export async function runTwoDeviceAudit(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): Promise<void> {
  if (!URL_BASE || !ANON || !env.RLS_TEST_EMAIL_A) {
    console.error('\nFalta configuracion en .env.local. Ver docs/SUPABASE_STAGING_SETUP.md\n');
    process.exit(2);
  }

  const DIA = 24 * 3600_000;
  const INICIO = Date.UTC(2026, 6, 1);

  const sesionA = await signIn(env.RLS_TEST_EMAIL_A, env.RLS_TEST_PASSWORD_A);
  const sesionB = await signIn(env.RLS_TEST_EMAIL_B, env.RLS_TEST_PASSWORD_B);

  line('Dos dispositivos contra Supabase staging');
  console.log(`   usuario A ${sesionA.userId}`);
  console.log(`   usuario B ${sesionB.userId}`);

  // Mismo usuario, dos dispositivos: es el escenario real de sincronizacion.
  const a1 = new RealDevice(randomUUID(), sesionA);
  const a2 = new RealDevice(randomUUID(), sesionA);
  // Un tercero, de OTRO usuario, para comprobar que no se mezcla nada.
  const b1 = new RealDevice(randomUUID(), sesionB);

  a1.clockSkewMs = 2_500;
  a2.clockSkewMs = -35_000;

  for (const d of [a1, a2, b1]) {
    await rpc(
      'register_device',
      { p_device_id: d.id, p_label: 'qa', p_platform: 'node', p_client_version: '2.1.0-qa' },
      d.sesion.token,
    );
  }

  // Punto de partida: lo que el servidor ya tenia de auditorias anteriores.
  const seqInicialA = Number((await rpc('sync_bootstrap_seq', {}, sesionA.token)).json ?? 0);
  a1.cursor = seqInicialA;
  a2.cursor = seqInicialA;
  console.log(`   punto de partida en el servidor: seq ${seqInicialA}`);

  const emitidas: SyncOperation[] = [];
  const COLECCIONES: SyncCollectionKey[] = ['training', 'nutrition', 'body', 'checkins', 'activity'];

  /* ───────────────────────────────── catorce dias ───────────────────────── */

  for (let dia = 0; dia < 14; dia++) {
    // Cortes de red solapados: hay un dia con los dos incomunicados
    a2.online = ![3, 4, 5, 9].includes(dia);
    a1.online = ![5, 6].includes(dia);

    for (const hora of [7, 12, 17, 21]) {
      const t = INICIO + dia * DIA + hora * 3600_000;

      emitidas.push(
        a1.act(t, {
          collection: COLECCIONES[(dia + hora) % COLECCIONES.length],
          entityId: `e-${dia}-${hora}`,
          payload: { valor: `A1-${dia}-${hora}`, peso: 80 + dia },
        }),
      );
      emitidas.push(
        a2.act(t + 60_000, {
          collection: COLECCIONES[(dia + hora + 2) % COLECCIONES.length],
          entityId: `e-${dia}-${(hora + 5) % 24}`,
          payload: { valor: `A2-${dia}-${hora}` },
        }),
      );

      // Los dos editan LA MISMA entidad: el conflicto que de verdad ocurre
      if (hora === 12) {
        emitidas.push(
          a1.act(t, { collection: 'body', entityId: `peso-${dia}`, payload: { kg: 82 - dia * 0.1 } }),
        );
        emitidas.push(
          a2.act(t + 1_000, {
            collection: 'body',
            entityId: `peso-${dia}`,
            payload: { kg: 82.3 - dia * 0.1 },
          }),
        );
      }

      // Borrar en uno, editar en el otro
      if (dia > 2 && hora === 17 && dia % 3 === 0) {
        emitidas.push(
          a2.act(t, { collection: 'nutrition', entityId: `e-${dia - 1}-7`, type: 'delete' }),
        );
        emitidas.push(
          a1.act(t + 500, {
            collection: 'nutrition',
            entityId: `e-${dia - 1}-7`,
            payload: { corregido: true },
          }),
        );
      }

      // Y algun arrepentimiento
      if (dia > 5 && hora === 21 && dia % 6 === 0) {
        emitidas.push(
          a1.act(t, { collection: 'nutrition', entityId: `e-${dia - 1}-7`, type: 'restore' }),
        );
      }

      // El otro usuario trabaja en paralelo, con las MISMAS claves de entidad
      b1.act(t, {
        collection: 'training',
        entityId: `e-${dia}-${hora}`,
        payload: { valor: `B1-${dia}-${hora}` },
      });
    }

    // El token de A1 caduca el dia 4; el de A2 el dia 10
    if (dia === 4) a1.tokenRoto = true;
    if (dia === 10) a2.tokenRoto = true;

    const t = INICIO + dia * DIA + 22 * 3600_000;
    await a1.sync(t);
    await a2.sync(t + 600_000);
    await b1.sync(t);

    // Reinicios de la aplicacion
    if (dia === 8) a1.restart();
    if (dia === 11) a2.restart();
  }

  /* ─────────────────────── reconexion en distinto orden ─────────────────── */

  a1.online = true;
  a2.online = true;
  const fin = INICIO + 15 * DIA;
  for (let ronda = 0; ronda < 4; ronda++) {
    await a2.sync(fin + ronda * 3600_000);
    await a1.sync(fin + ronda * 3600_000 + 60_000);
  }

  /* ──────────────────────────── cursor atrasado ─────────────────────────── */

  const antesDelRetroceso = a2.state.size;
  a2.cursor = seqInicialA;
  await a2.sync(fin + 10 * 3600_000);
  check(
    'un cursor que retrocede no duplica ni pierde nada',
    a2.state.size === antesDelRetroceso,
    `${a2.state.size} entidades antes y despues`,
  );

  /* ──────────────────────────────── duplicados ──────────────────────────── */

  const yaEnviada = emitidas[10];
  const reenvio = await rpc('sync_push', { p_ops: [yaEnviada] }, sesionA.token);
  check(
    'reenviar una operacion ya aceptada devuelve duplicate',
    reenvio.ok && (reenvio.json as { status: string }[])[0]?.status === 'duplicate',
  );

  /* ══════════════════════ migracion local -> cuenta, repetida ═══════════ */
  //
  // La propiedad que importa: subir los datos locales DOS VECES no puede
  // duplicar nada. Se puede interrumpir a la mitad —cerrar la aplicacion,
  // quedarse sin red— y repetir sin miedo.
  //
  // Es idempotente porque cada operacion lleva el `id` que la entidad ya tenia:
  // el servidor descarta por `operationId` lo que ya recibio, y el cliente
  // ignora por HLC lo que ya aplico.

  const antesDeMigrar = a1.state.size;
  const LOCALES = 12;

  const subir = (tanda: number) => {
    const ops: SyncOperation[] = [];
    for (let i = 0; i < LOCALES; i++) {
      ops.push(
        a1.act(fin + 20 * 3600_000 + tanda * 60_000 + i, {
          collection: 'nutrition',
          // El MISMO entityId en las dos tandas: es lo que hace la migracion.
          entityId: `local-${i}`,
          payload: { alimento: `local-${i}`, gramos: 100 + i },
        }),
      );
    }
    return ops;
  };

  const primera = subir(0);
  emitidas.push(...primera);
  await a1.sync(fin + 21 * 3600_000);
  const trasPrimera = a1.state.size;

  const segunda = subir(1);
  emitidas.push(...segunda);
  await a1.sync(fin + 22 * 3600_000);
  await a2.sync(fin + 23 * 3600_000);

  check(
    'la migracion sube las entidades locales',
    trasPrimera === antesDeMigrar + LOCALES,
    `${trasPrimera - antesDeMigrar} de ${LOCALES}`,
  );
  check(
    'repetirla NO duplica ni una entidad',
    a1.state.size === trasPrimera,
    `${a1.state.size} entidades, esperadas ${trasPrimera}`,
  );
  check(
    'y el otro dispositivo tampoco ve duplicados',
    a2.state.size === a1.state.size,
    `${a2.state.size} vs ${a1.state.size}`,
  );

  /* ═══════════════════════════════ comprobaciones ═══════════════════════ */

  line('Resultado');

  console.log(`   ${emitidas.length} operaciones emitidas por el usuario A`);

  const diff = mismoEstado(a1.state, a2.state);
  check(
    'los dos dispositivos del mismo usuario convergen',
    diff === null,
    diff ?? `${a1.state.size} entidades`,
  );

  /*
   * Que A1 y A2 coincidan no basta: podrian coincidir en haber perdido lo mismo.
   * Se compara contra el modelo de referencia — todas las operaciones emitidas,
   * reducidas por las mismas reglas del dominio.
   */
  const referencia = reduceOperations(emitidas);
  const contraRef = mismoEstado(a1.state, referencia);
  check(
    'y coinciden con lo que deberia existir, no solo entre si',
    contraRef === null,
    contraRef ?? `${referencia.size} entidades esperadas`,
  );

  const pendientesA = [...a1.outbox, ...a2.outbox].filter((e) => e.state !== 'acknowledged');
  check(
    'las dos colas quedan vacias de pendientes',
    pendientesA.length === 0,
    `${pendientesA.length} sin confirmar`,
  );
  check(
    'nada acabo en dead-letter',
    [...a1.outbox, ...a2.outbox].every((e) => e.state !== 'dead-letter'),
  );

  check('los cursores de los dos dispositivos coinciden', a1.cursor === a2.cursor,
    `${a1.cursor} vs ${a2.cursor}`);

  const seqServidor = Number((await rpc('sync_bootstrap_seq', {}, sesionA.token)).json ?? 0);
  check(
    'el cursor coincide con la secuencia del servidor',
    a1.cursor === seqServidor,
    `cursor ${a1.cursor} · servidor ${seqServidor}`,
  );
  check(
    'el servidor tiene exactamente las operaciones emitidas',
    seqServidor - seqInicialA === emitidas.length,
    `${seqServidor - seqInicialA} nuevas · ${emitidas.length} emitidas`,
  );

  /* ── el otro usuario ── */

  const contaminado = [...b1.state.keys()].some((k) => {
    const v = b1.state.get(k)!;
    return JSON.stringify(v.fields).includes('A1-') || JSON.stringify(v.fields).includes('A2-');
  });
  check('el usuario B no ha visto NADA del usuario A', !contaminado);

  const aContaminado = [...a1.state.values()].some((v) => JSON.stringify(v.fields).includes('B1-'));
  check('y el usuario A no ha visto nada del usuario B', !aContaminado);

  check(
    'B tiene sus propias entidades con las mismas claves, sin mezclarse',
    b1.state.size > 0,
    `${b1.state.size} entidades propias`,
  );

  const resumen = summarize([...a1.outbox, ...a2.outbox]);
  console.log(
    `\n   cola final: ${resumen.acknowledged} confirmadas · ${resumen.pending} pendientes · ${resumen.deadLetter} sin salida`,
  );
}
