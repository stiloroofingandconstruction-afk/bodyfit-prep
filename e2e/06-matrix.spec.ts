import { test, expect } from '@playwright/test';
import {
  assertBottomNavVisible,
  assertNoClippedText,
  assertNoHorizontalOverflow,
  assertNoOverlap,
  assertNothingOffscreen,
  assertTouchTargets,
  collectProblems,
  assertClean,
  seedApp,
  setPrefs,
  SHOTS,
} from './helpers';
import { resolve } from 'node:path';

/**
 * Revision visual sobre la matriz de tamanos, idiomas y unidades.
 *
 * No comprueba que la pagina responda: comprueba que se VE bien. Cada
 * combinacion recorre las pantallas principales buscando desbordamiento,
 * texto recortado, solapamientos, elementos fuera de pantalla, objetivos
 * tactiles pequenos y la barra inferior tapada.
 *
 * Sobre el modo claro: la app se declara `color-scheme: dark` y no tiene tema
 * claro. Lo que se prueba es que forzar `prefers-color-scheme: light` no la
 * rompe ni deja texto ilegible — no que exista un tema claro, porque no existe.
 */

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-moderno', width: 393, height: 852 },
  { name: 'ipad-vertical', width: 820, height: 1180 },
  { name: 'ipad-horizontal', width: 1180, height: 820 },
  { name: 'escritorio-pequeno', width: 1280, height: 800 },
  { name: 'escritorio-grande', width: 1920, height: 1080 },
] as const;

/** Pantallas principales: las que un usuario ve a diario. */
const SCREENS = [
  { path: '/', name: 'inicio' },
  { path: '/nutricion', name: 'nutricion' },
  { path: '/entrenamiento', name: 'entrenamiento' },
  { path: '/cuerpo', name: 'progreso' },
  { path: '/checkin', name: 'checkin' },
  { path: '/ajustes', name: 'ajustes' },
  { path: '/ajustes/datos', name: 'datos-respaldo' },
  { path: '/ejercicios/press-banca', name: 'tecnica' },
] as const;

/** Combinaciones de idioma y unidades que merece la pena cruzar. */
const PREFS = [
  { locale: 'es', weightUnit: 'kg', lengthUnit: 'cm' },
  { locale: 'en', weightUnit: 'lb', lengthUnit: 'in' },
  { locale: 'en', weightUnit: 'kg', lengthUnit: 'cm' },
] as const;

/*
 * La matriz fija su propio tamano de ventana, asi que correrla en los dos
 * proyectos repetiria exactamente lo mismo. Se ejecuta en WebKit, que es el
 * motor de Safari y el que de verdad importa para un iPhone.
 */
test.describe('matriz visual', () => {
  test.skip(({ browserName }) => browserName !== 'webkit', 'la matriz corre en WebKit');

  for (const vp of VIEWPORTS) {
    for (const prefs of PREFS) {
      const tag = `${vp.name}-${prefs.locale}-${prefs.weightUnit}`;

      test(`${tag}`, async ({ page }, info) => {
        const problems = collectProblems(page);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await seedApp(page, true);
        await setPrefs(page, prefs);

        for (const screen of SCREENS) {
          await page.goto(screen.path);
          await page.waitForLoadState('networkidle');
          const where = `${tag} · ${screen.name}`;

          await assertNoHorizontalOverflow(page, where);
          await assertNoClippedText(page, where);
          await assertNothingOffscreen(page, where);
          await assertNoOverlap(page, where);
          await assertTouchTargets(page, where);
          // La barra solo existe dentro del layout con pestanas
          if (!screen.path.startsWith('/ajustes/')) {
            await assertBottomNavVisible(page, where);
          }

          // Solo se guardan capturas de los tamanos de telefono y del escritorio
          // pequeno: el resto multiplicaria archivos sin anadir informacion.
          if (vp.name !== 'ipad-horizontal' && vp.name !== 'escritorio-grande') {
            await page.screenshot({
              path: resolve(SHOTS, `matriz-${tag}-${screen.name}.png`),
              fullPage: true,
            });
          }
        }

        assertClean(problems, tag);
      });
    }
  }
});

test.describe('esquema de color y area segura', () => {
  test('forzar modo claro no rompe la interfaz', async ({ page }) => {
    const problems = collectProblems(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await seedApp(page);

    for (const path of ['/', '/nutricion', '/ajustes']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalOverflow(page, `claro ${path}`);
      await assertNoClippedText(page, `claro ${path}`);

      // El fondo sigue siendo oscuro: la app declara color-scheme: dark
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg, `fondo inesperado en ${path}`).not.toBe('rgb(255, 255, 255)');
    }

    await page.screenshot({ path: resolve(SHOTS, 'modo-claro-inicio.png'), fullPage: true });
    assertClean(problems, 'modo claro');
  });

  test('el contenido respeta el area segura declarada', async ({ page }) => {
    await seedApp(page);
    await page.goto('/');
    // La pantalla llega por chunk aparte: sin esperar, aun no hay cabecera
    await expect(page.locator('header')).toBeVisible();

    // La cabecera usa env(safe-area-inset-top): sin recorte el valor es 0, pero
    // el padding declarado debe existir igualmente para que el recorte funcione.
    const header = await page.evaluate(() => {
      const el = document.querySelector('header');
      if (!el) return null;
      const style = getComputedStyle(el);
      return { paddingTop: style.paddingTop, position: style.position };
    });
    expect(header, 'no hay cabecera').not.toBeNull();
    expect(header!.position).toBe('sticky');
    expect(parseFloat(header!.paddingTop)).toBeGreaterThan(0);

    const nav = await page.evaluate(() => {
      const el = document.querySelector('nav');
      if (!el) return null;
      return getComputedStyle(el).paddingBottom;
    });
    expect(nav, 'no hay barra inferior').not.toBeNull();
  });

  test('los textos largos en ingles no rompen la barra inferior', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await seedApp(page);
    await setPrefs(page, { locale: 'en' });
    await page.goto('/');

    await assertNoHorizontalOverflow(page, 'ingles en 320 px');
    await assertBottomNavVisible(page, 'ingles en 320 px');
    await page.screenshot({ path: resolve(SHOTS, 'ingles-320px.png'), fullPage: true });
  });
});

test.describe('modales', () => {
  test('las hojas modales se pueden cerrar siempre', async ({ page }) => {
    const problems = collectProblems(page);
    await seedApp(page);
    await page.goto('/cuerpo');

    // Abre el registro de peso y cierra con el boton de cerrar
    await page.getByRole('button', { name: /Registrar peso|Log weight/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    // Hay boton de cerrar visible dentro de la hoja
    const close = sheet.getByRole('button', { name: /Cerrar|Close/ });
    await expect(close, 'la hoja no ofrece boton de cerrar').toHaveCount(1);
    await expect(close).toBeVisible();

    // Escape cierra
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    // El boton de cerrar tambien
    await page.getByRole('button', { name: /Registrar peso|Log weight/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Cerrar|Close/ }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Y tocar fuera de la hoja tambien: nunca se queda atrapado
    await page.getByRole('button', { name: /Registrar peso|Log weight/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('.fixed.inset-0 > button').first().click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeHidden();

    assertClean(problems, 'modales');
  });
});
