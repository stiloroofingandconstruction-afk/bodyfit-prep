import { expect, test, type Page } from '@playwright/test';
import { assertClean, collectProblems, completeOnboarding, enableDevMode, seedApp } from './helpers';

/**
 * Fase 1: menos toques en lo que se hace todos los dias.
 *
 * Cada prueba cuenta toques de verdad, no comprueba que el boton exista. Si un
 * cambio futuro vuelve a meter un paso por el medio, estas pruebas fallan.
 */

/** Deja un entreno de press de banca en el historial para tener "ultima vez". */
async function seedPressHistory(page: Page, weight = 100, reps = 8): Promise<void> {
  await page.evaluate(
    ({ w, r }) => {
      const now = new Date().toISOString();
      const day = new Date();
      day.setDate(day.getDate() - 3);
      const date = day.toISOString().slice(0, 10);
      localStorage.setItem(
        'bodyfit:v1:training',
        JSON.stringify({
          state: {
            workouts: [
              {
                id: 'w-hist', createdAt: now, updatedAt: now, deletedAt: null, userId: null,
                date, name: 'Push', startedAt: `${date}T10:00:00.000Z`,
                finishedAt: `${date}T11:00:00.000Z`,
                exercises: [
                  {
                    id: 'we1', exerciseId: 'press-banca', exerciseName: 'Press de banca',
                    restSeconds: 120,
                    sets: [
                      { id: 's1', weight: w, reps: r, done: true, type: 'normal' },
                      { id: 's2', weight: w, reps: r, done: true, type: 'normal' },
                    ],
                  },
                ],
              },
            ],
            routines: [],
            active: null,
          },
          version: 1,
        }),
      );
    },
    { w: weight, r: reps },
  );
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 });
}

/* ══════════════════════════════════════════════════════ ENTRENAMIENTO ══ */

test.describe('sesion activa', () => {
  test('muestra la ultima sesion del ejercicio junto al formulario', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await seedPressHistory(page, 100, 8);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca/).fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    // Lo de la ultima vez, con sus pesos y repeticiones
    await expect(page.getByText(/Ultima vez ·/)).toBeVisible();
    await expect(page.getByText(/100×8\s+100×8/)).toBeVisible();

    assertClean(problems, 'ultima sesion');
  });

  test('la progresion sugerida se acepta con un toque', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    // 100x8 en un rango 6-10 no llega al tope: toca sumar una repeticion
    await seedPressHistory(page, 100, 10);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca/).fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    // Completo el rango alto (10 en un rango 6-10): la sugerencia sube el peso
    const suggestion = page.getByRole('button', { name: /Hoy: 102\.5 kg × 6/ });
    await expect(suggestion).toBeVisible();

    // UN toque deja las tres series preparadas
    await suggestion.click();

    const weights = page.locator('input[inputmode="decimal"]');
    await expect(weights.first()).toHaveValue('102.5');
    const reps = page.locator('input[inputmode="numeric"]');
    await expect(reps.first()).toHaveValue('6');

    // Todas las series, no solo la primera
    expect(await weights.count()).toBeGreaterThanOrEqual(3);
    await expect(weights.nth(2)).toHaveValue('102.5');

    assertClean(problems, 'progresion');
  });

  test('la progresion no pisa las series ya marcadas', async ({ page }) => {
    await seedApp(page);
    await seedPressHistory(page, 100, 10);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca/).fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    // Se registra la primera serie a mano y se marca
    const weights = page.locator('input[inputmode="decimal"]');
    const reps = page.locator('input[inputmode="numeric"]');
    await weights.first().fill('95');
    await reps.first().fill('12');
    await page.getByRole('button', { name: /Completar serie/ }).first().click();

    await page.getByRole('button', { name: /Hoy: / }).click();

    // La marcada se queda como estaba; las demas reciben la sugerencia
    await expect(weights.first()).toHaveValue('95');
    await expect(weights.nth(1)).toHaveValue('102.5');
  });

  test('el RIR se registra en dos toques y se guarda', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Entreno libre/ }).click();
    await page.getByRole('button', { name: /Anadir ejercicio/ }).first().click();
    await page.getByPlaceholder(/Press de banca/).fill('press de banca');
    await page.getByRole('button', { name: /^Press de banca/ }).first().click();

    await page.locator('input[inputmode="decimal"]').first().fill('80');
    await page.locator('input[inputmode="numeric"]').first().fill('10');

    // Toque 1: abrir. Toque 2: responder.
    await page.getByRole('button', { name: /Repeticiones en reserva/ }).first().click();
    await expect(page.getByText(/Cuantas te quedaban al parar/)).toBeVisible();
    await page.getByRole('button', { name: '2', exact: true }).first().click();

    // El selector se cierra solo y el valor queda a la vista
    await expect(page.getByText(/Cuantas te quedaban al parar/)).toBeHidden();
    await expect(page.getByRole('button', { name: /Repeticiones en reserva/ }).first()).toHaveText('2');

    // Y llega al almacenamiento
    await page.getByRole('button', { name: /Completar serie/ }).first().click();
    const rir = await page.evaluate(() => {
      const raw = localStorage.getItem('bodyfit:v1:training');
      const state = JSON.parse(raw!).state as {
        active: { exercises: { sets: { rir?: number }[] }[] } | null;
      };
      return state.active?.exercises[0].sets[0].rir ?? null;
    });
    expect(rir, 'el RIR no se guardo').toBe(2);

    assertClean(problems, 'rir');
  });

  test('repetir el ultimo entrenamiento deja la sesion lista de un toque', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await seedPressHistory(page, 100, 8);

    await page.goto('/entrenamiento');
    await page.getByRole('button', { name: /Repetir: Push/ }).click();

    await expect(page).toHaveURL(/entrenamiento\/activo/);
    await expect(page.getByRole('heading', { name: 'Push' })).toBeVisible();

    // Mismos pesos, ninguna serie marcada
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('100');
    const done = await page.evaluate(() => {
      const raw = localStorage.getItem('bodyfit:v1:training');
      const state = JSON.parse(raw!).state as {
        active: { exercises: { sets: { done: boolean }[] }[] } | null;
      };
      return state.active?.exercises.flatMap((e) => e.sets).filter((s) => s.done).length ?? -1;
    });
    expect(done, 'las series no deben venir marcadas').toBe(0);

    assertClean(problems, 'repetir entreno');
  });
});

/* ═════════════════════════════════════════════════════════ NUTRICION ══ */

test.describe('registro de comida', () => {
  test('un alimento frecuente se registra en dos toques', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    // Se registra una vez para que la app recuerde la cantidad
    await page.goto('/nutricion');
    await page.getByRole('button', { name: /^Anadir a /i }).first().click();
    await page.getByPlaceholder(/Pollo, arroz/).fill('pollo');
    await page.getByRole('button', { name: /Pechuga de pollo \(cocida\)/ }).click();
    for (const d of ['1', '5', '0']) {
      await page.getByRole('button', { name: d, exact: true }).first().click();
    }
    await page.getByRole('dialog').getByRole('button', { name: /^Anadir 150/ }).click();

    const before = await countEntries(page);

    /*
     * A partir de aqui: dos toques. Abrir el buscador y tocar la cantidad de
     * siempre, que ya aparece en la fila sin escribir nada.
     */
    await page.getByRole('button', { name: /^Anadir a /i }).first().click();
    const quick = page.getByRole('button', { name: /Anadir 150 g/ }).first();
    await expect(quick, 'no se recuerda la cantidad anterior').toBeVisible();
    await quick.click();

    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await countEntries(page), 'el alta rapida no registro').toBe(before + 1);

    assertClean(problems, 'alta rapida');
  });

  test('un alimento nuevo propone una cantidad razonable', async ({ page }) => {
    await seedApp(page);
    await page.goto('/nutricion');
    await page.getByRole('button', { name: /^Anadir a /i }).first().click();

    /*
     * Sin historial manda la racion declarada del alimento: el aceite de oliva
     * propone una cucharada, no 100 g. Los que no declaran racion caen en 100 g.
     */
    await page.getByPlaceholder(/Pollo, arroz/).fill('aceite de oliva');
    await expect(page.getByRole('button', { name: /Anadir 14 g/ }).first()).toBeVisible();

    await page.getByPlaceholder(/Pollo, arroz/).fill('brocoli');
    await expect(page.getByRole('button', { name: /Anadir 100 g/ }).first()).toBeVisible();
  });

  test('repetir la comida de ayer copia la franja entera de un toque', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    // Ayer se comieron dos alimentos en la cena
    await page.evaluate(() => {
      const now = new Date().toISOString();
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().slice(0, 10);
      const entry = (id: string, foodId: string, foodName: string, grams: number) => ({
        id, createdAt: now, updatedAt: now, deletedAt: null, userId: null,
        date: yesterday, slot: 'cena', foodId, foodName, grams,
        macros: { kcal: 200, protein: 30, carbs: 10, fat: 4, fiber: 1 },
      });
      localStorage.setItem(
        'bodyfit:v1:nutrition',
        JSON.stringify({
          state: {
            entries: [
              entry('e1', 'pollo-pechuga-cocida', 'Pollo', 150),
              entry('e2', 'arroz-blanco-cocido', 'Arroz', 200),
            ],
            customFoods: [], recipes: [], favorites: [], recent: [], portions: {}, dayTypes: {},
          },
          version: 1,
        }),
      );
    });
    await page.goto('/nutricion');

    const before = await countEntries(page);
    await page.getByRole('button', { name: /Repetir el de ayer \(2\)/ }).click();

    expect(await countEntries(page), 'no se copiaron los dos alimentos').toBe(before + 2);
    await expect(page.getByText('Pollo').first()).toBeVisible();

    assertClean(problems, 'repetir comida');
  });
});

async function countEntries(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('bodyfit:v1:nutrition');
    if (!raw) return 0;
    const state = JSON.parse(raw).state as { entries: { deletedAt?: string | null }[] };
    return state.entries.filter((e) => !e.deletedAt).length;
  });
}

/* ═════════════════════════════════════════════════════════ ONBOARDING ══ */

test.describe('onboarding', () => {
  test('son tres preguntas y ninguna mas', async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'BodyFit Prep' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: /Quien eres/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: /Cuanto mides y pesas/ })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: /Que buscas/ })).toBeVisible();
    // El objetivo se muestra como resultado, no como un paso mas
    await expect(page.getByText('Tu objetivo diario')).toBeVisible();

    await page.getByRole('button', { name: 'Empezar' }).click();
    await expect(page.getByRole('navigation')).toBeVisible();

    // Lo que ya no se pregunta tiene un valor por defecto sensato
    const profile = await page.evaluate(() => {
      const raw = localStorage.getItem('bodyfit:v1:profile');
      return JSON.parse(raw!).state.profile as Record<string, unknown>;
    });
    expect(profile.activity).toBe('moderado');
    expect(profile.onboarded).toBe(true);
    expect(profile.heightCm).toBeGreaterThan(0);

    assertClean(problems, 'onboarding');
  });

  test('el peso de la primera pregunta queda registrado', async ({ page }) => {
    await completeOnboarding(page);
    const measurements = await page.evaluate(() => {
      const raw = localStorage.getItem('bodyfit:v1:body');
      return (JSON.parse(raw!).state as { measurements: unknown[] }).measurements;
    });
    expect(measurements.length).toBe(1);
  });
});

/* ═══════════════════════════════════════════ MODO DESARROLLADOR ══ */

test.describe('herramientas de mantenimiento', () => {
  test('no aparecen en Ajustes ni son accesibles por URL', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/ajustes');

    await expect(page.getByRole('link', { name: /Videos de ejercicios/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Diagnostico/ })).toHaveCount(0);

    // Un enlace viejo acaba en Ajustes, no en una pantalla de diagnostico
    for (const path of ['/ajustes/diagnostico', '/ajustes/videos', '/ajustes/diagnostico/iphone']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
    }

    assertClean(problems, 'sin modo desarrollador');
  });

  test('siete toques en la version las hacen aparecer', async ({ page }) => {
    await seedApp(page);
    await page.goto('/ajustes');

    const version = page.getByRole('button', { name: /BodyFit Prep · v/ });
    for (let i = 0; i < 7; i++) await version.click();

    await expect(page.getByText('Modo desarrollador activado')).toBeVisible();
    await expect(page.getByRole('link', { name: /Videos de ejercicios/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Diagnostico/ })).toBeVisible();

    await page.goto('/ajustes/diagnostico');
    await expect(page.getByRole('heading', { name: 'Diagnostico' })).toBeVisible();
  });

  test('con el modo activo las pantallas siguen funcionando enteras', async ({ page }) => {
    await seedApp(page);
    await enableDevMode(page);

    await page.goto('/ajustes/diagnostico/iphone');
    await expect(page.getByRole('heading', { name: /Prueba de iPhone/ })).toBeVisible();

    await page.goto('/ajustes/videos');
    await expect(page.getByRole('heading', { name: /Videos de ejercicios/ })).toBeVisible();
  });
});
