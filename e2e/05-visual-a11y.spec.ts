import { expect, test } from '@playwright/test';
import {
  assertAccessibility,
  assertNoClippedText,
  assertNoHorizontalOverflow,
  assertTouchTargets,
  collectProblems,
  seedApp,
  shot,
} from './helpers';

/** Pantallas de las que se pide captura explicita. */
const SCREENS = [
  { name: 'dashboard', url: '/' },
  { name: 'nutricion', url: '/nutricion' },
  { name: 'entrenamiento', url: '/entrenamiento' },
  { name: 'tecnica', url: '/ejercicios/sentadilla' },
  { name: 'competencia', url: '/competencia' },
  { name: 'posing', url: '/posing' },
  { name: 'fotos', url: '/fotos' },
  { name: 'ajustes', url: '/ajustes' },
  { name: 'historial', url: '/historial' },
] as const;

test.describe('Capturas y revision visual', () => {
  for (const screen of SCREENS) {
    test(`captura y audita ${screen.name}`, async ({ page }, info) => {
      const problems = collectProblems(page);
      await seedApp(page, true);
      await page.goto(screen.url);
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await page.waitForTimeout(400);

      await shot(page, `screen-${screen.name}`, info);

      await assertNoHorizontalOverflow(page, screen.name);
      await assertAccessibility(page, screen.name);
      await assertNoClippedText(page, screen.name);

      expect(problems.errors, `errores en ${screen.name}`).toEqual([]);
    });
  }

  test('objetivos tactiles suficientes en las pantallas principales', async ({ page }) => {
    await seedApp(page, true);
    for (const url of ['/', '/nutricion', '/entrenamiento', '/ajustes']) {
      await page.goto(url);
      await expect(page.locator('h1').first()).toBeVisible();
      await assertTouchTargets(page, url, 26);
    }
  });

  test('las hojas inferiores no desbordan ni recortan', async ({ page }, info) => {
    const problems = collectProblems(page);
    await seedApp(page, true);

    await page.goto('/nutricion');
    await page.getByRole('button', { name: /Anadir a/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'hoja de busqueda de alimentos');
    await shot(page, '60-hoja-alimentos', info);
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();

    await page.goto('/cuerpo');
    await page.getByRole('button', { name: 'Medidas' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'hoja de medidas');
    await assertAccessibility(page, 'hoja de medidas');

    expect(problems.errors, 'errores en hojas').toEqual([]);
  });

  test('no hay imagenes ni iconos rotos en toda la app', async ({ page }) => {
    await seedApp(page, true);
    const broken: string[] = [];

    for (const url of ['/', '/cuerpo', '/fotos', '/ejercicios/sentadilla', '/ajustes']) {
      await page.goto(url);
      await page.waitForTimeout(300);
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll('img')]
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.src),
      );
      broken.push(...bad);
    }
    expect(broken, 'imagenes rotas').toEqual([]);
  });

  test('el contenido respeta el area segura del notch', async ({ page }) => {
    await seedApp(page);
    await page.goto('/');
    // La cabecera fija no debe solaparse con el primer contenido
    const overlap = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      if (!header || !main) return 0;
      const h = header.getBoundingClientRect();
      return h.top < 0 ? Math.abs(h.top) : 0;
    });
    expect(overlap, 'la cabecera se sale por arriba').toBe(0);
  });
});
