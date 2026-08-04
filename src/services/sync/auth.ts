/**
 * Cuenta opcional.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS REGLAS, POR ORDEN DE IMPORTANCIA
 *
 *   1. La aplicacion funciona entera sin cuenta. Sin degradacion.
 *   2. Iniciar o cerrar sesion NO borra nada local. Nunca.
 *   3. Nunca se mezclan datos de dos personas.
 *   4. Antes de cualquier fusion se genera una copia de seguridad completa.
 *   5. La adopcion de datos locales es idempotente: se puede repetir.
 *
 * La regla 3 es la que mas importa. Fusionar automaticamente los datos de dos
 * personas es el peor fallo posible en una aplicacion de salud: nadie puede
 * deshacerlo despues, porque ya no se sabe que era de quien.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { STORAGE_PREFIX } from '@bodyfit/domain/collections';

const SESSION_KEY = `${STORAGE_PREFIX}sync:session`;

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface Session {
  readonly userId: string;
  readonly email: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
}

let session: Session | null = null;
let loaded = false;

function load(): Session | null {
  if (loaded) return session;
  loaded = true;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  return session;
}

export function currentSession(): Session | null {
  return load();
}

export function isSignedIn(): boolean {
  return load() !== null;
}

function store(next: Session | null): void {
  session = next;
  loaded = true;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Sin persistencia la sesion dura lo que la pestana. */
  }
}

/* ══════════════════════════════════════════════════════════ enlace magico ══ */

/**
 * Envia un enlace de acceso al correo.
 *
 * Sin contrasenas: una contrasena mas que recordar, mas que filtrar y mas que
 * recuperar, a cambio de nada. Apple Sign In se anadira cuando la aplicacion
 * entre en la App Store; en cuanto haya cualquier proveedor social sera
 * obligatorio por la guia 4.8.
 */
export async function sendMagicLink(email: string): Promise<void> {
  if (!URL || !ANON) throw new Error('Supabase no configurado');

  const res = await fetch(`${URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!res.ok) throw new Error(`no se pudo enviar el enlace: ${res.status}`);
}

/** Guarda la sesion que devuelve Supabase tras seguir el enlace. */
export function adoptSession(input: {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): void {
  store({
    userId: input.userId,
    email: input.email,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: Date.now() + input.expiresIn * 1000,
  });
}

/**
 * Cierra la sesion.
 *
 * **No toca ni un byte de los datos locales.** La persona sigue teniendo su
 * historial entero en el dispositivo, exactamente como antes de tener cuenta.
 * Borrar al cerrar sesion seria interpretar "salir" como "destruir", y son
 * cosas distintas.
 *
 * Si algun dia se ofrece borrar al salir, sera una casilla aparte, apagada por
 * defecto, y con la misma confirmacion fuerte que protege el borrado total.
 */
export function signOut(): void {
  store(null);
}

/* ════════════════════════════════════════════════ adopcion de lo local ══ */

export type AdoptionChoice = 'fusionar' | 'quedarme-con-lo-local' | 'quedarme-con-la-nube';

export interface AdoptionPlan {
  /** Registros que hay en este dispositivo. */
  readonly localEntities: number;
  /** Registros que ya hay en la cuenta. */
  readonly remoteEntities: number;
  /** Si la cuenta esta vacia no hay nada que preguntar. */
  readonly needsChoice: boolean;
  /** Identificador del usuario con el que se guardaron los datos locales. */
  readonly previousUserId: string | null;
}

/**
 * ¿Los datos locales son de otra persona?
 *
 * Si lo son, NO se fusiona y no se ofrece fusionar. Se ofrece archivar lo local
 * en un archivo o mantener los dos perfiles separados. Es la regla 3.
 */
export function belongsToAnotherUser(localUserId: string | null, nextUserId: string): boolean {
  return localUserId !== null && localUserId !== nextUserId;
}
