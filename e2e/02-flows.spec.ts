import { expect, test } from '@playwright/test';
import { assertClean, collectProblems, seedApp, shot } from './helpers';

test.describe('Flujos de registro', () => {
  test('registra una comida: buscar alimento, indicar gramos y guardar', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Anadir a/ }).first().click();

    const search = page.getByPlaceholder(/Pollo, arroz/);
    await expect(search).toBeVisible();
    await search.fill('pollo');

    await page.getByRole('button', { name: /Pechuga de pollo/ }).first().click();
    await expect(page.getByText('¿Cuantos gramos?')).toBeVisible();

    // Teclado numerico propio: 2, 0, 0
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).first().click();
    await page.getByRole('button', { name: '0', exact: true }).first().click();

    await shot(page, '10-gramos', info);
    await page.getByRole('button', { name: /Anadir 200/ }).click();

    await expect(page.getByText(/Pechuga de pollo/).first()).toBeVisible();
    await shot(page, '11-nutricion-con-comida', info);
    assertClean(problems, 'registro de comida');
  });

  test('"Quiero comer..." calcula los gramos de varios alimentos', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Quiero comer/ }).click();

    const textarea = page.getByPlaceholder(/Quiero comer pollo/);
    await textarea.fill('Quiero comer pollo, arroz y brocoli');
    await page.getByRole('button', { name: /Calcular gramos/ }).click();

    await expect(page.getByText('Tu plato')).toBeVisible();
    await expect(page.getByText(/% de ajuste/)).toBeVisible();
    await shot(page, '12-quiero-comer', info);

    await page.getByRole('button', { name: /Registrar comida/ }).click();
    await expect(page.getByText(/alimentos registrados/)).toBeVisible();
    assertClean(problems, 'quiero comer');
  });

  test('"Completar mis macros" propone comidas y las registra', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Completar macros/ }).click();
    await expect(page.getByText(/Elige una comida/)).toBeVisible();
    await shot(page, '13-completar-macros', info);

    await page.getByText(/% ajuste/).first().click();
    await expect(page.getByText('Tu plato')).toBeVisible();
    await page.getByRole('button', { name: /Registrar comida/ }).click();
    assertClean(problems, 'completar macros');
  });

  test('planea el dia completo repartiendo en comidas', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Planear mi dia completo/ }).click();
    await expect(page.getByText('Tu dia')).toBeVisible();
    await expect(page.getByText(/Comida 1/)).toBeVisible();
    await shot(page, '14-planear-dia', info);

    await page.getByRole('button', { name: /Registrar el dia completo/ }).click();
    await expect(page.getByText(/comidas registradas/)).toBeVisible();
    assertClean(problems, 'planear mi dia');
  });

  test('cambia el tipo de dia y el objetivo se recalcula', async ({ page }) => {
    await seedApp(page);
    await page.goto('/nutricion');

    // El objetivo se lee del pie del anillo: "Objetivo <n>"
    const target = page.locator('p', { hasText: /^\d{3,5}$/ }).first();
    const before = await target.textContent();

    await page.getByRole('button', { name: 'Refeed', exact: true }).click();
    await page.waitForTimeout(400);
    const after = await target.textContent();

    expect(Number(after), 'el refeed debe subir el objetivo').toBeGreaterThan(Number(before));
  });

  test('registra un entrenamiento completo con series', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await expect(page).toHaveURL(/\/entrenamiento\/activo$/);

    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca, sentadilla/).fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    // Primera serie: 60 kg x 10
    const weightInputs = page.locator('input[inputmode="decimal"]');
    const repInputs = page.locator('input[inputmode="numeric"]');
    await weightInputs.first().fill('60');
    await repInputs.first().fill('10');
    await page.getByRole('button', { name: 'Completar serie' }).first().click();

    await expect(page.getByText(/1\/3 series|1 de 3/)).toBeVisible({ timeout: 5000 });
    await shot(page, '20-entreno-activo', info);

    await page.getByRole('button', { name: 'Terminar' }).click();
    await page.getByRole('button', { name: /Guardar entreno/ }).click();

    await expect(page).toHaveURL(/\/entrenamiento$/);
    await expect(page.getByText(/Entreno libre/).first()).toBeVisible();
    assertClean(problems, 'entrenamiento');
  });

  test('abre la tecnica sin perder el entrenamiento y sustituye el ejercicio', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca, sentadilla/).fill('remo con barra');
    await page.getByRole('button', { name: /^Remo con barra/ }).first().click();

    // Registrar una serie para comprobar que sobrevive a la sustitucion
    await page.locator('input[inputmode="decimal"]').first().fill('50');
    await page.locator('input[inputmode="numeric"]').first().fill('8');
    await page.getByRole('button', { name: 'Completar serie' }).first().click();

    await page.getByRole('button', { name: /Ver tecnica/ }).first().click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Remo con barra' })).toBeVisible();
    await expect(sheet.getByText('En una linea')).toBeVisible();
    await shot(page, '21-tecnica-en-entreno', info);

    // Aviso lumbar presente en un ejercicio de carga alta
    await expect(sheet.getByText(/Carga lumbar alta/).first()).toBeVisible();

    // Sustituir por una alternativa desde la seccion dedicada
    await sheet.getByText('Sustituir en esta sesion').scrollIntoViewIfNeeded();
    await sheet.getByRole('button', { name: 'Remo en polea baja' }).first().click();

    await expect(page.getByText(/Ejercicio sustituido/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remo en polea baja' })).toBeVisible();
    // La serie registrada debe seguir marcada
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('50');
    await shot(page, '22-tras-sustituir', info);
    assertClean(problems, 'sustitucion de ejercicio');
  });

  test('la tendencia de peso es la misma en todas las pantallas', async ({ page }) => {
    await seedApp(page, true);

    // El panel de competencia y la tarjeta de peso corporal comparten dashboard:
    // si cada uno calcula la tendencia por su cuenta, el usuario ve dos cifras
    // distintas para el mismo periodo.
    await page.goto('/');
    // Ambas tarjetas deben estar pintadas antes de leer el DOM
    await expect(page.getByText('Peso y ritmo')).toBeVisible();
    await expect(page.getByText('Peso corporal')).toBeVisible();

    const values = await page.evaluate(() => {
      const out: string[] = [];
      for (const p of document.querySelectorAll('p')) {
        const label = p.textContent?.trim().toUpperCase();
        if (label === 'SEMANAL' || label === 'TENDENCIA SEMANAL') {
          const value = p.nextElementSibling?.textContent?.trim();
          if (value) out.push(value.replace(/[^\d.,+-]/g, ''));
        }
      }
      return out;
    });

    expect(values.length, 'deben existir ambas tendencias').toBeGreaterThanOrEqual(2);
    expect(new Set(values).size, `tendencias distintas: ${values.join(' vs ')}`).toBe(1);

    // Y debe coincidir tambien con la del check-in
    await page.goto('/checkin');
    await expect(page.getByText('Resumen de la semana')).toBeVisible();
    const checkinTrend = await page.evaluate(() => {
      for (const p of document.querySelectorAll('p')) {
        if (p.textContent?.trim().toUpperCase() === 'CAMBIO') {
          return p.nextElementSibling?.textContent?.trim().replace(/[^\d.,+-]/g, '') ?? '';
        }
      }
      return '';
    });
    expect(checkinTrend, 'el check-in usa otra tendencia').toBe(values[0]);
  });

  test('registra el peso del dia', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/cuerpo');
    await page.getByRole('button', { name: /Registrar peso/ }).click();
    await expect(page.getByText('Peso corporal')).toBeVisible();
    await page.getByRole('button', { name: '+0.5' }).click();
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText(/registrados/)).toBeVisible();
    assertClean(problems, 'registro de peso');
  });

  test('registra medidas corporales', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/cuerpo');
    await page.getByRole('button', { name: 'Medidas' }).click();
    await page.getByPlaceholder('0').first().fill('39');
    await page.getByRole('button', { name: /Guardar medidas/ }).click();
    await expect(page.getByText('Medidas guardadas')).toBeVisible();
    assertClean(problems, 'medidas');
  });

  test('registra cardio y pasos', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/cardio');
    await page.getByRole('button', { name: /Registrar sesion/ }).click();
    await expect(page.getByText('Duracion')).toBeVisible();
    await page.getByRole('button', { name: /Guardar sesion/ }).click();
    await expect(page.getByText(/min de/)).toBeVisible();
    await shot(page, '30-cardio', info);

    // Plan semanal
    await page.getByRole('button', { name: /Plan semanal/ }).click();
    await page.getByRole('button', { name: /Crear plan y sesiones/ }).click();
    await expect(page.getByText(/Plan semanal creado/)).toBeVisible();
    assertClean(problems, 'cardio');
  });

  test('ejecuta una sesion de posing', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/posing');
    await expect(page.getByText(/poses/).first()).toBeVisible();
    await shot(page, '31-posing', info);

    await page.getByRole('button', { name: /Empezar sesion/ }).click();
    await expect(page.getByText('Mantener')).toBeVisible();
    await page.getByRole('button', { name: /Pausar/ }).click();
    await page.getByRole('button', { name: /Terminar y guardar/ }).click();
    await expect(page.getByText(/Sesion de .* min guardada/)).toBeVisible();
    assertClean(problems, 'posing');
  });

  test('completa el registro diario', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/diario');
    await expect(page.getByText('Peso en ayunas')).toBeVisible();
    await page.getByRole('button', { name: '4', exact: true }).first().click();
    await page.getByRole('button', { name: /Guardar registro/ }).click();
    await expect(page.getByText('Registro guardado')).toBeVisible();
    await shot(page, '32-diario', info);
    assertClean(problems, 'registro diario');
  });

  test('completa un check-in semanal y aplica la recomendacion', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/checkin');
    await expect(page.getByText('Resumen de la semana')).toBeVisible();
    await expect(page.getByText('Recomendacion')).toBeVisible();
    await shot(page, '33-checkin', info);

    // Los datos usados deben poder desplegarse
    await page.getByRole('button', { name: /Datos utilizados/ }).click();
    await expect(page.getByText(/Media de 7 dias/).first()).toBeVisible();

    await page.getByRole('button', { name: /Guardar check-in sin aplicar/ }).click();
    await expect(page.getByText('Check-in guardado')).toBeVisible();
    assertClean(problems, 'check-in');
  });
});
