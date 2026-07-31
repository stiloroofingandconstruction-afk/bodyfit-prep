import { expect, test } from '@playwright/test';
import { assertClean, collectProblems, seedApp, shot } from './helpers';

test.describe('Videos, fotos, historial y PWA', () => {
  test('la ficha de tecnica muestra la guia completa', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ejercicios/sentadilla');
    for (const section of [
      'En una linea',
      'Preparacion',
      'Posicion inicial',
      'Ejecucion paso a paso',
      'Errores comunes',
      'Senales de mala tecnica',
      'Seguridad',
      'Advertencias',
      'Para hipertrofia',
      'Para fuerza',
      'Variantes',
      'Tu historial',
    ]) {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible();
    }
    await shot(page, '50-tecnica-sentadilla', info);
    assertClean(problems, 'ficha de tecnica');
  });

  test('sin video configurado muestra el marcador, no un hueco roto', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/ejercicios/press-banca');
    await expect(page.getByText('Sin video configurado')).toBeVisible();
    // No debe haber ninguna imagen rota
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
    );
    expect(broken, 'imagenes rotas').toBe(0);
    assertClean(problems, 'placeholder de video');
  });

  test('la configuracion de video valida las URLs', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ajustes/videos');
    await page.getByPlaceholder('Buscar ejercicio').fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    // http no cifrado debe bloquear el guardado
    await page.getByPlaceholder('https://tu-servidor/press-banca.mp4').fill('http://inseguro.com/v.mp4');
    await expect(page.getByText(/debe ser una URL completa que empiece por https/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Corrige los errores/ })).toBeDisabled();
    await shot(page, '51-video-url-invalida', info);

    // Con https valido y verificado, se puede guardar
    await page.getByPlaceholder('https://tu-servidor/press-banca.mp4').fill('https://ejemplo.test/press.mp4');
    await page.getByPlaceholder('Grabado por mi / Canal de mi coach').fill('Grabado por mi');
    await page.getByRole('button', { name: /Marcar como verificado/ }).click();
    await expect(page.getByRole('button', { name: 'Guardar video' })).toBeEnabled();
    await page.getByRole('button', { name: 'Guardar video' }).click();
    await expect(page.getByText('Video guardado')).toBeVisible();

    assertClean(problems, 'configuracion de video');
  });

  test('exporta e importa la configuracion de videos', async ({ page }) => {
    await seedApp(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem('bodyfit:v1:settings');
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 1 };
      parsed.state.exerciseMedia = {
        'press-banca': {
          videoUrl: 'https://ejemplo.test/a.mp4',
          source: 'Propio',
          verified: true,
          reviewedAt: '2026-07-31',
        },
      };
      localStorage.setItem('bodyfit:v1:settings', JSON.stringify(parsed));
    });
    await page.goto('/ajustes/videos');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^bodyfit-videos-/);

    await page.setInputFiles('input[type="file"][accept="application/json"]', (await download.path())!);
    await expect(page.getByText(/videos importados|importados/)).toBeVisible();
  });

  test('la galeria de fotos y la comparacion funcionan sin fotos', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/fotos');
    await expect(page.getByText('Anadir foto de hoy')).toBeVisible();
    await expect(page.getByText('Sin fotos')).toBeVisible();
    // Los 5 angulos deben estar disponibles
    for (const angle of ['Frente', 'Lado izquierdo', 'Lado derecho', 'Espalda', 'Pose libre']) {
      await expect(page.getByText(angle, { exact: true }).first()).toBeVisible();
    }
    await shot(page, '52-fotos-vacio', info);
    assertClean(problems, 'fotos');
  });

  test('sube una foto y aparece en la galeria', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/fotos');

    // PNG 1x1 valido generado al vuelo: no se usa ningun binario externo
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    await page.setInputFiles('input[type="file"][accept="image/*"]', {
      name: 'frente.png',
      mimeType: 'image/png',
      buffer: png,
    });

    // Se espera a que aparezca cualquier aviso para poder diagnosticar si falla
    const toastText = await page
      .locator('.rise-enter')
      .first()
      .textContent({ timeout: 10_000 })
      .catch(() => '(ningun aviso)');
    expect(toastText, 'aviso tras subir la foto').toMatch(/guardada/);
    await expect(page.getByText('Galeria')).toBeVisible();
    await shot(page, '53-fotos-con-imagen', info);
    assertClean(problems, 'subida de foto');
  });

  test('el historial pinta el calendario y el detalle del dia', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/historial');
    await expect(page.getByText(/Dias con registro/)).toBeVisible();
    await expect(page.getByText(/Calorias . ultimos 14 dias/)).toBeVisible();
    await shot(page, '54-historial', info);

    // Navegar de mes y abrir un dia
    await page.getByRole('button', { name: 'Mes anterior' }).click();
    await page.getByRole('button', { name: 'Mes siguiente' }).click();
    await page.locator('main button').filter({ hasText: /^\d+$/ }).first().click();
    await expect(page.getByText('Alimentos').first()).toBeVisible();
    assertClean(problems, 'historial');
  });

  test('la biblioteca de ejercicios filtra y navega', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ejercicios');
    await expect(page.getByText(/ejercicios con guia/)).toBeVisible();

    await page.getByRole('button', { name: 'Lumbar segura' }).click();
    await expect(page.getByText('Peso muerto', { exact: false })).toHaveCount(0);

    await page.getByRole('button', { name: 'Lumbar segura' }).click();
    await page.getByPlaceholder(/Buscar ejercicio/).fill('sentadilla');
    // El primer resultado de la lista, no el chip de filtro
    await page.locator('main button').filter({ hasText: /^Sentadilla/ }).first().click();
    await expect(page).toHaveURL(/\/ejercicios\/sentadilla/);
    await shot(page, '55-biblioteca', info);
    assertClean(problems, 'biblioteca de ejercicios');
  });

  test('el manifest y el service worker se sirven correctamente', async ({ page, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.status()).toBe(200);
    const json = await manifest.json();
    expect(json.name).toBe('BodyFit Prep');
    expect(json.display).toBe('standalone');
    expect(json.start_url).toBe('/');
    expect(json.icons.length).toBeGreaterThanOrEqual(3);

    for (const icon of json.icons) {
      const res = await request.get(`/${icon.src}`);
      expect(res.status(), `icono ${icon.src}`).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }

    const sw = await request.get('/sw.js');
    expect(sw.status()).toBe(200);
    const body = await sw.text();
    expect(body).toContain('index.html');
    // Ningun video precacheado
    const urls = [...body.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(20);
    expect(urls.filter((u) => /\.(mp4|webm|mov)$/.test(u))).toEqual([]);

    await page.goto('/');
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'sin soporte';
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? 'registrado' : 'no registrado';
    });
    expect(['registrado', 'no registrado']).toContain(registered);
  });

  test('la app arranca desde una ruta profunda (rewrite SPA)', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page, true);
    await page.goto('/competencia/peak-week');
    await expect(page.getByRole('heading', { name: 'Peak week' })).toBeVisible();
    assertClean(problems, 'ruta profunda');
  });

  test('los datos sobreviven a una recarga completa', async ({ page }) => {
    await seedApp(page);
    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Anadir a/ }).first().click();
    await page.getByPlaceholder(/Pollo, arroz/).fill('avena');
    await page.getByRole('button', { name: /^Avena/ }).first().click();
    await page.getByRole('button', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).first().click();
    await page.getByRole('button', { name: /Anadir 50/ }).click();

    await expect(page.getByText('Avena').first()).toBeVisible();
    await page.reload();
    await expect(page.getByText('Avena').first()).toBeVisible();
  });
});
