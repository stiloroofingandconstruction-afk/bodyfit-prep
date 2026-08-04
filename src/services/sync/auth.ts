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

/*
 * No se llama `URL` a proposito: tapaba el constructor global `URL`, y el dia
 * que hizo falta construir una con parametros de query el error fue
 * "This expression is not constructable", que no apunta a la causa.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
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
  if (!SUPABASE_URL || !ANON) throw new Error('Supabase no configurado');

  /*
   * `redirect_to` va en la QUERY, no en el cuerpo.
   *
   * `options.emailRedirectTo` es la forma del cliente `supabase-js`, que la
   * traduce a este parametro por debajo. Mandandolo en el cuerpo, el endpoint
   * REST lo IGNORA en silencio —no da error— y el enlace vuelve siempre al Site
   * URL del proyecto. Con un solo entorno no se nota; con preview y produccion
   * a la vez, manda a la gente al sitio equivocado.
   *
   * El destino tiene que estar ademas en la lista de Redirect URLs del
   * proyecto, o GoTrue lo descarta y usa el Site URL igualmente.
   */
  const endpoint = new URL(`${SUPABASE_URL}/auth/v1/otp`);
  endpoint.searchParams.set('redirect_to', `${location.origin}/ajustes/cuenta`);

  const res = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, create_user: true }),
  });

  if (!res.ok) {
    // 429: Supabase limita el envio de correos. Decirlo en vez de "error 429".
    if (res.status === 429) {
      throw new Error('Demasiados intentos. Espera unos minutos antes de pedir otro.');
    }
    throw new Error(`no se pudo enviar el enlace: ${res.status}`);
  }
}

/**
 * Verifica el codigo de seis digitos.
 *
 * Existe ademas del enlace porque en un iPhone con la aplicacion instalada el
 * enlace del correo abre Safari, no la PWA, y la sesion acabaria en el sitio
 * equivocado. Teclear el codigo mantiene a la persona dentro de la aplicacion.
 */
export async function verifyOtp(email: string, token: string): Promise<Session> {
  if (!SUPABASE_URL || !ANON) throw new Error('Supabase no configurado');

  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, token, type: 'email' }),
  });
  if (!res.ok) throw new Error('el codigo no es valido o ha caducado');

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { id: string; email: string };
  };

  adoptSession({
    userId: data.user.id,
    email: data.user.email,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  });
  return session!;
}

/**
 * Recoge la sesion que llega en el fragmento de la URL tras seguir el enlace.
 *
 * Supabase la manda en el `#` y no en la query: el fragmento no viaja al
 * servidor, asi que el token no acaba en los registros de acceso de nadie. Se
 * limpia de la barra de direcciones en cuanto se guarda, para que no quede en
 * el historial ni se comparta al copiar el enlace.
 */
export function captureRedirectSession(): Session | null {
  if (typeof location === 'undefined' || !location.hash.includes('access_token')) return null;

  const params = new URLSearchParams(location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  /*
   * El `sub` y el correo salen del propio token. No se verifica la firma aqui:
   * el cliente no puede hacerlo de forma util, y quien decide si el token vale
   * es el servidor en cada peticion. Aqui solo se lee para poder ensenar el
   * correo en pantalla.
   */
  const claims = decodeJwtPayload(accessToken);
  if (!claims?.sub) return null;

  adoptSession({
    userId: String(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : '',
    accessToken,
    refreshToken,
    expiresIn: Number(params.get('expires_in') ?? 3600),
  });

  history.replaceState(null, '', location.pathname + location.search);
  return session;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Quedan menos de cinco minutos: toca renovar antes de la siguiente peticion. */
export function sessionExpiresSoon(now = Date.now()): boolean {
  const current = load();
  return current !== null && current.expiresAt - now < 5 * 60_000;
}

/**
 * Renueva el token.
 *
 * Si el refresco falla NO se cierra la sesion ni se borra nada: puede ser un
 * corte de red pasajero, y desloguear a alguien porque el metro entro en un
 * tunel seria absurdo. La sincronizacion fallara, reintentara, y cuando vuelva
 * la red se renovara.
 */
export async function refreshSession(): Promise<Session | null> {
  const current = load();
  if (!current || !SUPABASE_URL || !ANON) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON },
      body: JSON.stringify({ refresh_token: current.refreshToken }),
    });
    if (!res.ok) return current;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; email: string };
    };
    adoptSession({
      userId: data.user.id,
      email: data.user.email,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
    return session;
  } catch {
    return current;
  }
}

/**
 * Correo enmascarado, para pantallas y diagnosticos.
 *
 * `gustavo@ejemplo.com` -> `gus***@ejemplo.com`. Es suficiente para que la
 * persona reconozca su cuenta y no expone la direccion completa en una captura
 * de pantalla o en un archivo de diagnostico que quiza acabe en un correo.
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const visible = user.slice(0, Math.min(3, user.length));
  return `${visible}***@${domain}`;
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
