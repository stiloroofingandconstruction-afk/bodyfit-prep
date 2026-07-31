import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertClean,
  collectProblems,
  completeOnboarding,
  seedApp,
  SHOTS,
} from './helpers';

/**
 * Flujos completos de uso real.
 *
 * A — usuario recreativo: del onboarding a la copia de seguridad.
 * B — preparacion de competencia: 14 dias de peso, cardio, posing, check-in.
 * C — cambio de dispositivo: exportar, borrar, importar y comprobar que TODO
 *     vuelve, incluidas las fotos.
 * D — actualizacion: datos con esquema antiguo, migracion y cero perdidas.
 *
 * Todo lo que se afirma se comprueba leyendo el estado real del navegador, no
 * suponiendo que la interfaz hizo su trabajo.
 */

/** Lee una coleccion persistida tal cual esta en el almacenamiento. */
async function readStore(page: Page, name: string): Promise<Record<string, unknown> | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(`bodyfit:v1:${key}`);
    if (!raw) return null;
    return (JSON.parse(raw) as { state: Record<string, unknown> }).state;
  }, name);
}

/** Crea una foto de progreso real (PNG 1×1) pasando por el almacen de blobs. */
async function seedPhoto(page: Page, id = 'photo_e2e'): Promise<void> {
  await page.evaluate(async (blobId) => {
    // PNG 1x1 transparente
    const bytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ),
      (c) => c.charCodeAt(0),
    );

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('bodyfit-media', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('photos', 'readwrite');
        tx.objectStore('photos').put({ type: 'image/png', data: bytes.buffer }, blobId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    const now = new Date().toISOString();
    localStorage.setItem(
      'bodyfit:v1:photos',
      JSON.stringify({
        state: {
          photos: [
            {
              id: 'ph1', createdAt: now, updatedAt: now, deletedAt: null, userId: null,
              date: now.slice(0, 10), angle: 'frente', blobId, weight: 82.1,
            },
          ],
        },
        version: 1,
      }),
    );
  }, id);
}

/* ═══════════════════════════════════════════════════ FLUJO A ═══════════ */

test('flujo A · usuario recreativo: onboarding, comida, entreno, peso, copia', async ({ page }) => {
  const problems = collectProblems(page);

  await completeOnboarding(page, { name: 'Ana' });
  await page.screenshot({ path: resolve(SHOTS, 'flujoA-1-inicio.png'), fullPage: true });

  /* ── comida ── */
  await page.goto('/nutricion');
  await page.getByRole('button', { name: /^Anadir a /i }).first().click();
  const search = page.getByPlaceholder(/Pollo, arroz/i);
  await search.fill('pollo');
  await page.getByRole('button', { name: /Pollo/i }).first().click();
  // Paso de gramos: teclado numerico propio
  for (const digit of ['1', '5', '0']) {
    await page.getByRole('button', { name: digit, exact: true }).first().click();
  }
  await page.getByRole('dialog').getByRole('button', { name: /^Anadir 150/ }).click();

  const nutrition = await readStore(page, 'nutrition');
  expect(Array.isArray(nutrition?.entries) && (nutrition!.entries as unknown[]).length).toBeGreaterThan(0);
  await page.screenshot({ path: resolve(SHOTS, 'flujoA-2-nutricion.png'), fullPage: true });

  /* ── entrenamiento ── */
  await page.goto('/entrenamiento');
  await page.getByRole('button', { name: /Entreno libre/i }).click();
  await expect(page).toHaveURL(/entrenamiento\/activo/);
  await page.getByRole('button', { name: /Anadir ejercicio/i }).first().click();
  await page.getByPlaceholder(/Press de banca/i).fill('press de banca');
  await page.getByRole('button', { name: /Press de banca/i }).first().click();
  await page.getByRole('button', { name: /Completar serie/i }).first().click();
  await page.getByRole('button', { name: /^Terminar$/ }).click();
  await page.getByRole('button', { name: /Guardar entreno/i }).click();

  const training = await readStore(page, 'training');
  expect((training?.workouts as unknown[]).length, 'el entreno no se guardo').toBeGreaterThan(0);
  await page.screenshot({ path: resolve(SHOTS, 'flujoA-3-entreno.png'), fullPage: true });

  /* ── peso ── */
  await page.goto('/cuerpo');
  await page.getByRole('button', { name: /Registrar peso/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^Guardar$/ }).click();
  const body = await readStore(page, 'body');
  expect((body?.measurements as unknown[]).length).toBeGreaterThan(0);

  /* ── historial ── */
  await page.goto('/historial');
  await expect(page.getByRole('heading', { name: /Historial/i })).toBeVisible();

  /* ── copia de seguridad ── */
  await page.goto('/ajustes/datos');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Crear copia/i }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^bodyfit-copia-\d{4}-\d{2}-\d{2}\.json$/);

  const backupStore = await readStore(page, 'backup');
  expect(backupStore?.lastBackupAt, 'no se registro la fecha de la copia').toBeTruthy();
  await page.screenshot({ path: resolve(SHOTS, 'flujoA-4-respaldo.png'), fullPage: true });

  assertClean(problems, 'flujo A');
});

/* ═══════════════════════════════════════════════════ FLUJO B ═══════════ */

test('flujo B · preparacion de competencia completa', async ({ page }) => {
  const problems = collectProblems(page);

  // El sembrado ya trae 14 dias de peso: reproducirlos por interfaz seria
  // teclear 14 formularios identicos sin comprobar nada nuevo.
  await seedApp(page, true);

  await page.goto('/competencia');
  await expect(page.getByText(/Show de prueba/)).toBeVisible();
  await page.screenshot({ path: resolve(SHOTS, 'flujoB-1-competencia.png'), fullPage: true });

  /* ── registro diario ── */
  await page.goto('/diario');
  await page.getByRole('button', { name: /Guardar registro/i }).click();
  const prep = await readStore(page, 'prep');
  expect((prep?.readiness as unknown[]).length, 'faltan registros de peso').toBeGreaterThanOrEqual(14);

  /* ── cardio ── */
  await page.goto('/cardio');
  await page.getByRole('button', { name: /^Registrar sesion$/ }).click();
  const cardioSheet = page.getByRole('dialog');
  await expect(cardioSheet).toBeVisible();
  await cardioSheet.getByRole('button', { name: /^Guardar sesion$/ }).click();
  await expect(cardioSheet).toBeHidden();
  const activity = await readStore(page, 'activity');
  expect((activity?.cardioSessions as unknown[]).length).toBeGreaterThan(0);

  /* ── posing ── */
  await page.goto('/posing');
  await page.getByRole('button', { name: /^Empezar sesion$/ }).click();
  const posingSheet = page.getByRole('dialog');
  await expect(posingSheet).toBeVisible();
  await posingSheet.getByRole('button', { name: /^Terminar y guardar$/ }).click();
  await expect(posingSheet).toBeHidden();
  const activity2 = await readStore(page, 'activity');
  expect((activity2?.posingSessions as unknown[]).length).toBeGreaterThan(0);
  await page.screenshot({ path: resolve(SHOTS, 'flujoB-2-posing.png'), fullPage: true });

  /* ── fotos simuladas y comparacion ── */
  await seedPhoto(page);
  await page.goto('/fotos');
  await expect(page.getByRole('heading', { name: /Fotos de progreso/i })).toBeVisible();
  await page.screenshot({ path: resolve(SHOTS, 'flujoB-3-fotos.png'), fullPage: true });

  /* ── check-in y recomendacion ── */
  await page.goto('/checkin');
  await expect(page.getByText(/Recomendacion/)).toBeVisible();
  await page.screenshot({ path: resolve(SHOTS, 'flujoB-4-checkin.png'), fullPage: true });

  /*
   * Rechazar la recomendacion tambien debe guardar el check-in: los datos de la
   * semana valen aunque no se acepte el ajuste. Si no hay recomendacion que
   * resolver, se usa el boton explicito de guardar.
   */
  const reject = page.getByRole('button', { name: /^Rechazar$/ });
  if (await reject.count()) {
    await reject.first().click();
  } else {
    await page.getByRole('button', { name: /Guardar check-in sin aplicar/i }).click();
  }
  await expect
    .poll(async () => {
      const store = await readStore(page, 'checkins');
      return ((store?.checkins as unknown[] | undefined) ?? []).length;
    }, { message: 'el check-in no se guardo', timeout: 10_000 })
    .toBeGreaterThan(0);

  /* ── informe para coach ── */
  await page.goto('/informes');
  await page.getByRole('button', { name: /Ver resumen/i }).click();
  const preview = page.getByRole('dialog');
  await expect(preview).toBeVisible();
  await expect(preview.locator('pre')).toContainText(/BodyFit|Semana|Peso/);
  await page.screenshot({ path: resolve(SHOTS, 'flujoB-5-informe.png'), fullPage: true });

  assertClean(problems, 'flujo B');
});

/* ═══════════════════════════════════════════════════ FLUJO C ═══════════ */

test('flujo C · cambio de dispositivo: exportar, borrar, importar y comparar', async ({ page }) => {
  const problems = collectProblems(page);

  await seedApp(page, true);
  await seedPhoto(page);
  await page.reload();

  /* ── huella del estado original ── */
  const before = await page.evaluate(async () => {
    const stores: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bodyfit:v1:')) stores[key] = localStorage.getItem(key) ?? '';
    }
    const photoIds = await new Promise<string[]>((resolve) => {
      const req = indexedDB.open('bodyfit-media', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('photos', 'readonly');
        const all = tx.objectStore('photos').getAllKeys();
        all.onsuccess = () => resolve(all.result.map(String));
        all.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    });
    return { stores, photoIds };
  });

  expect(Object.keys(before.stores).length, 'no hay datos que exportar').toBeGreaterThan(3);
  expect(before.photoIds.length, 'no hay fotos que exportar').toBeGreaterThan(0);

  /* ── exportar ── */
  await page.goto('/ajustes/datos');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Crear copia/i }).click();
  const file = await download;
  const path = await file.path();
  expect(path, 'la descarga no produjo archivo').toBeTruthy();

  // Se lee el archivo que el usuario acaba de descargar: es exactamente el
  // que llevaria al telefono nuevo.
  const json = readFileSync(path!, 'utf8');

  /* ── borrar todo ── */
  await page.getByRole('button', { name: /Borrar todos los datos/i }).click();
  await page.getByLabel(/Escribe BORRAR/i).fill('BORRAR');
  await page.getByRole('button', { name: /Borrar definitivamente/i }).click();
  await page.waitForTimeout(1200);

  const afterWipe = await page.evaluate(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bodyfit:v1:')) keys.push(key);
    }
    return keys;
  });
  expect(afterWipe, 'el borrado no vacio el almacenamiento').toEqual([]);

  /* ── restaurar ── */
  expect(json, 'no se pudo generar el contenido de la copia').toBeTruthy();

  /*
   * Con los datos borrados la app vuelve al onboarding, que es lo que vera
   * alguien que estrena telefono. Por eso la restauracion se hace desde ahi.
   */
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BodyFit Prep' })).toBeVisible();
  await page.screenshot({ path: resolve(SHOTS, 'flujoC-1-onboarding-vacio.png'), fullPage: true });

  await page.setInputFiles('input[type="file"]', {
    name: 'bodyfit-copia.json',
    mimeType: 'application/json',
    buffer: Buffer.from(json as string, 'utf8'),
  });
  await page.waitForTimeout(2000);

  /* ── comparar ── */
  const after = await page.evaluate(async () => {
    const stores: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bodyfit:v1:')) stores[key] = localStorage.getItem(key) ?? '';
    }
    const photoIds = await new Promise<string[]>((resolve) => {
      const req = indexedDB.open('bodyfit-media', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('photos', 'readonly');
        const all = tx.objectStore('photos').getAllKeys();
        all.onsuccess = () => resolve(all.result.map(String));
        all.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    });
    return { stores, photoIds };
  });

  // Las colecciones de datos vuelven exactamente igual
  for (const key of ['bodyfit:v1:profile', 'bodyfit:v1:body', 'bodyfit:v1:prep', 'bodyfit:v1:photos']) {
    expect(after.stores[key], `no se restauro ${key}`).toBeTruthy();
    expect(after.stores[key], `${key} cambio al restaurar`).toBe(before.stores[key]);
  }
  // Y las fotos tambien
  expect(after.photoIds.sort(), 'las fotos no se restauraron').toEqual(before.photoIds.sort());

  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.screenshot({ path: resolve(SHOTS, 'flujoC-2-restaurado.png'), fullPage: true });

  assertClean(problems, 'flujo C');
});

/* ═══════════════════════════════════════════════════ FLUJO D ═══════════ */

test('flujo D · actualizacion: datos en esquema antiguo se migran sin perder nada', async ({ page }) => {
  const problems = collectProblems(page);

  await page.goto('/');
  await page.evaluate(() => {
    const now = new Date().toISOString();
    /*
     * Estado tal y como lo dejaria una version anterior: version 1, sin los
     * campos que se anadieron despues (unidades, experiencia, digestion...).
     */
    localStorage.setItem(
      'bodyfit:v1:profile',
      JSON.stringify({
        state: {
          profile: {
            name: 'Antiguo', sex: 'hombre', birthDate: '1990-05-05', heightCm: 180,
            startWeight: 90, activity: 'moderado', goal: 'definicion', paceWeekPct: 0.5,
            proteinPerKg: 2, fatPerKg: 0.8, kcalOverride: null, onboarded: true,
          },
        },
        version: 1,
      }),
    );
    localStorage.setItem(
      'bodyfit:v1:checkins',
      JSON.stringify({
        state: {
          checkins: [
            {
              id: 'c1', createdAt: now, updatedAt: now, deletedAt: null, userId: null,
              weekStart: '2026-01-05', weight: 88.5, adherence: 90, energy: 4, sleep: 4,
              hunger: 3, notes: 'semana antigua',
            },
          ],
        },
        version: 1,
      }),
    );
    localStorage.setItem(
      'bodyfit:v1:body',
      JSON.stringify({
        state: {
          measurements: [
            {
              id: 'm-old', createdAt: now, updatedAt: now, deletedAt: null, userId: null,
              date: '2026-01-05', weight: 88.5, waist: 92,
            },
          ],
        },
        version: 1,
      }),
    );
  });

  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 });

  /* ── nada se perdio ── */
  const profile = await readStore(page, 'profile');
  const p = (profile?.profile ?? {}) as Record<string, unknown>;
  expect(p.name, 'se perdio el nombre al migrar').toBe('Antiguo');
  expect(p.heightCm).toBe(180);
  expect(p.startWeight).toBe(90);

  const checkin = await readStore(page, 'checkins');
  const list = (checkin?.checkins ?? []) as Record<string, unknown>[];
  expect(list.length, 'se perdio el check-in antiguo').toBe(1);
  expect(list[0].notes).toBe('semana antigua');
  expect(list[0].weight).toBe(88.5);

  const body = await readStore(page, 'body');
  const measures = (body?.measurements ?? []) as Record<string, unknown>[];
  expect(measures.length, 'se perdio la medida antigua').toBe(1);
  expect(measures[0].waist).toBe(92);

  /* ── la app funciona con esos datos ── */
  for (const path of ['/', '/cuerpo', '/checkin', '/historial', '/ajustes']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    // Si el limite de error salta, aparece una segunda <main>: eso es un fallo
    await expect(page.getByText('Esta pantalla no se pudo abrir'), `${path} reventó`).toHaveCount(0);
    await expect(page.locator('main').first()).toBeVisible();
  }

  await page.screenshot({ path: resolve(SHOTS, 'flujoD-migracion.png'), fullPage: true });
  assertClean(problems, 'flujo D');
});
