import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { assertClean, collectProblems, seedApp, shot } from './helpers';

test.describe('Ajustes, unidades, idioma y datos', () => {
  test('cambiar a libras actualiza todos los valores visibles al instante', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/cuerpo');
    const kgText = await page.getByText(/kg/).first().textContent();
    expect(kgText).toContain('kg');

    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Libras' }).click();
    await shot(page, '40-ajustes-libras', info);

    await page.goto('/cuerpo');
    await expect(page.getByText(/lb/).first()).toBeVisible();
    await expect(page.getByText(/\d+\.\d+ kg/)).toHaveCount(0);

    // 82.1 kg -> 181.0 lb aproximadamente
    const body = await page.locator('main').innerText();
    expect(body, 'el peso debe estar convertido a libras').toMatch(/18[01]\.\d/);
    await shot(page, '41-cuerpo-en-libras', info);

    // Y el dato guardado no se toca: al volver a kg reaparece el original
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Kilogramos' }).click();
    await page.goto('/cuerpo');
    const back = await page.locator('main').innerText();
    expect(back, 'el dato canonico debe conservarse').toMatch(/82\.\d/);

    assertClean(problems, 'cambio de unidades');
  });

  test('el peso objetivo se puede escribir, corregir y dejar vacio', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/ajustes');

    const field = page.getByLabel('Peso objetivo');

    // Escribir un valor
    await field.fill('78');
    await expect(field).toHaveValue('78');

    /*
     * Borrar de verdad. Antes el campo se repintaba formateado en cada tecla
     * ("78" -> "78.0"), asi que el texto nunca llegaba a quedar vacio y el
     * valor no habia forma de quitarlo.
     */
    await field.fill('');
    await expect(field, 'el campo no se puede vaciar').toHaveValue('');
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('bodyfit:v1:profile');
          const state = JSON.parse(raw!).state as { profile: { goalWeight?: number } };
          return state.profile.goalWeight ?? null;
        }),
      )
      .toBeNull();

    // Corregir sobre lo escrito, digito a digito
    await field.fill('7');
    await field.press('8');
    await expect(field).toHaveValue('78');
    await field.press('Backspace');
    await expect(field).toHaveValue('7');

    // Al salir del campo se muestra ya formateado
    await field.blur();
    await expect(field).toHaveValue('7.0');

    assertClean(problems, 'peso objetivo');
  });

  test('cambiar a pulgadas afecta a las medidas', async ({ page }) => {
    await seedApp(page);
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Pulgadas' }).click();

    await page.goto('/cuerpo');
    await page.getByRole('button', { name: 'Medidas', exact: true }).click();
    await expect(page.getByText(/En Pulgadas/i)).toBeVisible();
  });

  test('cambiar el idioma traduce la navegacion sin recargar', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ajustes');
    await expect(page.getByRole('navigation').getByText('Nutricion')).toBeVisible();

    await page.getByRole('button', { name: /English/ }).click();
    await expect(page.getByRole('navigation').getByText('Nutrition')).toBeVisible();
    await expect(page.getByRole('navigation').getByText('Settings')).toBeVisible();
    await shot(page, '42-idioma-ingles', info);

    // La ficha de tecnica tambien esta traducida
    await page.goto('/ejercicios/press-banca');
    await expect(page.getByText('In one line')).toBeVisible();
    await expect(page.getByText('Starting position')).toBeVisible();

    // Volver a espanol
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Espanol' }).click();
    await expect(page.getByRole('navigation').getByText('Nutricion')).toBeVisible();

    assertClean(problems, 'cambio de idioma');
  });

  test('activa el modo competencia desde ajustes', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Alternar modo competencia' }).click();
    await expect(page.getByRole('navigation').getByText('Prep')).toBeVisible();
    await shot(page, '43-modo-competencia-activo', info);

    await page.getByRole('link', { name: /Configurar competencia/ }).click();
    await expect(page).toHaveURL(/\/competencia$/);
    await page.getByRole('button', { name: /Activar modo competencia/ }).click();
    await page.getByPlaceholder('Campeonato regional 2026').fill('Mi show');
    await page.getByRole('button', { name: /Activar modo competencia/ }).last().click();
    await expect(page.getByText('Modo competencia activado')).toBeVisible();
    assertClean(problems, 'activar competencia');
  });

  test('crea la copia completa desde Datos y respaldo', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    // La exportacion vive ahora en su propia pantalla, con verificacion y todo
    await page.goto('/ajustes/datos');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Crear copia/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^bodyfit-copia-\d{4}-\d{2}-\d{2}\.json$/);

    const path = await download.path();
    const parsed = JSON.parse(readFileSync(path!, 'utf8'));
    expect(parsed.app).toBe('BodyFit Prep');
    expect(parsed.format, 'la copia debe declarar su formato').toBe(2);
    expect(parsed.checksum, 'la copia debe llevar suma de verificacion').toBeTruthy();
    expect(Array.isArray(parsed.photos), 'la copia debe traer seccion de fotos').toBe(true);
    expect(Object.keys(parsed.data).length).toBeGreaterThan(1);
    assertClean(problems, 'copia completa');
  });

  test('exporta los CSV con la unidad en la cabecera', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    // En libras, la cabecera debe decirlo
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Libras' }).click();

    await page.goto('/informes');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Peso y medidas/ }).click(),
    ]);
    const csv = readFileSync((await download.path())!, 'utf8');
    expect(csv).toContain('peso_lb');
    expect(csv).not.toContain('peso_kg');
    assertClean(problems, 'exportacion CSV');
  });

  test('genera el resumen para el coach', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/informes');
    await page.getByRole('button', { name: /Ver resumen/ }).click();
    await expect(page.getByText(/Resumen semanal/).first()).toBeVisible();
    await expect(page.getByText(/Adherencia/).first()).toBeVisible();
    await shot(page, '44-informe-coach', info);
    assertClean(problems, 'informe para coach');
  });

  test('verifica una copia antes de restaurarla y detecta las corruptas', async ({ page }) => {
    await seedApp(page);
    await page.goto('/ajustes/datos');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Crear copia/ }).click(),
    ]);
    const backupPath = (await download.path())!;
    const good = readFileSync(backupPath, 'utf8');

    // Un archivo truncado se rechaza con explicacion, no se restaura a medias
    await page.setInputFiles('input[type="file"]', {
      name: 'rota.json',
      mimeType: 'application/json',
      buffer: Buffer.from(good.slice(0, 200), 'utf8'),
    });
    await expect(page.getByText(/Copia no valida/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Restaurar esta copia/ })).toHaveCount(0);

    // La buena se acepta, muestra que trae dentro y solo entonces deja restaurar
    await page.setInputFiles('input[type="file"]', backupPath);
    await expect(page.getByText(/Copia valida/)).toBeVisible();
    await expect(page.getByText(/Integridad verificada/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Restaurar esta copia/ })).toBeVisible();
  });

  test('crea y elimina un recordatorio', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/ajustes/recordatorios');
    await page.getByRole('button', { name: /Nuevo recordatorio/ }).click();
    await page.getByRole('button', { name: /Crear recordatorio/ }).click();
    await expect(page.getByText('Recordatorio creado')).toBeVisible();
    await expect(page.getByText('Peso en ayunas').first()).toBeVisible();
    await shot(page, '45-recordatorios', info);

    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    assertClean(problems, 'recordatorios');
  });
});
