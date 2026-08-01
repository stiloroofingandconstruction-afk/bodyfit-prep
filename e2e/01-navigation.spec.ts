import { expect, test } from '@playwright/test';
import {
  ROUTES,
  assertClean,
  auditScreen,
  collectProblems,
  seedApp,
  shot,
} from './helpers';

test.describe('Navegacion y salud de cada pantalla', () => {
  test('el onboarding se completa y deja la app usable', async ({ page }, info) => {
    const problems = collectProblems(page);
    const { completeOnboarding } = await import('./helpers');

    await completeOnboarding(page);
    await expect(page.getByText(/Buen[oa]s/)).toBeVisible();
    await shot(page, '00-onboarding-completado', info);
    assertClean(problems, 'onboarding');
  });

  test('todas las rutas cargan sin errores de consola', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    for (const route of ROUTES) {
      await page.goto(route);
      // Cada pantalla debe pintar al menos un encabezado
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
      await auditScreen(page, route);
    }

    await shot(page, '01-ultima-ruta', info);
    assertClean(problems, 'recorrido de rutas');
  });

  test('una ruta inexistente redirige al inicio', async ({ page }) => {
    await seedApp(page);
    await page.goto('/ruta-que-no-existe');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('la barra de pestanas navega a las 5 secciones', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);

    const nav = page.getByRole('navigation');
    for (const [label, url] of [
      ['Nutricion', '/nutricion'],
      ['Entreno', '/entrenamiento'],
      ['Progreso', '/cuerpo'],
      ['Ajustes', '/ajustes'],
      ['Inicio', '/'],
    ] as const) {
      await nav.getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${url.replace('/', '\\/')}$`));
    }
    assertClean(problems, 'barra de pestanas');
  });

  test('con modo competencia la pestana cambia a Prep', async ({ page }) => {
    await seedApp(page, true);
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Prep' })).toBeVisible();
    await nav.getByRole('link', { name: 'Prep' }).click();
    await expect(page).toHaveURL(/\/competencia$/);
    await expect(page.getByRole('heading', { name: 'Show de prueba' })).toBeVisible();
  });

  test('todos los botones visibles responden sin romper la pagina', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    // Se prueban las pantallas con mas densidad de controles
    for (const route of ['/', '/nutricion', '/entrenamiento', '/cuerpo', '/competencia', '/ajustes']) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();

      const buttons = page.locator('main button:visible, button:visible').filter({
        // Los destructivos se prueban aparte, no a ciegas
        hasNotText: /Borrar todos los datos|Descartar|Eliminar/i,
      });
      const count = Math.min(await buttons.count(), 14);

      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (!(await btn.isVisible().catch(() => false))) continue;
        await btn.click({ timeout: 4000 }).catch(() => undefined);
        await page.waitForTimeout(120);

        // Si se abrio una hoja, se cierra para seguir con la siguiente
        const close = page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).first();
        if (await close.isVisible().catch(() => false)) {
          await close.click().catch(() => undefined);
          await page.waitForTimeout(150);
        }
        // Algun boton puede navegar: se vuelve a la ruta bajo prueba
        if (!page.url().endsWith(route === '/' ? '/' : route)) {
          await page.goto(route);
          await page.waitForTimeout(150);
        }
        await expect(page.locator('#root')).not.toBeEmpty();
      }
    }

    assertClean(problems, 'clic masivo en botones');
  });
});
