/**
 * Cuando sincronizar. Sin que nadie pulse nada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Habia tres botones "Sincronizar ahora" y nada mas.
 *
 * Ni al abrir la aplicacion, ni al recuperar la red, ni cada cierto tiempo. Los
 * cambios se quedaban en la cola hasta que alguien entraba en una pantalla de
 * ajustes y pulsaba. Como producto eso no funciona: la gente no entra en
 * ajustes despues de registrar una comida.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cuatro disparadores, y cada uno responde a un momento real:
 *
 *   · al abrir            — traerse lo que hicieron los otros dispositivos
 *   · al volver la red    — vaciar lo que se acumulo sin cobertura
 *   · al volver a primer plano — el movil estuvo en el bolsillo media hora
 *   · cada pocos minutos  — para las sesiones largas con la app abierta
 *
 * Y uno mas, corto, tras cada cambio: registrar una comida y que llegue al otro
 * dispositivo en segundos es lo que hace que esto parezca sincronizacion y no
 * una exportacion manual.
 */
import { flush, pull } from './engine';
import { applyRemoteOperations } from './apply';
import { syncEnabled } from './flag';

/** Con la app abierta y quieta. No hace falta mas: nadie mira dos pantallas a la vez. */
const PERIODIC_MS = 3 * 60_000;
/** Tras un cambio. Suficiente para agrupar una racha de ediciones en un solo envio. */
const AFTER_CHANGE_MS = 2_000;

let started = false;
let periodic: ReturnType<typeof setInterval> | null = null;
let afterChange: ReturnType<typeof setTimeout> | null = null;
/**
 * El ciclo en curso, si lo hay.
 *
 * Se guarda la PROMESA y no un booleano. Con un booleano, pulsar "Sincronizar
 * ahora" mientras corria el ciclo automatico devolvia al instante sin hacer
 * nada: el boton parecia roto y quien lo pulsaba se quedaba sin sus datos.
 * Devolviendo la promesa en vuelo, esperar al ciclo que ya hay es exactamente
 * lo que la persona pidio.
 */
let enCurso: Promise<void> | null = null;

/**
 * Un ciclo completo: subir lo pendiente y bajar lo de los demas.
 *
 * Nunca lanza. Un fallo de red es lo normal aqui, no una excepcion: el motor ya
 * reintenta con espera creciente y lo unico que hace falta es no romper la
 * pantalla desde la que se llamo.
 */
export function syncNow(): Promise<void> {
  if (!syncEnabled()) return Promise.resolve();
  if (enCurso) return enCurso;

  enCurso = (async () => {
    try {
      await flush();
      await pull(async (ops) => (await applyRemoteOperations(ops)).changed);
    } catch (err) {
      console.warn('[sync] ciclo incompleto', err);
    } finally {
      enCurso = null;
    }
  })();

  return enCurso;
}

/** Tras un cambio local. Agrupa una racha de ediciones en un solo envio. */
export function syncSoon(): void {
  if (!syncEnabled()) return;
  if (afterChange) clearTimeout(afterChange);
  afterChange = setTimeout(() => void syncNow(), AFTER_CHANGE_MS);
}

function onOnline(): void {
  void syncNow();
}

function onVisible(): void {
  if (document.visibilityState === 'visible') void syncNow();
}

/**
 * Arranca los disparadores.
 *
 * Idempotente: llamarlo dos veces no duplica temporizadores ni escuchas. Con la
 * sincronizacion apagada no hace absolutamente nada, que es el caso de
 * produccion hoy.
 */
export function startSyncScheduler(): void {
  if (started || !syncEnabled()) return;
  started = true;

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  periodic = setInterval(() => {
    // Solo con la pestana visible: sincronizar en segundo plano gasta bateria
    // para nada, porque nadie esta mirando el resultado.
    if (document.visibilityState === 'visible') void syncNow();
  }, PERIODIC_MS);

  /*
   * El primer ciclo no compite con el primer pintado. La sincronizacion es
   * importante y no es urgente: que la aplicacion abra rapido lo es mas.
   */
  setTimeout(() => void syncNow(), 1_500);
}

export function stopSyncScheduler(): void {
  if (!started) return;
  started = false;
  window.removeEventListener('online', onOnline);
  document.removeEventListener('visibilitychange', onVisible);
  if (periodic) clearInterval(periodic);
  if (afterChange) clearTimeout(afterChange);
  periodic = null;
  afterChange = null;
}
