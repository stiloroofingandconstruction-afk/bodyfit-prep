/**
 * Mundo simulado: dos dispositivos, catorce dias, ni un dato perdido.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE UNA SIMULACION Y NO UN NAVEGADOR
 *
 * La pregunta que hay que responder es "¿convergen?", y responderla de verdad
 * exige muchos escenarios: cortes de red solapados, reconexiones en distinto
 * orden, reinicios en medio, servidores que se caen a mitad de un lote. En un
 * navegador cada escenario cuesta segundos y es dificil de reproducir cuando
 * falla.
 *
 * Aqui el tiempo es una variable, el servidor cabe en un Map y catorce dias
 * pasan en milisegundos. Cuando algo falla, falla siempre igual: se puede
 * depurar.
 *
 * Las pruebas de navegador siguen existiendo (e2e/08-sync-*.spec.ts) y prueban
 * otra cosa: que el cableado con la aplicacion real funciona.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  formatHlc,
  hlcZero,
  localEvent,
  parseHlc,
  remoteEvent,
  type Hlc,
} from '@bodyfit/domain/sync/hlc';
import {
  createOperation,
  validateOperation,
  batchOperations,
  type SyncCollectionKey,
  type SyncOperation,
} from '@bodyfit/domain/sync/operations';
import {
  applyOperation,
  reduceOperations,
  type EntityState,
} from '@bodyfit/domain/sync/conflict';
import {
  enqueue,
  markAcknowledged,
  markFailed,
  markSending,
  readyToSend,
  recoverOnStart,
  type OutboxEntry,
} from '@bodyfit/domain/sync/outbox';
import { APP_SCHEMA_VERSION } from '@bodyfit/domain/versioning';

/* ═══════════════════════════════════════════════════ generador aleatorio ══ */

/** Congruencial lineal: mismo resultado en cada ejecucion, siempre. */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ══════════════════════════════════════════════════════ servidor de mentira ══ */

interface StoredOp {
  seq: number;
  op: SyncOperation;
}

/**
 * El servidor, en memoria.
 *
 * Implementa lo unico que el cliente puede observar: idempotencia por
 * `operationId` y una secuencia monotona **por usuario** que ordena la entrega.
 * Esa secuencia es la parte que no puede sustituirse por el HLC — ver §7 del
 * plan— y por eso la simulacion la modela explicitamente.
 */
class MemoryServer {
  private readonly byId = new Map<string, StoredOp>();
  private readonly log: StoredOp[] = [];
  private lastSeq = 0;

  /** Si esta caido, todo push y todo pull lanzan. */
  down = false;
  /** Cuantas operaciones acepta antes de cortar. -1 = todas. */
  acceptLimit = -1;

  push(batch: readonly SyncOperation[]): { operationId: string; status: string }[] {
    if (this.down) throw new Error('servidor caido');

    const results: { operationId: string; status: string }[] = [];
    let accepted = 0;

    for (const op of batch) {
      if (this.acceptLimit >= 0 && accepted >= this.acceptLimit) break; // respuesta parcial

      if (validateOperation(op).length > 0) {
        results.push({ operationId: op.operationId, status: 'rejected' });
        accepted++;
        continue;
      }
      if (this.byId.has(op.operationId)) {
        results.push({ operationId: op.operationId, status: 'duplicate' });
        accepted++;
        continue;
      }
      this.lastSeq++;
      const stored: StoredOp = { seq: this.lastSeq, op };
      this.byId.set(op.operationId, stored);
      this.log.push(stored);
      results.push({ operationId: op.operationId, status: 'applied' });
      accepted++;
    }
    return results;
  }

  pull(cursor: number, limit: number): { ops: SyncOperation[]; cursor: number; hasMore: boolean } {
    if (this.down) throw new Error('servidor caido');
    const page = this.log.filter((s) => s.seq > cursor).slice(0, limit);
    const next = page.length > 0 ? page[page.length - 1].seq : cursor;
    return {
      ops: page.map((s) => s.op),
      cursor: next,
      hasMore: this.log.some((s) => s.seq > next),
    };
  }

  operationCount(): number {
    return this.log.length;
  }
}

/* ═══════════════════════════════════════════════════════════ dispositivo ══ */

class SimDevice {
  clock: Hlc;
  /**
   * Contador de operaciones, para fabricar UUID validos y deterministas.
   *
   * Tienen que ser UUID de verdad: `validateOperation` los exige, y el
   * servidor simulado valida igual que el real. La primera version de esta
   * prueba usaba cadenas legibles, el servidor las rechazaba todas y el
   * dispositivo las daba por confirmadas — la simulacion pasaba en verde
   * habiendo sincronizado exactamente cero operaciones.
   */
  private opCount = 0;
  outbox: OutboxEntry[] = [];
  state = new Map<string, EntityState>();
  cursor = 0;
  online = true;
  /** Desviacion del reloj de este dispositivo respecto al tiempo real. */
  clockSkewMs = 0;

  constructor(
    readonly id: string,
    private readonly server: MemoryServer,
  ) {
    this.clock = hlcZero(id);
  }

  private now(worldMs: number): number {
    return worldMs + this.clockSkewMs;
  }

  private nextOperationId(): string {
    this.opCount++;
    const prefix = this.id === 'dispositivo-A' ? 'a' : 'b';
    const n = this.opCount.toString(16).padStart(11, '0');
    return `${prefix}0000000-0000-4000-8000-${n}0`;
  }

  /** La persona hace algo. Se aplica en local YA y se encola. */
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
      operationId: this.nextOperationId(),
      userId: 'usuario-1',
      deviceId: this.id,
      collection: input.collection,
      entityId: input.entityId,
      operationType: type,
      payload: type === 'upsert' ? (input.payload ?? { v: 1 }) : {},
      hlc: formatHlc(this.clock),
      createdAt: new Date(this.now(worldMs)).toISOString(),
      schemaVersion: APP_SCHEMA_VERSION,
      clientVersion: '2.1.0',
    });

    // 1 · local primero. La interfaz no espera a nadie.
    this.applyLocally([op]);
    // 2 · a la cola.
    this.outbox.push(enqueue(op));
    return op;
  }

  private applyLocally(ops: readonly SyncOperation[]): void {
    for (const op of ops) {
      const key = `${op.collection}/${op.entityId}`;
      const { next } = applyOperation(this.state.get(key) ?? null, op);
      this.state.set(key, next);
    }
  }

  /** Cierra y reabre la aplicacion. */
  restart(): void {
    this.outbox = recoverOnStart(this.outbox);
  }

  sync(worldMs: number, random: () => number): void {
    if (!this.online) return;
    this.push(worldMs, random);
    this.pull(worldMs);
  }

  private push(worldMs: number, random: () => number): void {
    const pendientes = readyToSend(this.outbox, worldMs).map((e) => e.operation);
    if (pendientes.length === 0) return;

    for (const batch of batchOperations(pendientes)) {
      const ids = new Set(batch.map((o) => o.operationId));
      this.outbox = this.outbox.map((e) => (ids.has(e.operation.operationId) ? markSending(e) : e));

      let results;
      try {
        results = this.server.push(batch);
      } catch (err) {
        this.outbox = this.outbox.map((e) =>
          ids.has(e.operation.operationId)
            ? markFailed(e, String(err), worldMs, random())
            : e,
        );
        return;
      }

      const byId = new Map(results.map((r) => [r.operationId, r]));
      this.outbox = this.outbox.map((e) => {
        const r = byId.get(e.operation.operationId);
        if (!r) return e; // respuesta parcial: sigue en vuelo, se reintentara
        // Un rechazo NO es una confirmacion. Va a dead-letter y se ve.
        if (r.status === 'rejected') return { ...e, state: 'dead-letter' as const, lastError: 'rechazada' };
        return markAcknowledged(e, worldMs);
      });

      // Lo que quedo en `sending` sin respuesta vuelve a la cola.
      this.outbox = this.outbox.map((e) =>
        e.state === 'sending' ? { ...e, state: 'pending' as const, nextAttemptAt: 0 } : e,
      );
    }
  }

  private pull(worldMs: number): void {
    let guard = 0;
    for (;;) {
      if (guard++ > 1_000) break;
      let page;
      try {
        page = this.server.pull(this.cursor, 500);
      } catch {
        return;
      }
      if (page.ops.length === 0) break;

      for (const op of page.ops) {
        const parsed = parseHlc(op.hlc);
        if (parsed) this.clock = remoteEvent(this.clock, parsed, this.now(worldMs)).next;
      }
      this.applyLocally(page.ops);
      this.cursor = page.cursor;
      if (!page.hasMore) break;
    }
  }

  /** Solo las entidades vivas: lo que la persona ve. */
  liveEntities(): Map<string, EntityState> {
    const live = new Map<string, EntityState>();
    for (const [key, value] of this.state) {
      if (value.deletedAt === null) live.set(key, value);
    }
    return live;
  }
}

/* ══════════════════════════════════════════════════════════ comparacion ══ */

function sameState(a: Map<string, EntityState>, b: Map<string, EntityState>): string | null {
  if (a.size !== b.size) return `tamanos distintos: ${a.size} vs ${b.size}`;
  for (const [key, value] of a) {
    const other = b.get(key);
    if (!other) return `falta ${key}`;
    if (other.hlc !== value.hlc) return `${key}: hlc distinto`;
    if (other.deletedAt !== value.deletedAt) return `${key}: borrado distinto`;
    if (JSON.stringify(other.fields) !== JSON.stringify(value.fields)) {
      return `${key}: campos distintos`;
    }
  }
  return null;
}

/* ═════════════════════════════════════════════════════════════ pruebas ══ */

export function runSyncWorldTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  line('Dos dispositivos: catorce dias simulados');

  const DAY = 24 * 3600_000;
  const START = 1_754_923_000_000;

  /* ─────────────────────────────── la prueba critica ─────────────────── */
  {
    const server = new MemoryServer();
    const a = new SimDevice('dispositivo-A', server);
    const b = new SimDevice('dispositivo-B', server);
    const random = rng(20260803);
    const emitidas: SyncOperation[] = [];

    // Relojes que no coinciden, como en la vida real
    a.clockSkewMs = 1_500;
    b.clockSkewMs = -40_000;

    const COLECCIONES: SyncCollectionKey[] = [
      'training',
      'nutrition',
      'body',
      'checkins',
      'activity',
      'photos',
    ];

    for (let dia = 0; dia < 14; dia++) {
      // El dispositivo B pierde la red los dias 3, 4, 5 y 9
      b.online = ![3, 4, 5, 9].includes(dia);
      // El A la pierde los dias 5 y 6: hay un dia con los dos incomunicados
      a.online = ![5, 6].includes(dia);

      for (let hora = 6; hora < 22; hora++) {
        const t = START + dia * DAY + hora * 3600_000;

        // Actividad tipica de un dia: comidas, series, peso
        if (hora % 4 === 0) {
          const op = a.act(t, {
            collection: 'nutrition',
            entityId: `comida-${dia}-${hora}`,
            payload: { alimento: 'pollo', gramos: 150 + hora },
          });
          emitidas.push(op);
        }
        if (hora % 5 === 0) {
          const op = b.act(t + 60_000, {
            collection: 'training',
            entityId: `serie-${dia}-${hora}`,
            payload: { peso: 80 + dia, reps: 8, rir: 2 },
          });
          emitidas.push(op);
        }
        if (hora === 7) {
          // Los dos escriben el peso del mismo dia: conflicto real y frecuente
          emitidas.push(
            a.act(t, { collection: 'body', entityId: `peso-${dia}`, payload: { kg: 82 - dia * 0.1 } }),
          );
          emitidas.push(
            b.act(t + 1_000, {
              collection: 'body',
              entityId: `peso-${dia}`,
              payload: { kg: 82.2 - dia * 0.1 },
            }),
          );
        }
        if (hora === 20 && dia % 7 === 6) {
          emitidas.push(
            a.act(t, {
              collection: 'checkins',
              entityId: `semana-${Math.floor(dia / 7)}`,
              payload: { adherencia: 90 },
            }),
          );
        }
        // Alguna correccion: borrar una comida mal registrada
        if (dia > 2 && hora === 15 && dia % 3 === 0) {
          emitidas.push(
            b.act(t, {
              collection: 'nutrition',
              entityId: `comida-${dia - 1}-12`,
              type: 'delete',
            }),
          );
        }
        // Y algun arrepentimiento
        if (dia > 5 && hora === 16 && dia % 6 === 0) {
          emitidas.push(
            a.act(t, {
              collection: 'nutrition',
              entityId: `comida-${dia - 1}-12`,
              type: 'restore',
            }),
          );
        }

        // Cada dispositivo sincroniza cuando puede, en orden alterno
        if (random() < 0.4) a.sync(t, random);
        if (random() < 0.4) b.sync(t + 30_000, random);
      }

      // El dispositivo A se reinicia el dia 8; el B el dia 11
      if (dia === 8) a.restart();
      if (dia === 11) b.restart();
    }

    // Reconexion final: los dos vuelven, en orden distinto
    a.online = true;
    b.online = true;
    const fin = START + 15 * DAY;
    for (let ronda = 0; ronda < 6; ronda++) {
      b.sync(fin + ronda * 3600_000, random);
      a.sync(fin + ronda * 3600_000 + 60_000, random);
    }

    /* ── Comprobaciones ── */

    const diff = sameState(a.state, b.state);
    check(
      'tras 14 dias los dos dispositivos tienen exactamente el mismo estado',
      diff === null,
      diff ?? `${a.state.size} entidades, ${emitidas.length} operaciones`,
    );

    /*
     * Que A y B coincidan no basta: podrian coincidir en haber perdido lo
     * mismo. Se compara contra el modelo de referencia, que es simplemente
     * todas las operaciones que se emitieron, reducidas.
     */
    const referencia = reduceOperations(emitidas);
    const contraReferencia = sameState(a.state, referencia);
    check(
      'y coinciden con lo que deberia existir, no solo entre si',
      contraReferencia === null,
      contraReferencia ?? `${referencia.size} entidades esperadas`,
    );

    check(
      'ninguna operacion se perdio por el camino',
      server.operationCount() === emitidas.length,
      `servidor ${server.operationCount()} · emitidas ${emitidas.length}`,
    );

    const duplicadas = new Set(emitidas.map((o) => o.operationId)).size !== emitidas.length;
    check('ninguna operacion se duplico', !duplicadas);

    const sinConfirmar = [...a.outbox, ...b.outbox].filter((e) => e.state !== 'acknowledged');
    check(
      'las dos colas quedaron vacias de pendientes',
      sinConfirmar.length === 0,
      `${sinConfirmar.length} sin confirmar`,
    );

    check(
      'no quedo nada en dead-letter',
      [...a.outbox, ...b.outbox].every((e) => e.state !== 'dead-letter'),
    );

    const vivas = a.liveEntities().size;
    check(
      'el resultado es un conjunto de datos con sentido',
      vivas > 100 && vivas < a.state.size,
      `${vivas} entidades vivas de ${a.state.size} (el resto, borradas)`,
    );
  }

  /* ─────────────────────────── el servidor se cae ─────────────────────── */
  {
    const server = new MemoryServer();
    const a = new SimDevice('dispositivo-A', server);
    const b = new SimDevice('dispositivo-B', server);
    const random = rng(7);
    const emitidas: SyncOperation[] = [];

    for (let i = 0; i < 30; i++) {
      emitidas.push(a.act(START + i * 60_000, { collection: 'training', entityId: `e-${i}`, payload: { v: i } }));
    }

    server.down = true;
    a.sync(START + 3600_000, random);
    check(
      'con el servidor caido nada se pierde: todo vuelve a la cola',
      a.outbox.every((e) => e.state === 'failed' || e.state === 'pending'),
      `${a.outbox.length} operaciones esperando`,
    );

    server.down = false;
    // Se avanza el tiempo para que venza el backoff
    for (let ronda = 0; ronda < 15; ronda++) {
      a.sync(START + 3600_000 + ronda * 600_000, random);
    }
    check(
      'al volver el servidor, la cola se vacia sola',
      a.outbox.every((e) => e.state === 'acknowledged'),
      `${a.outbox.filter((e) => e.state !== 'acknowledged').length} sin confirmar`,
    );

    b.sync(START + 4 * 3600_000, random);
    check(
      'y el otro dispositivo recibe todo lo que se habia acumulado',
      sameState(a.state, b.state) === null,
      `${b.state.size} entidades`,
    );
  }

  /* ────────────────────── respuestas parciales ────────────────────────── */
  {
    const server = new MemoryServer();
    const a = new SimDevice('dispositivo-A', server);
    const random = rng(11);
    const emitidas: SyncOperation[] = [];

    for (let i = 0; i < 120; i++) {
      emitidas.push(a.act(START + i * 1_000, { collection: 'nutrition', entityId: `c-${i}`, payload: { v: i } }));
    }

    // El servidor solo procesa 40 de cada lote y corta
    server.acceptLimit = 40;
    a.sync(START + 3600_000, random);
    const confirmadas = a.outbox.filter((e) => e.state === 'acknowledged').length;
    check(
      'ante una respuesta parcial se confirma solo lo confirmado',
      confirmadas > 0 && confirmadas < 120,
      `${confirmadas} de 120`,
    );

    server.acceptLimit = -1;
    for (let ronda = 0; ronda < 10; ronda++) a.sync(START + 7200_000 + ronda * 600_000, random);
    check(
      'y el resto llega en los intentos siguientes',
      a.outbox.every((e) => e.state === 'acknowledged'),
      `${a.outbox.filter((e) => e.state !== 'acknowledged').length} sin confirmar`,
    );
    check(
      'sin duplicar ninguna: el servidor las descarta por operationId',
      server.operationCount() === 120,
      `${server.operationCount()} en el servidor`,
    );
  }

  /* ──────────────────────────── cursor corrupto ───────────────────────── */
  {
    const server = new MemoryServer();
    const a = new SimDevice('dispositivo-A', server);
    const b = new SimDevice('dispositivo-B', server);
    const random = rng(13);

    for (let i = 0; i < 25; i++) {
      a.act(START + i * 60_000, { collection: 'body', entityId: `m-${i}`, payload: { kg: 80 + i } });
    }
    a.sync(START + 3600_000, random);
    b.sync(START + 3600_000, random);

    const antes = b.state.size;
    // El cursor se corrompe y retrocede al principio
    b.cursor = 0;
    b.sync(START + 7200_000, random);
    check(
      'un cursor que retrocede no corrompe nada: se relee y se converge',
      b.state.size === antes && sameState(a.state, b.state) === null,
      `${b.state.size} entidades, sin duplicados`,
    );
  }

  /* ────────────────────── reinicio con cola llena ─────────────────────── */
  {
    const server = new MemoryServer();
    const a = new SimDevice('dispositivo-A', server);
    const random = rng(17);

    for (let i = 0; i < 500; i++) {
      a.act(START + i * 1_000, { collection: 'training', entityId: `s-${i}`, payload: { v: i } });
    }
    // Se muere la aplicacion justo cuando estaba enviando
    a.outbox = a.outbox.map((e, i) => (i < 100 ? markSending(e) : e));
    a.restart();
    check(
      '500 operaciones pendientes sobreviven al cierre de la aplicacion',
      a.outbox.length === 500 && a.outbox.every((e) => e.state === 'pending'),
      `${a.outbox.filter((e) => e.state === 'pending').length} recuperadas`,
    );

    a.sync(START + 3600_000, random);
    check(
      'y se envian todas al volver',
      server.operationCount() === 500,
      `${server.operationCount()} en el servidor`,
    );
  }
}
