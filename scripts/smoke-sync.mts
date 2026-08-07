/**
 * Pruebas del motor de sincronizacion: reloj, operaciones, conflictos, outbox.
 *
 * Todo aqui es logica pura, asi que no hace falta navegador, ni red, ni
 * servidor. Un reloj virtual y unos cuantos dispositivos simulados bastan para
 * comprobar lo unico que de verdad importa: que dos dispositivos que hacen
 * cosas distintas sin verse acaban con exactamente los mismos datos.
 */
import {
  MAX_DRIFT_MS,
  compareHlc,
  formatHlc,
  hlcZero,
  localEvent,
  parseHlc,
  remoteEvent,
  type Hlc,
} from '@bodyfit/domain/sync/hlc';
import {
  MAX_BATCH_OPERATIONS,
  SYNC_COLLECTION_KEYS,
  batchOperations,
  createOperation,
  isSyncCollection,
  operationSize,
  sortOperations,
  validateOperation,
  verifyChecksum,
  canonicalTimestamp,
  type OperationDraft,
  type SyncCollectionKey,
  type SyncOperation,
} from '@bodyfit/domain/sync/operations';
import {
  applyOperation,
  reduceOperations,
  strategyFor,
  type EntityState,
} from '@bodyfit/domain/sync/conflict';
import {
  MAX_ATTEMPTS,
  backoffMs,
  enqueue,
  markAcknowledged,
  markFailed,
  markSending,
  prune,
  readyToSend,
  recoverOnStart,
  rejectInvalid,
  summarize,
  type OutboxEntry,
} from '@bodyfit/domain/sync/outbox';
import { APP_SCHEMA_VERSION } from '@bodyfit/domain/versioning';
import { SYNC_COLLECTIONS } from '@bodyfit/domain/collections';

/* ═══════════════════════════════════════════════════════════ utilidades ══ */

const DEVICE_A = '11111111-1111-4111-8111-111111111111';
const DEVICE_B = '22222222-2222-4222-8222-222222222222';

let uuidCounter = 0;
/** UUID v4 valido y determinista: las pruebas tienen que ser reproducibles. */
function fakeUuid(): string {
  uuidCounter++;
  const hex = uuidCounter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

function op(input: {
  device: string;
  hlc: string;
  collection?: SyncCollectionKey;
  entityId?: string;
  type?: 'upsert' | 'delete' | 'restore';
  payload?: Record<string, unknown>;
  createdAt?: string;
  schemaVersion?: number;
}): SyncOperation {
  const draft: OperationDraft = {
    operationId: fakeUuid(),
    userId: null,
    deviceId: input.device,
    collection: input.collection ?? 'training',
    entityId: input.entityId ?? 'entidad-1',
    operationType: input.type ?? 'upsert',
    payload: input.type === 'delete' || input.type === 'restore' ? {} : (input.payload ?? { a: 1 }),
    hlc: input.hlc,
    createdAt: input.createdAt ?? '2026-08-03T10:00:00.000Z',
    schemaVersion: input.schemaVersion ?? APP_SCHEMA_VERSION,
    clientVersion: '2.1.0',
  };
  return createOperation(draft);
}

/** Un dispositivo con su reloj. Emite operaciones y recibe las de otros. */
class Device {
  clock: Hlc;
  constructor(readonly id: string) {
    this.clock = hlcZero(id);
  }
  emit(nowMs: number, input: Partial<Parameters<typeof op>[0]> = {}): SyncOperation {
    this.clock = localEvent(this.clock, nowMs);
    return op({ device: this.id, hlc: formatHlc(this.clock), ...input });
  }
  receive(remote: SyncOperation, nowMs: number): boolean {
    const parsed = parseHlc(remote.hlc);
    if (!parsed) return false;
    const { next, clockSuspect } = remoteEvent(this.clock, parsed, nowMs);
    this.clock = next;
    return clockSuspect;
  }
}

function stateOf(map: Map<string, EntityState>, collection: string, id: string) {
  return map.get(`${collection}/${id}`);
}

/** Baraja de forma determinista, para que un fallo sea reproducible. */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ═════════════════════════════════════════════════════════════ pruebas ══ */

export function runSyncTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  /* ────────────────────────────────────────────── reloj logico hibrido ── */
  line('Reloj logico hibrido');

  {
    const a = new Device(DEVICE_A);
    const b = new Device(DEVICE_B);
    const t = 1_754_923_000_000;

    // Dos dispositivos con la misma hora exacta
    const opA = a.emit(t);
    const opB = b.emit(t);
    check(
      'dos dispositivos a la misma hora no producen HLC iguales',
      opA.hlc !== opB.hlc,
      'desempata el deviceId',
    );
    check(
      'el desempate por deviceId es determinista',
      compareHlc(opA.hlc, opB.hlc) < 0 && DEVICE_A < DEVICE_B,
      'gana el deviceId mayor',
    );
  }

  {
    // Reloj adelantado: el dispositivo sigue funcionando, pero no contagia
    const local = new Device(DEVICE_A);
    const t = 1_754_923_000_000;
    local.emit(t);

    const adelantado = { wallMs: t + 365 * 24 * 3600_000, counter: 0, deviceId: DEVICE_B };
    const { next, clockSuspect } = remoteEvent(local.clock, adelantado, t);

    check('un reloj remoto un ano por delante se marca como sospechoso', clockSuspect);
    check(
      'un reloj remoto imposible NO contamina el reloj local',
      next.wallMs < adelantado.wallMs,
      `local se quedo en ${next.wallMs}, remoto decia ${adelantado.wallMs}`,
    );

    // Justo por debajo del umbral si se adopta: es una diferencia creible
    const creible = { wallMs: t + MAX_DRIFT_MS - 1_000, counter: 0, deviceId: DEVICE_B };
    const adoptado = remoteEvent(local.clock, creible, t);
    check('una diferencia creible si se adopta', !adoptado.clockSuspect && adoptado.next.wallMs === creible.wallMs);
  }

  {
    // Reloj atrasado: wallMs no retrocede jamas
    const d = new Device(DEVICE_A);
    const t = 1_754_923_000_000;
    d.emit(t);
    const antes = d.clock.wallMs;
    d.emit(t - 24 * 3600_000); // la persona atrasa la fecha un dia
    check('atrasar el reloj no hace retroceder el HLC', d.clock.wallMs === antes);
    check('con el reloj atrasado el orden lo mantiene el contador', d.clock.counter === 1);
  }

  {
    // Operaciones simultaneas dentro del mismo milisegundo
    const d = new Device(DEVICE_A);
    const t = 1_754_923_000_000;
    const ops = [d.emit(t), d.emit(t), d.emit(t)];
    const hlcs = ops.map((o) => o.hlc);
    check('tres operaciones en el mismo milisegundo dan tres HLC distintos', new Set(hlcs).size === 3);
    check(
      'y quedan en el orden en que se emitieron',
      compareHlc(hlcs[0], hlcs[1]) < 0 && compareHlc(hlcs[1], hlcs[2]) < 0,
    );
  }

  {
    // Reinicio del dispositivo: el reloj continua donde estaba
    const d = new Device(DEVICE_A);
    const t = 1_754_923_000_000;
    d.emit(t);
    d.emit(t);
    const guardado = d.clock;

    const reiniciado = new Device(DEVICE_A);
    reiniciado.clock = guardado; // esto es lo que hace clockStore al arrancar
    const despues = reiniciado.emit(t);
    check(
      'tras un reinicio el reloj continua, no salta atras',
      compareHlc(despues.hlc, formatHlc(guardado)) > 0,
    );
  }

  {
    // Recepcion fuera de orden
    const a = new Device(DEVICE_A);
    const b = new Device(DEVICE_B);
    const t = 1_754_923_000_000;
    const primera = a.emit(t);
    const segunda = a.emit(t + 5_000);

    b.receive(segunda, t + 6_000);
    b.receive(primera, t + 7_000);
    const respuesta = b.emit(t + 8_000);

    check(
      'una respuesta emitida tras recibir fuera de orden queda despues de ambas',
      compareHlc(respuesta.hlc, segunda.hlc) > 0 && compareHlc(respuesta.hlc, primera.hlc) > 0,
    );
  }

  {
    // Serializacion
    const h: Hlc = { wallMs: 1_754_923_011_234, counter: 42, deviceId: DEVICE_A };
    const round = parseHlc(formatHlc(h));
    check(
      'formatHlc y parseHlc son inversas',
      round !== null &&
        round.wallMs === h.wallMs &&
        round.counter === h.counter &&
        round.deviceId === h.deviceId,
    );
    check('una cadena que no es un HLC devuelve null, no lanza', parseHlc('cualquier cosa') === null);
    check(
      'el orden lexicografico coincide con el orden temporal',
      formatHlc({ ...h, wallMs: h.wallMs - 1 }) < formatHlc(h) &&
        formatHlc(h) < formatHlc({ ...h, wallMs: h.wallMs + 1 }),
    );
  }

  /* ─────────────────────────────────────────────────────── operaciones ── */
  line('Operaciones sincronizables');

  {
    const valida = op({ device: DEVICE_A, hlc: formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A }) });
    check('una operacion bien formada no tiene problemas', validateOperation(valida).length === 0);
    check('el checksum verifica', verifyChecksum(valida));

    const alterada = { ...valida, payload: { a: 999 } };
    check('alterar el payload rompe el checksum', !verifyChecksum(alterada));
    check(
      'una operacion alterada se detecta al validar',
      validateOperation(alterada).some((p) => p.includes('checksum')),
    );
  }

  {
    /*
     * El ida y vuelta por Postgres.
     *
     * `timestamptz` no conserva el texto: se envia `...T07:00:02.500Z` y
     * PostgREST devuelve `...T07:00:02.5+00:00`. Mismo instante, otra cadena, y
     * el checksum se calcula sobre el texto.
     *
     * Sin normalizar, TODA operacion que volvia del servidor fallaba la
     * validacion y se descartaba en silencio: la sincronizacion parecia sana y
     * no llegaba nada. Lo encontro la auditoria contra el Supabase real.
     */
    const hlcRt = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    const emitida = op({ device: DEVICE_A, hlc: hlcRt, createdAt: '2026-07-01T07:00:02.500Z' });

    const comoLoDevuelvePostgres = createOperation({
      operationId: emitida.operationId,
      userId: emitida.userId,
      deviceId: emitida.deviceId,
      collection: emitida.collection,
      entityId: emitida.entityId,
      operationType: emitida.operationType,
      payload: emitida.payload as Record<string, unknown>,
      hlc: emitida.hlc,
      createdAt: '2026-07-01T07:00:02.5+00:00',
      schemaVersion: emitida.schemaVersion,
      clientVersion: emitida.clientVersion,
    });

    check(
      'el formato de fecha de Postgres se normaliza al reconstruir',
      comoLoDevuelvePostgres.checksum === emitida.checksum,
      'sin esto, nada de lo que vuelve del servidor pasa la validacion',
    );
    check(
      'y la operacion reconstruida valida',
      validateOperation({ ...comoLoDevuelvePostgres, checksum: emitida.checksum }).length === 0,
    );
    /*
     * El dueno no cambia el checksum.
     *
     * La operacion se emite sin sesion (`userId: null`) y vuelve del servidor
     * con el identificador puesto. Si eso alterara el checksum, todo lo que se
     * recibe fallaria la validacion y se descartaria sin decir nada — que es
     * exactamente lo que pasaba.
     */
    const sinDueno = op({ device: DEVICE_A, hlc: hlcRt, createdAt: '2026-07-01T07:00:02.500Z' });
    // Sin el `checksum` viejo dentro: si se cuela, se firma sobre la firma.
    const { checksum: _previo, ...borrador } = sinDueno;
    const conDueno = createOperation({
      ...(borrador as OperationDraft),
      userId: '00000000-0000-4000-8000-000000000abc',
    });
    check(
      'el userId no cambia el checksum: lo decide el servidor, no el cliente',
      conDueno.checksum === sinDueno.checksum,
      'sin esto, todo lo recibido se descarta en silencio',
    );

    check(
      'canonicalTimestamp acepta los dos formatos y da el mismo',
      canonicalTimestamp('2026-07-01T07:00:02.5+00:00') === '2026-07-01T07:00:02.500Z',
      canonicalTimestamp('2026-07-01T07:00:02.5+00:00'),
    );
    check(
      'una fecha ilegible se deja tal cual, para que el error sea el correcto',
      canonicalTimestamp('no es una fecha') === 'no es una fecha',
    );
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    const ajena = { ...op({ device: DEVICE_A, hlc }), collection: 'inventada' as SyncCollectionKey };
    check(
      'una coleccion fuera del registro se rechaza',
      validateOperation(ajena).some((p) => p.includes('no esta registrada')),
    );

    const conPayload = { ...op({ device: DEVICE_A, hlc, type: 'delete' }), payload: { a: 1 } };
    check(
      'un delete con payload se rechaza',
      validateOperation(conPayload).some((p) => p.includes('no puede llevar payload')),
    );

    const otroDispositivo = { ...op({ device: DEVICE_A, hlc }), deviceId: DEVICE_B };
    check(
      'un hlc que pertenece a otro dispositivo se detecta',
      validateOperation(otroDispositivo).some((p) => p.includes('otro dispositivo')),
    );

    const futura = op({ device: DEVICE_A, hlc, schemaVersion: APP_SCHEMA_VERSION + 1 });
    check(
      'una operacion de un esquema mas nuevo se rechaza pidiendo actualizar',
      validateOperation(futura).some((p) => p.includes('actualizar')),
    );
  }

  {
    check(
      'las colecciones sincronizables salen del registro central',
      SYNC_COLLECTION_KEYS.length === SYNC_COLLECTIONS.length &&
        SYNC_COLLECTION_KEYS.every((k) => (SYNC_COLLECTIONS as string[]).includes(k)),
      SYNC_COLLECTION_KEYS.join(', '),
    );
    check('las colecciones de dispositivo no se sincronizan', !isSyncCollection('deviceTest'));
    check('las copias de seguridad no se sincronizan', !isSyncCollection('backup'));
  }

  {
    // Lotes
    const hlc = (n: number) => formatHlc({ wallMs: n, counter: 0, deviceId: DEVICE_A });
    const muchas = Array.from({ length: 250 }, (_, i) => op({ device: DEVICE_A, hlc: hlc(i + 1) }));
    const lotes = batchOperations(muchas);
    check(
      '250 operaciones se parten en lotes que respetan el limite',
      lotes.every((l) => l.length <= MAX_BATCH_OPERATIONS) && lotes.flat().length === 250,
      `${lotes.length} lotes`,
    );

    const grande = op({
      device: DEVICE_A,
      hlc: hlc(1),
      payload: { texto: 'x'.repeat(200_000) },
    });
    const lotesGrandes = batchOperations([grande, op({ device: DEVICE_A, hlc: hlc(2) })], 100, 1_000);
    check(
      'una operacion que por si sola excede el limite de bytes viaja sola, no se descarta',
      lotesGrandes.flat().length === 2 && lotesGrandes.length === 2,
    );
    check('el tamano se mide en bytes UTF-8', operationSize(grande) >= 200_000);
  }

  {
    const hlc = (n: number) => formatHlc({ wallMs: n, counter: 0, deviceId: DEVICE_A });
    const desordenadas = [3, 1, 2].map((n) => op({ device: DEVICE_A, hlc: hlc(n) }));
    const ordenadas = sortOperations(desordenadas);
    check(
      'sortOperations ordena por HLC',
      ordenadas[0].hlc === hlc(1) && ordenadas[2].hlc === hlc(3),
    );
  }

  /* ────────────────────────────────────────────────────────── conflictos ── */
  line('Resolucion de conflictos');

  {
    const h = (n: number, d = DEVICE_A) => formatHlc({ wallMs: n, counter: 0, deviceId: d });

    // Dos dispositivos editan la misma serie
    const a = op({ device: DEVICE_A, hlc: h(100, DEVICE_A), payload: { weight: 100 } });
    const b = op({ device: DEVICE_B, hlc: h(200, DEVICE_B), payload: { weight: 120 } });
    const final = reduceOperations([a, b]);
    check(
      'dos dispositivos editando la misma serie: gana el HLC mayor',
      stateOf(final, 'training', 'entidad-1')?.fields.weight === 120,
    );

    const alReves = reduceOperations([b, a]);
    check(
      'y el resultado no depende del orden de llegada',
      stateOf(alReves, 'training', 'entidad-1')?.fields.weight === 120,
    );
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Alimentos distintos: no hay conflicto
    const a = op({
      device: DEVICE_A,
      hlc: h(100, DEVICE_A),
      collection: 'nutrition',
      entityId: 'comida-1',
      payload: { food: 'pollo' },
    });
    const b = op({
      device: DEVICE_B,
      hlc: h(100, DEVICE_B),
      collection: 'nutrition',
      entityId: 'comida-2',
      payload: { food: 'arroz' },
    });
    const final = reduceOperations([a, b]);
    check(
      'dos dispositivos registrando alimentos distintos conservan ambos',
      stateOf(final, 'nutrition', 'comida-1')?.fields.food === 'pollo' &&
        stateOf(final, 'nutrition', 'comida-2')?.fields.food === 'arroz',
    );
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Borrar y editar
    const editar = op({ device: DEVICE_A, hlc: h(100, DEVICE_A), payload: { weight: 100 } });
    const borrar = op({ device: DEVICE_B, hlc: h(200, DEVICE_B), type: 'delete' });

    const borradoGana = reduceOperations([editar, borrar]);
    check(
      'borrar despues de editar deja la entidad borrada',
      stateOf(borradoGana, 'training', 'entidad-1')?.deletedAt !== null,
    );

    const edicionTardía = op({ device: DEVICE_A, hlc: h(300, DEVICE_A), payload: { weight: 140 } });
    const tras = reduceOperations([editar, borrar, edicionTardía]);
    const estado = stateOf(tras, 'training', 'entidad-1');
    check(
      'una edicion posterior NO resucita lo borrado',
      estado?.deletedAt !== null && estado?.fields.weight === 140,
      'los campos se actualizan pero el tombstone se queda',
    );
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Borrar y restaurar
    const borrar = op({ device: DEVICE_A, hlc: h(100, DEVICE_A), type: 'delete' });
    const restaurar = op({ device: DEVICE_B, hlc: h(200, DEVICE_B), type: 'restore' });
    const restaurado = reduceOperations([borrar, restaurar]);
    check(
      'restaurar con HLC mayor revive la entidad',
      stateOf(restaurado, 'training', 'entidad-1')?.deletedAt === null,
    );

    const restauracionVieja = op({ device: DEVICE_B, hlc: h(50, DEVICE_B), type: 'restore' });
    const sigueBorrado = reduceOperations([borrar, restauracionVieja]);
    check(
      'una restauracion mas antigua que el borrado no gana',
      stateOf(sigueBorrado, 'training', 'entidad-1')?.deletedAt !== null,
    );
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Un delete que llega antes que el upsert que creo la entidad
    const borrar = op({ device: DEVICE_B, hlc: h(200, DEVICE_B), type: 'delete' });
    const crear = op({ device: DEVICE_A, hlc: h(100, DEVICE_A), payload: { weight: 100 } });
    const resultado = reduceOperations([borrar, crear]);
    check(
      'un borrado que llega antes que la creacion no se pierde',
      stateOf(resultado, 'training', 'entidad-1')?.deletedAt !== null,
      'tombstone anticipado',
    );

    const solo = applyOperation(null, borrar);
    check('y se registra como tal', solo.outcome === 'tombstone-anticipado');
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Merge por campo en ajustes
    check('los ajustes usan fusion por campo', strategyFor('settings') === 'field-lww');
    check('el entrenamiento usa fusion por entidad', strategyFor('training') === 'entity-lww');

    const unidades = op({
      device: DEVICE_A,
      hlc: h(100, DEVICE_A),
      collection: 'settings',
      entityId: 'ajustes',
      payload: { weightUnit: 'lb' },
    });
    const idioma = op({
      device: DEVICE_B,
      hlc: h(200, DEVICE_B),
      collection: 'settings',
      entityId: 'ajustes',
      payload: { locale: 'en' },
    });
    const final = reduceOperations([unidades, idioma]);
    const ajustes = stateOf(final, 'settings', 'ajustes');
    check(
      'cambiar unidades en un dispositivo e idioma en otro conserva ambos',
      ajustes?.fields.weightUnit === 'lb' && ajustes?.fields.locale === 'en',
    );

    const unidadesViejas = op({
      device: DEVICE_A,
      hlc: h(50, DEVICE_A),
      collection: 'settings',
      entityId: 'ajustes',
      payload: { weightUnit: 'kg' },
    });
    const conVieja = reduceOperations([unidades, idioma, unidadesViejas]);
    check(
      'un cambio mas antiguo del mismo campo no pisa al mas nuevo',
      stateOf(conVieja, 'settings', 'ajustes')?.fields.weightUnit === 'lb',
    );
  }

  {
    const h = (n: number, d: string) => formatHlc({ wallMs: n, counter: 0, deviceId: d });
    // Empate exacto de HLC: solo puede desempatar el deviceId
    const a = op({ device: DEVICE_A, hlc: h(100, DEVICE_A), payload: { v: 'A' } });
    const b = op({ device: DEVICE_B, hlc: h(100, DEVICE_B), payload: { v: 'B' } });
    const final = reduceOperations([a, b]);
    check(
      'con la misma hora y contador gana el deviceId mayor',
      stateOf(final, 'training', 'entidad-1')?.fields.v === 'B',
    );
  }

  /* ─────────────────────────────────────────────── convergencia total ── */
  line('Convergencia: el mismo conjunto, el mismo resultado');

  {
    const a = new Device(DEVICE_A);
    const b = new Device(DEVICE_B);
    let t = 1_754_923_000_000;
    const ops: SyncOperation[] = [];

    // Dos dispositivos trabajando sin verse durante un rato
    for (let i = 0; i < 40; i++) {
      t += 1_000;
      ops.push(
        a.emit(t, {
          collection: i % 2 === 0 ? 'training' : 'nutrition',
          entityId: `e-${i % 7}`,
          payload: { valor: `A${i}` },
        }),
      );
      ops.push(
        b.emit(t, {
          collection: i % 3 === 0 ? 'training' : 'body',
          entityId: `e-${i % 5}`,
          payload: { valor: `B${i}` },
        }),
      );
      if (i % 11 === 0) {
        ops.push(a.emit(t + 1, { entityId: `e-${i % 7}`, type: 'delete' }));
      }
    }

    const referencia = reduceOperations(ops);
    let iguales = true;
    let primeraDiferencia = '';
    for (let semilla = 1; semilla <= 60; semilla++) {
      const barajadas = shuffle(ops, semilla);
      const resultado = reduceOperations(barajadas);
      if (resultado.size !== referencia.size) {
        iguales = false;
        primeraDiferencia = `semilla ${semilla}: ${resultado.size} entidades vs ${referencia.size}`;
        break;
      }
      for (const [key, value] of referencia) {
        const otro = resultado.get(key);
        if (
          !otro ||
          otro.hlc !== value.hlc ||
          otro.deletedAt !== value.deletedAt ||
          JSON.stringify(otro.fields) !== JSON.stringify(value.fields)
        ) {
          iguales = false;
          primeraDiferencia = `semilla ${semilla}, entidad ${key}`;
          break;
        }
      }
      if (!iguales) break;
    }
    check(
      '60 ordenes de llegada distintos producen exactamente el mismo estado',
      iguales,
      iguales ? `${ops.length} operaciones, ${referencia.size} entidades` : primeraDiferencia,
    );
  }

  /* ────────────────────────────────────────────────────────────── outbox ── */
  line('Outbox: la cola que no pierde nada');

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    const entrada = enqueue(op({ device: DEVICE_A, hlc }));
    check('una operacion nueva entra como pendiente', entrada.state === 'pending');

    const enviando = markSending(entrada);
    check('al enviarla se cuenta el intento', enviando.state === 'sending' && enviando.attempts === 1);

    const confirmada = markAcknowledged(enviando, 1_000);
    check(
      'confirmada guarda el momento, para poder podarla despues',
      confirmada.state === 'acknowledged' && confirmada.acknowledgedAt === 1_000,
    );
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    let entrada: OutboxEntry = enqueue(op({ device: DEVICE_A, hlc }));

    // Un fallo tras otro, hasta el ultimo intento permitido
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      entrada = markFailed(markSending(entrada), 'sin red', 0, 0.5);
    }
    check(
      `tras ${MAX_ATTEMPTS - 1} fallos sigue en la cola, esperando`,
      entrada.state === 'failed',
      `intentos: ${entrada.attempts}`,
    );

    entrada = markFailed(markSending(entrada), 'sin red', 0, 0.5);
    check('al agotar los intentos pasa a dead-letter, NO se descarta', entrada.state === 'dead-letter');
    check('y conserva el motivo', entrada.lastError === 'sin red');
  }

  {
    check('el backoff crece exponencialmente', backoffMs(1, 0.5) < backoffMs(5, 0.5));
    check('y tiene techo', backoffMs(50, 0.5) === backoffMs(60, 0.5));
    check(
      'el jitter dispersa los reintentos',
      backoffMs(5, 0) !== backoffMs(5, 1),
      'sin esto, veinte dispositivos golpean a la vez al volver de un corte',
    );
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    // La app muere con operaciones en vuelo
    const enVuelo = markSending(enqueue(op({ device: DEVICE_A, hlc })));
    const confirmada = markAcknowledged(markSending(enqueue(op({ device: DEVICE_A, hlc }))), 1);
    const recuperadas = recoverOnStart([enVuelo, confirmada]);
    check(
      'lo que quedo en vuelo al morir la app vuelve a la cola',
      recuperadas[0].state === 'pending',
      'reenviar algo que ya llego es gratis; no reenviarlo cuesta un dato',
    );
    check('lo ya confirmado se queda como estaba', recuperadas[1].state === 'acknowledged');
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    // Ocho dias: por encima de la retencion de siete
    const ahora = 8 * 24 * 3600_000;
    const confirmadaVieja = {
      ...markAcknowledged(markSending(enqueue(op({ device: DEVICE_A, hlc }))), 0),
    };
    const muerta = rejectInvalid(op({ device: DEVICE_A, hlc }), 'coleccion desconocida');
    const pendiente = enqueue(op({ device: DEVICE_A, hlc }));

    const podadas = prune([confirmadaVieja, muerta, pendiente], ahora);
    check('la poda elimina las confirmadas antiguas', !podadas.includes(confirmadaVieja));
    check(
      'la poda NUNCA toca dead-letter',
      podadas.includes(muerta),
      'es un cajon visible, no una papelera',
    );
    check('ni las pendientes', podadas.includes(pendiente));
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    const invalida = rejectInvalid(op({ device: DEVICE_A, hlc }), 'motivo');
    check('una operacion invalida no se envia', invalida.state === 'dead-letter');
    check('pero se conserva entera', invalida.operation !== undefined && invalida.lastError === 'motivo');
  }

  {
    const hlc = (n: number) => formatHlc({ wallMs: n, counter: 0, deviceId: DEVICE_A });
    const ahora = 5_000;
    const lista = [
      enqueue(op({ device: DEVICE_A, hlc: hlc(1) })),
      { ...enqueue(op({ device: DEVICE_A, hlc: hlc(2) })), state: 'failed' as const, nextAttemptAt: 1_000 },
      { ...enqueue(op({ device: DEVICE_A, hlc: hlc(3) })), state: 'failed' as const, nextAttemptAt: 90_000 },
      markSending(enqueue(op({ device: DEVICE_A, hlc: hlc(4) }))),
    ];
    const listas = readyToSend(lista, ahora);
    check(
      'solo se envia lo pendiente y lo fallido cuya espera vencio',
      listas.length === 2,
      `${listas.length} de ${lista.length}`,
    );
  }

  {
    const hlc = (n: number) => formatHlc({ wallMs: n, counter: 0, deviceId: DEVICE_A });
    // 500 operaciones pendientes
    const muchas = Array.from({ length: 500 }, (_, i) =>
      enqueue(op({ device: DEVICE_A, hlc: hlc(i + 1) })),
    );
    const resumen = summarize(muchas);
    check(
      '500 operaciones pendientes se resumen sin perder ninguna',
      resumen.pending === 500 && resumen.total === 500,
    );
    check('y no disparan el aviso de cola desbordada', !resumen.overWarnSize);

    const lotes = batchOperations(muchas.map((e) => e.operation));
    check(
      'y se envian en lotes que caben',
      lotes.flat().length === 500 && lotes.every((l) => l.length <= MAX_BATCH_OPERATIONS),
      `${lotes.length} lotes`,
    );
  }

  {
    const hlc = formatHlc({ wallMs: 1, counter: 0, deviceId: DEVICE_A });
    // Duplicados: la misma operacion enviada dos veces
    const original = op({ device: DEVICE_A, hlc });
    const reenviada = { ...original };
    const final = reduceOperations([original, reenviada]);
    check(
      'aplicar la misma operacion dos veces da el mismo estado',
      final.size === 1 && stateOf(final, 'training', 'entidad-1')?.hlc === hlc,
    );

    const primera = applyOperation(null, original);
    const segunda = applyOperation(primera.next, reenviada);
    check('y la segunda vez no cambia nada', !segunda.changed);
  }
}
