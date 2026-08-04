import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { enableDevMode, seedApp } from './helpers';

/**
 * Sincronizacion, en navegador de verdad.
 *
 * La convergencia se prueba en `scripts/smoke-sync-world.mts`: alli el tiempo es
 * una variable y catorce dias pasan en milisegundos. Aqui se prueba otra cosa,
 * la que una simulacion no puede ver:
 *
 *   · que dos contextos de navegador son de verdad dos dispositivos distintos
 *   · que el identificador y el reloj sobreviven a recargar
 *   · que con el flag apagado —produccion— NADA de esto se activa
 *
 * Dos `browser.newContext()` no comparten localStorage ni IndexedDB, que es
 * exactamente la separacion que hay entre un iPhone y un iPad.
 */

/** Un dispositivo listo: contexto propio, datos sembrados, modo desarrollador. */
async function dispositivo(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await seedApp(page);
  await enableDevMode(page);
  return page;
}

/** El identificador que la aplicacion se dio a si misma en este contexto. */
async function idDeDispositivo(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('bodyfit:v1:sync:device'));
}

test.describe('Sincronizacion: dos dispositivos', () => {
  test('produccion va sin sincronizar y no crea la cola', async ({ page }) => {
    await seedApp(page);

    const flag = await page.evaluate(() => localStorage.getItem('bodyfit:v1:sync:flag'));
    expect(flag, 'produccion no debe llevar flag guardado').toBeNull();

    // Registrar algo no debe crear la base de datos de la cola
    await page.goto('/cuerpo');
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.waitForTimeout(500);

    const bases = await page.evaluate(async () => {
      if (!('databases' in indexedDB)) return null;
      return (await indexedDB.databases()).map((d) => d.name);
    });

    if (bases !== null) {
      expect(bases, 'la cola no debe existir con la sincronizacion apagada').not.toContain(
        'bodyfit-sync',
      );
    }
  });

  test('dos contextos son dos dispositivos distintos', async ({ browser }) => {
    const contextoA = await browser.newContext();
    const contextoB = await browser.newContext();

    try {
      const a = await dispositivo(contextoA);
      const b = await dispositivo(contextoB);

      // El identificador se crea al pedirlo: lo pide el diagnostico
      await a.goto('/ajustes/diagnostico/sync');
      await b.goto('/ajustes/diagnostico/sync');
      await expect(a.getByText(/Cola de salida/i)).toBeVisible();
      await expect(b.getByText(/Cola de salida/i)).toBeVisible();

      const idA = await idDeDispositivo(a);
      const idB = await idDeDispositivo(b);

      expect(idA, 'el dispositivo A debe tener identificador').toBeTruthy();
      expect(idB, 'el dispositivo B debe tener identificador').toBeTruthy();
      expect(idA, 'dos dispositivos NO pueden compartir identificador').not.toBe(idB);
    } finally {
      await contextoA.close();
      await contextoB.close();
    }
  });

  test('el identificador sobrevive a recargar', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/diagnostico/sync');
      await expect(page.getByText(/Cola de salida/i)).toBeVisible();

      const antes = await idDeDispositivo(page);
      expect(antes).toBeTruthy();

      await page.reload();
      await expect(page.getByText(/Cola de salida/i)).toBeVisible();

      expect(await idDeDispositivo(page), 'debe ser el mismo tras recargar').toBe(antes);
    } finally {
      await contexto.close();
    }
  });

  test('el diagnostico no ensena el contenido de las operaciones', async ({ page }) => {
    await seedApp(page);
    await enableDevMode(page);
    await page.goto('/ajustes/diagnostico/sync');
    await expect(page.getByText(/Cola de salida/i)).toBeVisible();

    const texto = (await page.locator('body').innerText()).toLowerCase();

    /*
     * Un diagnostico que la persona pueda enviar por correo para pedir ayuda no
     * puede llevar dentro pesos corporales, calorias ni notas personales: son
     * datos de salud. Se ensenan identificadores, colecciones y estados.
     */
    expect(texto, 'el diagnostico no debe mostrar payloads').not.toContain('"payload"');
    expect(texto).toContain('cursor');
    expect(texto).toContain('dispositivo');
  });

  test('cambiar el modo a interno no rompe la aplicacion', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/diagnostico/sync');
      await expect(page.getByText(/Cola de salida/i)).toBeVisible();

      await page.getByRole('button', { name: /^internal/ }).click();

      // Sin configuracion de Supabase se cae al adaptador local en vez de fallar
      await expect(page.getByText(/adaptador local/i).first()).toBeVisible();

      // Y la aplicacion sigue funcionando entera
      await page.goto('/nutricion');
      await expect(page.getByRole('navigation')).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
});
