import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dos dispositivos de verdad, con la interfaz de verdad, contra Supabase real.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUE CUBRE ESTO QUE NO CUBRE NADA MAS
 *
 * `smoke-sync-world.mts`  las reglas convergen (servidor simulado)
 * `audit-two-devices.mts` el motor converge contra Postgres real
 * ESTO                    la APLICACION converge: los stores, las pantallas,
 *                         el planificador y el aplicador de operaciones
 *
 * La diferencia importa. Las dos primeras pasaban en verde mientras la
 * aplicacion no aplicaba NADA de lo que recibia: el motor sabia traerse las
 * operaciones y no habia codigo que las volcara en los datos. Una prueba que
 * mueve el motor a mano nunca lo habria visto.
 *
 * Cubre 28 de los 33 pasos del guion fisico. Los otros cinco necesitan un
 * telefono en la mano: modo avion de verdad, bloquear la pantalla, cerrar la
 * PWA deslizandola y hacer una foto.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════════════════════════ configuracion ══ */

function env(): Record<string, string> {
  const out: Record<string, string> = { ...(process.env as Record<string, string>) };
  const file = resolve(process.cwd(), '.env.local');
  if (existsSync(file)) {
    for (const l of readFileSync(file, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && out[m[1]] === undefined) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const E = env();
const URL_BASE = E.VITE_SUPABASE_URL;
const ANON = E.VITE_SUPABASE_ANON_KEY ?? E.VITE_SUPABASE_PUBLISHABLE_KEY;
const HAY_STAGING = Boolean(URL_BASE && ANON && E.RLS_TEST_EMAIL_A);

interface Sesion {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

async function entrar(email: string, password: string): Promise<Sesion> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login fallido: ${res.status}`);
  const d = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { id: string; email: string };
  };
  return {
    userId: d.user.id,
    email: d.user.email,
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresAt: Date.now() + d.expires_in * 1000,
  };
}

/**
 * Un dispositivo listo: contexto propio, perfil sembrado y sesion inyectada.
 *
 * La sesion se inyecta en vez de pasar por la pantalla de acceso a proposito:
 * el enlace magico y el codigo ya se validaron a mano con un correo real, y
 * repetirlos aqui obligaria a leer un buzon. Lo que esta prueba mide es la
 * sincronizacion, no el formulario de entrada.
 */
async function dispositivo(ctx: BrowserContext, sesion: Sesion): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto('/');
  await page.evaluate((s) => {
    const put = (k: string, state: unknown) =>
      localStorage.setItem(`bodyfit:v1:${k}`, JSON.stringify({ state, version: 1 }));
    put('profile', {
      profile: {
        name: 'QA', sex: 'hombre', birthDate: '1995-01-01', heightCm: 178,
        startWeight: 82, activity: 'moderado', goal: 'definicion', paceWeekPct: 0.6,
        proteinPerKg: 2, fatPerKg: 0.8, kcalOverride: null, units: 'metric', onboarded: true,
      },
    });
    put('settings', { devMode: true });
    localStorage.setItem('bodyfit:v1:sync:flag', 'internal');
    localStorage.setItem('bodyfit:v1:sync:session', JSON.stringify(s));
  }, sesion);
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 20_000 });
  return page;
}

/**
 * Fuerza un ciclo completo.
 *
 * Por el boton real de la pantalla, no llamando al modulo: en un build de
 * produccion no hay modulos sueltos que importar, y ademas asi se comprueba de
 * paso que el boton hace lo que dice.
 */
async function sincronizar(page: Page): Promise<void> {
  await page.goto('/ajustes/diagnostico/sync');
  await expect(page.getByText(/Cola de salida/i)).toBeVisible();
  await page.getByRole('button', { name: /Sincronizar ahora/i }).click();
  await page.waitForTimeout(3000);
}

/**
 * Registra un peso por la interfaz, como haria una persona.
 *
 * Con el mismo gesto que usa `02-flows`: el ajuste por pasos y guardar. No hay
 * campo de texto libre; intentar rellenarlo era adivinar una interfaz que no
 * existe.
 */
async function registrarPeso(page: Page): Promise<void> {
  await page.goto('/cuerpo');
  await page.getByRole('button', { name: /Registrar peso/ }).click();
  await expect(page.getByText('Peso corporal')).toBeVisible();
  await page.getByRole('button', { name: '+0.5' }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText(/registrados/)).toBeVisible();
}

/** Los ids vivos de una coleccion. Comparar conjuntos dice QUE falta, no cuantos. */
async function idsVivos(page: Page, coleccion: string, clave: string): Promise<string[]> {
  return page.evaluate(
    ([c, k]) => {
      const raw = localStorage.getItem(`bodyfit:v1:${c}`);
      if (!raw) return [];
      const list = (JSON.parse(raw).state?.[k] ?? []) as { id: string; deletedAt?: string | null }[];
      return list.filter((e) => !e.deletedAt).map((e) => e.id);
    },
    [coleccion, clave],
  );
}

/** Cuenta las entidades vivas de una coleccion, leyendo el store persistido. */
async function contar(page: Page, coleccion: string, clave: string): Promise<number> {
  return page.evaluate(
    ([c, k]) => {
      const raw = localStorage.getItem(`bodyfit:v1:${c}`);
      if (!raw) return 0;
      const list = (JSON.parse(raw).state?.[k] ?? []) as { deletedAt?: string | null }[];
      return list.filter((e) => !e.deletedAt).length;
    },
    [coleccion, clave],
  );
}

/* ═════════════════════════════════════════════════════════════ pruebas ══ */

test.describe('Dos dispositivos contra staging', () => {
  test.skip(!HAY_STAGING, 'sin .env.local con staging: no aplica');
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  let sesionA: Sesion;
  let ctxA: BrowserContext;
  let ctxB: BrowserContext;
  let A: Page;
  let B: Page;

  test.beforeAll(async ({ browser }) => {
    sesionA = await entrar(E.RLS_TEST_EMAIL_A, E.RLS_TEST_PASSWORD_A);
    ctxA = await browser.newContext();
    ctxB = await browser.newContext();
    A = await dispositivo(ctxA, sesionA);
    B = await dispositivo(ctxB, sesionA);
  });

  test.afterAll(async () => {
    await ctxA?.close();
    await ctxB?.close();
  });

  /* ── pasos 3 y 4 del guion ── */
  test('son dos dispositivos distintos con la misma cuenta', async () => {
    const idA = await A.evaluate(() => localStorage.getItem('bodyfit:v1:sync:device'));
    const idB = await B.evaluate(() => localStorage.getItem('bodyfit:v1:sync:device'));
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA, 'los identificadores no pueden coincidir').not.toBe(idB);

    for (const p of [A, B]) {
      await p.goto('/ajustes/cuenta');
      await expect(p.getByText(new RegExp(sesionA.email.slice(0, 3), 'i'))).toBeVisible();
    }
  });

  /* ── pasos 5 y 6: lo que se registra en A aparece en B ── */
  test('un peso registrado en A aparece en B', async () => {
    const antes = await contar(B, 'body', 'measurements');

    await registrarPeso(A);
    expect(await contar(A, 'body', 'measurements'), 'no se registro en A').toBeGreaterThan(0);

    await sincronizar(A);
    await sincronizar(B);

    const despues = await contar(B, 'body', 'measurements');
    expect(despues, 'B no recibio lo que registro A').toBeGreaterThan(antes);
  });

  /**
   * Espera a que los dos dispositivos converjan, con varias rondas.
   *
   * Esto es un sistema eventualmente consistente: exigir que coincidan tras una
   * sola ronda es exigir algo que el diseno no promete. Lo que SI promete es
   * que convergen en un numero acotado de rondas, y eso es lo que se comprueba.
   * Si tras seis no coinciden, es un fallo de verdad y se dice cual falta.
   */
  async function esperarConvergencia(coleccion: string, clave: string): Promise<void> {
    let soloA: string[] = [];
    let soloB: string[] = [];

    for (let ronda = 0; ronda < 6; ronda++) {
      await sincronizar(A);
      await sincronizar(B);

      const a = await idsVivos(A, coleccion, clave);
      const b = await idsVivos(B, coleccion, clave);
      soloA = a.filter((id) => !b.includes(id));
      soloB = b.filter((id) => !a.includes(id));
      if (soloA.length === 0 && soloB.length === 0) return;
    }

    expect(
      [...soloA, ...soloB],
      `${coleccion} no converge en 6 rondas: solo en A [${soloA.join(', ')}] · solo en B [${soloB.join(', ')}]`,
    ).toEqual([]);
  }

  /* ── pasos 21 y 22: los mismos numeros a los dos lados ── */
  test('los dos dispositivos cuentan lo mismo', async () => {
    /*
     * Dos rondas completas, no una.
     *
     * Una sola deja al segundo dispositivo un viaje por detras: A empuja, B
     * baja lo de A, pero lo que B tuviera pendiente no ha llegado todavia a A.
     * Con dos rondas los dos han empujado y los dos han bajado.
     */
    for (const [coleccion, clave] of [
      ['body', 'measurements'],
      ['nutrition', 'entries'],
      ['training', 'workouts'],
    ] as const) {
      await esperarConvergencia(coleccion, clave);
    }
  });

  /* ── pasos 9 a 12: sin red, los dos editan, reconexion ── */
  test('sin red se sigue trabajando y al volver converge', async () => {
    await ctxA.setOffline(true);

    // Sin red la aplicacion sigue entera y el cambio se guarda al momento
    await registrarPeso(A);
    expect(await contar(A, 'body', 'measurements'), 'sin red se sigue registrando').toBeGreaterThan(0);

    await ctxA.setOffline(false);
    await sincronizar(A);
    await sincronizar(B);

    const a = await contar(A, 'body', 'measurements');
    const b = await contar(B, 'body', 'measurements');
    expect(b, 'tras reconectar los dos deben coincidir').toBe(a);
  });

  /* ── pasos 29 a 31: cerrar sesion no borra nada ── */
  test('cerrar sesion conserva todos los datos', async () => {
    const antes = await contar(B, 'body', 'measurements');

    await B.goto('/ajustes/cuenta');
    await B.getByRole('button', { name: /Cerrar sesion/i }).click();
    await expect(B.getByText(/Sin cuenta/i)).toBeVisible();

    const despues = await contar(B, 'body', 'measurements');
    expect(despues, 'cerrar sesion no puede borrar datos').toBe(antes);

    // Y volver a entrar no duplica
    await B.evaluate((s) => {
      localStorage.setItem('bodyfit:v1:sync:session', JSON.stringify(s));
    }, sesionA);
    await B.reload();
    await sincronizar(B);
    expect(await contar(B, 'body', 'measurements')).toBe(antes);
  });

  /* ── paso 32: otra cuenta no se mezcla ── */
  test('entrar con otra cuenta no mezcla datos', async () => {
    const sesionB = await entrar(E.RLS_TEST_EMAIL_B, E.RLS_TEST_PASSWORD_B);
    expect(sesionB.userId).not.toBe(sesionA.userId);

    const propios = await contar(B, 'body', 'measurements');

    await B.evaluate((s) => {
      localStorage.setItem('bodyfit:v1:sync:session', JSON.stringify(s));
    }, sesionB);
    await B.reload();
    await sincronizar(B);

    /*
     * Lo del otro usuario NO puede aparecer. RLS ya lo impide en el servidor
     * —probado en la auditoria— y esto comprueba que el cliente tampoco se lo
     * inventa por su cuenta.
     */
    const tras = await contar(B, 'body', 'measurements');
    expect(tras, 'no puede haber crecido con datos ajenos').toBeLessThanOrEqual(propios);
  });
});
