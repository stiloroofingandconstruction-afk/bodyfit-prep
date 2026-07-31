import { defineConfig, devices } from '@playwright/test';

/**
 * Configuracion de Playwright.
 *
 * Se prueba contra el BUILD DE PRODUCCION (`vite preview`), no contra el dev
 * server: es el artefacto que realmente se despliega, con el service worker
 * generado y el codigo minificado. Probar el dev server daria falsos verdes.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'e2e/.results/report.json' }]],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // Zona horaria y locale fijos: las fechas de la app son locales
    timezoneId: 'Europe/Madrid',
    locale: 'es-ES',
  },

  projects: [
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],

  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
