/**
 * Migraciones de almacenamiento.
 *
 * Cada store persistido declara su `version`. Cuando la version guardada en el
 * dispositivo es menor que la del codigo, zustand llama a `migrate` con el
 * estado antiguo y este modulo lo transforma paso a paso.
 *
 * Regla: las migraciones NUNCA borran datos. Solo anaden campos con valores por
 * defecto o renombran. Un usuario que ya tenia datos debe poder actualizar la
 * app sin perder nada.
 */

export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/**
 * Aplica en orden todas las migraciones desde la version almacenada hasta la
 * actual. `migrations[n]` transforma de la version n a la n+1.
 */
export function runMigrations(
  state: unknown,
  fromVersion: number,
  migrations: Record<number, Migration>,
): unknown {
  if (!state || typeof state !== 'object') return state;
  let current = state as Record<string, unknown>;
  const versions = Object.keys(migrations)
    .map(Number)
    .filter((v) => v >= fromVersion)
    .sort((a, b) => a - b);

  for (const v of versions) {
    try {
      current = migrations[v](current);
    } catch (err) {
      // Una migracion que falla no debe dejar al usuario sin app: se conserva
      // el estado tal cual y se registra el problema.
      console.error(`[migracion] fallo al migrar de la version ${v}`, err);
      break;
    }
  }
  return current;
}

/** Garantiza que un array existe. Util en casi todas las migraciones. */
export function ensureArray(state: Record<string, unknown>, key: string): void {
  if (!Array.isArray(state[key])) state[key] = [];
}

/** Garantiza que un campo escalar existe con un valor por defecto. */
export function ensureField<T>(state: Record<string, unknown>, key: string, value: T): void {
  if (state[key] === undefined || state[key] === null) state[key] = value;
}

/* ───────────────────────────────────────── migraciones por coleccion ──── */

/**
 * v1 -> v2 del perfil: se anaden preferencias de competencia y de unidades que
 * antes no existian.
 */
export const profileMigrations: Record<number, Migration> = {
  1: (s) => {
    const profile = (s.profile ?? {}) as Record<string, unknown>;
    ensureField(profile, 'units', 'metric');
    ensureField(profile, 'experience', 'intermedio');
    ensureField(profile, 'trainingDays', 4);
    ensureField(profile, 'restrictions', []);
    s.profile = profile;
    return s;
  },
};

/** v1 -> v2 de nutricion: listas de exclusiones y planes por dia. */
export const nutritionMigrations: Record<number, Migration> = {
  1: (s) => {
    ensureArray(s, 'excluded');
    ensureArray(s, 'dayPlans');
    return s;
  },
};

/** v1 -> v2 de cuerpo: las fotos pasan a su propia coleccion. */
export const bodyMigrations: Record<number, Migration> = {
  1: (s) => {
    ensureArray(s, 'measurements');
    return s;
  },
};

/** v1 -> v2 de check-ins: campos ampliados con valores neutros. */
export const checkinMigrations: Record<number, Migration> = {
  1: (s) => {
    const list = Array.isArray(s.checkins) ? (s.checkins as Record<string, unknown>[]) : [];
    for (const c of list) {
      ensureField(c, 'digestion', 3);
      ensureField(c, 'strength', 3);
      ensureField(c, 'steps', 0);
      ensureField(c, 'cardioMinutes', 0);
      ensureField(c, 'measurements', {});
    }
    s.checkins = list;
    return s;
  },
};
