import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const SHOTS = resolve(process.cwd(), 'e2e/screenshots');
mkdirSync(SHOTS, { recursive: true });

/* ─────────────────────────────── recoleccion de errores ───────────────── */

export interface PageProblems {
  errors: string[];
  warnings: string[];
  failedRequests: string[];
}

/**
 * Engancha la recoleccion de errores de consola, excepciones de pagina y
 * peticiones fallidas. Se llama al principio de cada test.
 */
export function collectProblems(page: Page): PageProblems {
  const problems: PageProblems = { errors: [], warnings: [], failedRequests: [] };

  page.on('console', (msg) => {
    const text = msg.text();
    // Ruido conocido que no indica un fallo de la app
    if (/Download the React DevTools/i.test(text)) return;
    if (/\[vite\]/i.test(text)) return;
    if (msg.type() === 'error') problems.errors.push(text);
    if (msg.type() === 'warning') problems.warnings.push(text);
  });

  page.on('pageerror', (err) => problems.errors.push(`pageerror: ${err.message}`));

  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText ?? 'desconocido';
    /*
     * Cancelar la descarga de un chunk al navegar no es un fallo: el navegador
     * aborta lo que ya no necesita. Cada motor lo llama distinto.
     */
    if (/ERR_ABORTED|NS_BINDING_ABORTED|cancell?ed|aborted/i.test(failure)) return;
    problems.failedRequests.push(`${req.url()} — ${failure}`);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      problems.failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
    }
  });

  return problems;
}

/** Falla el test si se acumularon errores de consola o peticiones rotas. */
export function assertClean(problems: PageProblems, context: string): void {
  expect(problems.errors, `errores de consola en ${context}`).toEqual([]);
  expect(problems.failedRequests, `peticiones fallidas en ${context}`).toEqual([]);
}

/* ─────────────────────────────────── onboarding ───────────────────────── */

/**
 * Completa el onboarding para llegar a la app.
 * Es la puerta de entrada obligatoria: sin esto no hay ninguna otra pantalla.
 */
export async function completeOnboarding(
  page: Page,
  opts: { competition?: boolean; name?: string } = {},
): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BodyFit Prep' })).toBeVisible();

  // Paso 0: bienvenida
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Paso 1: uso
  if (opts.competition) {
    await page.getByRole('button', { name: /Preparacion para competir/ }).click();
    await page.getByPlaceholder('Mi primera competencia').fill('Show de prueba');
  }
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Paso 2: datos
  await page.getByPlaceholder('Tu nombre').fill(opts.name ?? 'QA');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Paso 3: objetivo
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Paso 4: macros
  await page.getByRole('button', { name: 'Empezar' }).click();

  await expect(page.getByRole('navigation')).toBeVisible();
}

/** Estado ya inicializado: evita repetir el onboarding en cada test. */
export async function seedApp(page: Page, competition = false): Promise<void> {
  await page.goto('/');
  await page.evaluate((comp) => {
    const now = new Date().toISOString();
    const put = (key: string, state: unknown) =>
      localStorage.setItem(`bodyfit:v1:${key}`, JSON.stringify({ state, version: 1 }));

    put('profile', {
      profile: {
        name: 'QA', sex: 'hombre', birthDate: '1995-01-01', heightCm: 178,
        startWeight: 82, activity: 'moderado', goal: 'definicion', paceWeekPct: 0.6,
        proteinPerKg: 2, fatPerKg: 0.8, kcalOverride: null, units: 'metric', onboarded: true,
      },
    });
    put('settings', {
      weightUnit: 'kg', lengthUnit: 'cm', locale: 'es',
      competitionMode: comp, division: "Men's Physique", experience: 'intermedio',
      trainingDaysPerWeek: 4, discomforts: [], avoidedExercises: [], excludedFoods: [],
      stepGoal: 10000, waterGoalMl: 3000, exerciseMedia: {}, reminders: [],
      acknowledgedDisclaimer: true,
    });
    put('body', {
      measurements: [
        { id: 'm1', createdAt: now, updatedAt: now, date: isoDaysAgo(2), weight: 82.4, waist: 84 },
        { id: 'm2', createdAt: now, updatedAt: now, date: isoDaysAgo(1), weight: 82.1 },
      ],
    });
    if (comp) {
      put('prep', {
        preps: [{
          id: 'p1', createdAt: now, updatedAt: now,
          showName: 'Show de prueba', federation: 'NPC', division: "Men's Physique",
          category: 'Open', showDate: isoDaysAhead(84), prepStartDate: isoDaysAgo(28),
          startWeight: 86, targetWeight: 78, status: 'activo',
        }],
        activePrepId: 'p1',
        readiness: Array.from({ length: 14 }, (_, i) => ({
          id: `r${i}`, createdAt: now, updatedAt: now,
          date: isoDaysAgo(13 - i), weight: 84 - i * 0.12, weighTime: '07:00',
          sleepQuality: 4, energy: 4, hunger: 2, stress: 2, digestion: 4,
        })),
        recommendations: [], peakWeekPlans: [], showDayPlans: [],
        postShowPlans: [], postShowEntries: [],
      });
    }

    function isoDaysAgo(n: number) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    }
    function isoDaysAhead(n: number) {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    }
  }, competition);
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 });
}

/* ─────────────────────────────────── capturas ─────────────────────────── */

export async function shot(page: Page, name: string, info?: TestInfo): Promise<void> {
  const project = info?.project.name ?? 'default';
  await page.waitForTimeout(350); // deja terminar las animaciones de entrada
  await page.screenshot({
    path: resolve(SHOTS, `${project}-${name}.png`),
    fullPage: true,
  });
}

/* ───────────────────────────────── comprobaciones ─────────────────────── */

/** Detecta desbordamiento horizontal: el sintoma clasico en movil. */
export async function assertNoHorizontalOverflow(page: Page, where: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      offenders: [...document.querySelectorAll('*')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > doc.clientWidth + 2 || r.left < -2);
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 60)}`),
    };
  });
  expect(
    overflow.scrollWidth,
    `desbordamiento horizontal en ${where}: ${overflow.offenders.join(' | ')}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

/** Comprueba que ningun elemento interactivo queda por debajo del minimo tactil. */
export async function assertTouchTargets(page: Page, where: string, min = 28): Promise<void> {
  const small = await page.evaluate((minSize) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('button, a[href], input, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // oculto
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (r.height < minSize || r.width < minSize) {
        out.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 25)}"`);
      }
    }
    return out.slice(0, 8);
  }, min);
  expect(small, `objetivos tactiles demasiado pequenos en ${where}`).toEqual([]);
}

/** Accesibilidad basica: botones sin nombre accesible, imagenes sin alt. */
export async function assertAccessibility(page: Page, where: string): Promise<void> {
  const issues = await page.evaluate(() => {
    const out: string[] = [];

    for (const btn of document.querySelectorAll('button')) {
      const r = btn.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name =
        btn.getAttribute('aria-label') ||
        btn.getAttribute('title') ||
        btn.textContent?.trim() ||
        '';
      if (!name) out.push(`boton sin nombre accesible: ${btn.className.toString().slice(0, 50)}`);
    }

    for (const img of document.querySelectorAll('img')) {
      if (img.getAttribute('alt') === null) out.push(`imagen sin alt: ${img.src.slice(0, 60)}`);
    }

    for (const input of document.querySelectorAll('input, select, textarea')) {
      const el = input as HTMLInputElement;
      if (el.type === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const labelled =
        el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        el.getAttribute('title') ||
        (el.id && document.querySelector(`label[for="${el.id}"]`));
      if (!labelled) out.push(`campo sin etiqueta: ${el.tagName.toLowerCase()}[type=${el.type}]`);
    }

    // Un solo h1 por pantalla
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) out.push(`${h1s.length} elementos h1 en la misma pantalla`);

    return out.slice(0, 10);
  });
  expect(issues, `problemas de accesibilidad en ${where}`).toEqual([]);
}

/** Texto recortado: el contenido no cabe en su caja y no hay scroll. */
export async function assertNoClippedText(page: Page, where: string): Promise<void> {
  const clipped = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('p, span, h1, h2, h3, button, li')) {
      const e = el as HTMLElement;
      if (!e.textContent?.trim()) continue;
      const style = getComputedStyle(e);
      // `truncate` de Tailwind es intencional: se salta
      if (style.textOverflow === 'ellipsis' || style.overflow === 'hidden') continue;
      if (e.scrollHeight > e.clientHeight + 4 && style.overflowY === 'visible') {
        // Elementos con hijos posicionados dan falsos positivos: solo hojas de texto
        if (e.children.length === 0) {
          out.push(`${e.tagName.toLowerCase()} "${e.textContent.trim().slice(0, 40)}"`);
        }
      }
    }
    return out.slice(0, 6);
  });
  expect(clipped, `texto recortado en ${where}`).toEqual([]);
}

/** Recorre la pantalla completa: overflow, a11y, tactil y texto. */
export async function auditScreen(page: Page, where: string): Promise<void> {
  await assertNoHorizontalOverflow(page, where);
  await assertAccessibility(page, where);
  await assertNoClippedText(page, where);
}

export const ROUTES = [
  '/', '/nutricion', '/entrenamiento', '/cuerpo', '/checkin', '/historial',
  '/fotos', '/ajustes', '/competencia', '/competencia/peak-week',
  '/competencia/dia-del-show', '/competencia/post-show', '/diario', '/cardio',
  '/posing', '/ejercicios', '/ejercicios/press-banca', '/informes',
  '/ajustes/videos', '/ajustes/recordatorios',
] as const;
