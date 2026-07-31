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

  test('cambiar a pulgadas afecta a las medidas', async ({ page }) => {
    await seedApp(page);
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Pulgadas' }).click();

    await page.goto('/cuerpo');
    await page.getByRole('button', { name: 'Medidas' }).click();
    await expect(page.getByText(/En pulgadas/)).toBeVisible();
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

  test('exporta el respaldo completo en JSON', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/ajustes');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^bodyfit-\d{4}-\d{2}-\d{2}\.json$/);

    const path = await download.path();
    const parsed = JSON.parse(readFileSync(path!, 'utf8'));
    expect(parsed.app).toBe('BodyFit Prep');
    expect(parsed.data).toBeTruthy();
    expect(Object.keys(parsed.data).length).toBeGreaterThan(1);
    assertClean(problems, 'exportacion JSON');
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

  test('importa un respaldo y restaura los datos', async ({ page }) => {
    await seedApp(page);

    // Se exporta, se borra y se reimporta
    await page.goto('/ajustes');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar' }).click(),
    ]);
    const backupPath = (await download.path())!;

    await page.evaluate(() => localStorage.clear());
    await page.goto('/ajustes');

    // Tras borrar, la app vuelve al onboarding
    await expect(page.getByRole('heading', { name: 'BodyFit Prep' })).toBeVisible();

    // Se importa desde el onboarding no es posible: se rehace y se importa
    await page.evaluate(() => {
      localStorage.setItem(
        'bodyfit:v1:profile',
        JSON.stringify({ state: { profile: { onboarded: true, name: 'tmp', sex: 'hombre', birthDate: '1995-01-01', heightCm: 178, startWeight: 80, activity: 'moderado', goal: 'definicion', paceWeekPct: 0.6, proteinPerKg: 2, fatPerKg: 0.8, kcalOverride: null, units: 'metric' } }, version: 1 }),
      );
    });
    await page.goto('/ajustes');
    await page.setInputFiles('input[type="file"][accept="application/json"]', backupPath);
    await expect(page.getByText(/Copia importada/)).toBeVisible();
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
