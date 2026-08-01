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
 *
 * Son tres preguntas: quien eres, cuanto mides y pesas, y que buscas. El
 * modo competencia ya no se pregunta aqui; se activa desde Ajustes.
 */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BodyFit Prep' })).toBeVisible();

  // Bienvenida + las tres preguntas
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
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
      devMode: false,
    });
    /*
     * Copia reciente: sin esto el aviso de respaldo aparece fijo sobre la parte
     * baja de la pantalla y tapa los botones de guardar en varias pantallas.
     * El aviso tiene su propio test.
     */
    put('backup', {
      lastBackupAt: now, backupCount: 1, lastRestoreAt: null,
      remindEnabled: true, remindEveryDays: 7, remindSnoozedAt: null, autoDownload: false,
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

/** Enciende el modo desarrollador sin pasar por los siete toques. */
export async function enableDevMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    const key = 'bodyfit:v1:settings';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state: Record<string, unknown> };
    parsed.state.devMode = true;
    localStorage.setItem(key, JSON.stringify(parsed));
  });
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

/* ──────────────────────────── preferencias del usuario ───────────────── */

export interface Prefs {
  locale?: 'es' | 'en';
  weightUnit?: 'kg' | 'lb';
  lengthUnit?: 'cm' | 'in';
}

/**
 * Cambia idioma y unidades escribiendo directamente en el almacen persistido.
 *
 * Se hace asi y no navegando por Ajustes porque la matriz visual recorre
 * decenas de combinaciones: pasar por la interfaz en cada una multiplicaria el
 * tiempo sin comprobar nada nuevo. El camino por la interfaz ya se prueba en el
 * recorrido funcional.
 */
export async function setPrefs(page: Page, prefs: Prefs): Promise<void> {
  await page.evaluate((p) => {
    const key = 'bodyfit:v1:settings';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state: Record<string, unknown>; version: number };
    Object.assign(parsed.state, p);
    localStorage.setItem(key, JSON.stringify(parsed));
  }, prefs);
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 15_000 });
}

/* ─────────────────────────── comprobaciones visuales ─────────────────── */

/** La barra inferior debe verse entera, sin quedar bajo el borde de pantalla. */
export async function assertBottomNavVisible(page: Page, where: string): Promise<void> {
  const nav = page.getByRole('navigation');
  if ((await nav.count()) === 0) return;
  const box = await nav.first().boundingBox();
  const height = page.viewportSize()?.height ?? 0;
  expect(box, `no se encuentra la barra inferior en ${where}`).not.toBeNull();
  if (!box) return;
  expect(box.y + box.height, `la barra inferior se sale de la pantalla en ${where}`).toBeLessThanOrEqual(height + 1);
  expect(box.height, `la barra inferior es demasiado baja en ${where}`).toBeGreaterThan(40);
}

/**
 * Nada interactivo puede quedar fuera de la ventana en horizontal ni por encima
 * del borde superior: es el sintoma de que el area segura no se respeta.
 */
export async function assertNothingOffscreen(page: Page, where: string): Promise<void> {
  const offenders = await page.evaluate(() => {
    const out: string[] = [];
    const w = document.documentElement.clientWidth;

    /*
     * Un carrusel horizontal deja parte de sus hijos fuera de la ventana a
     * proposito: se desplazan con el dedo. Solo cuenta como fuera de pantalla
     * lo que no vive dentro de un contenedor con scroll horizontal.
     */
    const inScroller = (el: Element): boolean => {
      let node: Element | null = el.parentElement;
      while (node && node !== document.body) {
        const ox = getComputedStyle(node as HTMLElement).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
        node = node.parentElement;
      }
      return false;
    };

    for (const el of document.querySelectorAll('button, a[href], input, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (inScroller(el)) continue;
      if (r.right > w + 2 || r.left < -2 || r.bottom < 0) {
        out.push(`${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 25)}"`);
      }
    }
    return out.slice(0, 6);
  });
  expect(offenders, `elementos fuera de pantalla en ${where}`).toEqual([]);
}

/** Dos elementos de texto no deben solaparse: sintoma de textos largos en ingles. */
export async function assertNoOverlap(page: Page, where: string): Promise<void> {
  const overlaps = await page.evaluate(() => {
    /*
     * Las capas flotantes (barra inferior, hojas, avisos) se dibujan ENCIMA del
     * contenido por diseno: sus cajas se cruzan con las de debajo y eso no es
     * un solapamiento de texto. Se descartan mirando toda la cadena de padres,
     * no solo el propio elemento.
     */
    const floating = (el: Element): boolean => {
      let node: Element | null = el;
      while (node && node !== document.body) {
        const pos = getComputedStyle(node as HTMLElement).position;
        if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') return true;
        node = node.parentElement;
      }
      return false;
    };

    const nodes = [...document.querySelectorAll('h1, h2, p, span, button')]
      .filter((el) => {
        const e = el as HTMLElement;
        if (!e.textContent?.trim()) return false;
        if (e.children.length > 0) return false;
        if (floating(e)) return false;
        const r = e.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      })
      .slice(0, 220);

    const out: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i].getBoundingClientRect();
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j].getBoundingClientRect();
        // Solapamiento significativo, no un pixel de redondeo
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (dx > 6 && dy > 6) {
          // Elementos anidados o posicionados a proposito no cuentan
          if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue;
          out.push(
            `"${nodes[i].textContent?.trim().slice(0, 20)}" ↔ "${nodes[j].textContent?.trim().slice(0, 20)}"`,
          );
        }
      }
    }
    return [...new Set(out)].slice(0, 5);
  });
  expect(overlaps, `textos solapados en ${where}`).toEqual([]);
}

export const ROUTES = [
  '/', '/nutricion', '/entrenamiento', '/cuerpo', '/checkin', '/historial',
  '/fotos', '/ajustes', '/competencia', '/competencia/peak-week',
  '/competencia/dia-del-show', '/competencia/post-show', '/diario', '/cardio',
  '/posing', '/ejercicios', '/ejercicios/press-banca', '/informes',
  '/ajustes/recordatorios', '/ajustes/datos',
] as const;
