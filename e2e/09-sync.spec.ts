import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
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

      /*
       * Que adaptador toca depende del BUILD, no de la prueba.
       *
       * Un build de staging lleva las variables de Supabase y elige el
       * adaptador real; uno de produccion no las lleva y cae al local en vez de
       * fallar. Las dos cosas son correctas y hay que comprobar la que toque:
       * fijar una sola convertiria el otro build en un falso rojo.
       */
      await expect(page.getByText(/adaptador (local|supabase)/i).first()).toBeVisible();

      // Y la aplicacion sigue funcionando entera, en los dos casos
      await page.goto('/nutricion');
      await expect(page.getByRole('navigation')).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
});

test.describe('Cuenta y sincronizacion', () => {
  test('sin configurar Supabase la pantalla es honesta y no rompe', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta');
      await expect(page.getByText(/Sin cuenta/i)).toBeVisible();

      // La promesa central, escrita en la pantalla y no solo en el codigo
      await expect(page.getByText(/Todo funciona igual/i)).toBeVisible();

      /*
       * Pedir el enlace tiene que hacer algo visible pase lo que pase: sin
       * Supabase configurado, decir que no lo esta; con el configurado, decir
       * que se ha enviado. Lo que no puede es no responder.
       */
      await page.getByRole('textbox').first().fill('qa-humo@bodyfit.test');
      await page.getByRole('button', { name: /Enviar enlace/i }).click();
      await expect(
        page.getByText(/no configurado|hemos enviado|no se pudo enviar/i).first(),
      ).toBeVisible();

      // Y la aplicacion sigue entera
      await page.goto('/nutricion');
      await expect(page.getByRole('navigation')).toBeVisible();
    } finally {
      await contexto.close();
    }
  });

  test('un correo invalido no envia nada', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta');
      await page.getByRole('textbox').first().fill('esto-no-es-un-correo');
      await page.getByRole('button', { name: /Enviar enlace/i }).click();
      await expect(page.getByText(/correo valido/i)).toBeVisible();
    } finally {
      await contexto.close();
    }
  });

  test('la pantalla de cuenta no filtra el correo completo', async ({ browser }) => {
    /*
     * `maskEmail` recorta el usuario a tres letras. Importa porque esta
     * pantalla acaba en capturas de pantalla que la gente manda para pedir
     * ayuda, y una direccion completa es un dato personal que no hace falta
     * para reconocer la propia cuenta.
     */
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.evaluate(() => {
        localStorage.setItem(
          'bodyfit:v1:sync:session',
          JSON.stringify({
            userId: '00000000-0000-4000-8000-000000000001',
            email: 'gustavo.completo@ejemplo.com',
            accessToken: 'x',
            refreshToken: 'y',
            expiresAt: Date.now() + 3600_000,
          }),
        );
      });
      await page.goto('/ajustes/cuenta');
      // Esperar a que hidrate: si no, lo que se lee es la pantalla de arranque
      await expect(page.getByText(/Cuenta y sincronizacion/i).first()).toBeVisible();
      const texto = await page.locator('body').innerText();

      expect(texto, 'no debe verse la direccion completa').not.toContain(
        'gustavo.completo@ejemplo.com',
      );
      expect(texto).toContain('gus***@ejemplo.com');
      expect(texto, 'no debe verse ningun token').not.toContain('accessToken');
    } finally {
      await contexto.close();
    }
  });
});

test.describe('Fotos sincronizadas', () => {
  test('una foto sin binario local se explica, no se queda cargando', async ({ browser }) => {
    /*
     * El caso real: la sincronizacion lleva los METADATOS de las fotos al
     * segundo dispositivo, pero el binario se queda donde se tomo. Antes de
     * esto, la ficha mostraba un esqueleto pulsando para siempre y quien miraba
     * creia que la aplicacion estaba colgada.
     */
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);

      await page.evaluate(() => {
        const now = new Date().toISOString();
        localStorage.setItem(
          'bodyfit:v1:photos',
          JSON.stringify({
            state: {
              photos: [
                {
                  id: 'foto-de-otro-dispositivo',
                  createdAt: now,
                  updatedAt: now,
                  date: now.slice(0, 10),
                  angle: 'frontal',
                  // Apunta a un blob que solo existe en el dispositivo original
                  blobId: 'blob-que-no-esta-aqui',
                  uploadState: 'local-only',
                },
              ],
            },
            version: 1,
          }),
        );
      });
      await page.reload();
      await page.goto('/fotos');

      await expect(page.getByText(/Solo en el dispositivo original/i)).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
});

test.describe('Prueba guiada de dos dispositivos', () => {
  /** Deja una sesion falsa para que la pantalla de cuenta muestre lo de dentro. */
  async function conSesion(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.setItem(
        'bodyfit:v1:sync:session',
        JSON.stringify({
          userId: '00000000-0000-4000-8000-000000000001',
          email: 'qa@ejemplo.com',
          accessToken: 'x',
          refreshToken: 'y',
          expiresAt: Date.now() + 3600_000,
        }),
      );
    });
  }

  test('los 33 pasos estan y ninguno se marca solo', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta/dos-dispositivos');
      await expect(page.getByText(/Prueba de dos dispositivos/i).first()).toBeVisible();

      // El contador arranca en cero: la aplicacion no puede aprobarse a si misma
      await expect(page.getByText(/0 de 33 pasos/i)).toBeVisible();

      const pasos = await page.locator('ul li button').count();
      expect(pasos, 'deben estar los 33 pasos').toBe(33);
    } finally {
      await contexto.close();
    }
  });

  test('marcar un paso avanza al siguiente y persiste al recargar', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta/dos-dispositivos');
      await expect(page.getByText(/Paso 1 de 33/i)).toBeVisible();

      await page.getByRole('button', { name: /Marcar como hecho/i }).click();
      await expect(page.getByText(/Paso 2 de 33/i)).toBeVisible();
      await expect(page.getByText(/1 de 33 pasos/i)).toBeVisible();

      await page.reload();
      await expect(page.getByText(/1 de 33 pasos/i)).toBeVisible();
    } finally {
      await contexto.close();
    }
  });

  test('el diagnostico de la prueba no lleva contenido personal', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta/dos-dispositivos');
      await expect(page.getByText(/Estado de este dispositivo/i)).toBeVisible();

      const descarga = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Diagnostico', exact: true }).click();
      const archivo = await descarga;
      const ruta = await archivo.path();
      const texto = readFileSync(ruta!, 'utf8');
      const json = JSON.parse(texto);

      expect(json.dispositivo, 'debe llevar el identificador').toBeTruthy();
      expect(json.pasos, 'debe llevar el progreso').toHaveLength(33);
      expect(texto, 'no puede llevar payloads').not.toContain('"payload"');
      expect(texto, 'ni notas personales').not.toContain('notes');
      expect(texto, 'ni el token').not.toContain('accessToken');
    } finally {
      await contexto.close();
    }
  });

  test('el enlace a la prueba solo aparece con sesion', async ({ browser }) => {
    const contexto = await browser.newContext();
    try {
      const page = await dispositivo(contexto);
      await page.goto('/ajustes/cuenta');
      await expect(page.getByText(/Sin cuenta/i)).toBeVisible();
      await expect(page.getByText(/Prueba de dos dispositivos/i)).toHaveCount(0);

      await conSesion(page);
      await page.reload();
      await expect(page.getByText(/Prueba de dos dispositivos/i)).toBeVisible();
    } finally {
      await contexto.close();
    }
  });
});
