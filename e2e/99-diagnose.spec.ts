import { expect, test } from '@playwright/test';
import { seedApp } from './helpers';

/**
 * Diagnostico puntual. No forma parte de la bateria funcional: sirve para
 * aislar por que falla el guardado de fotos en WebKit.
 */
test('diagnostico: IndexedDB y procesado de imagen', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));

  await seedApp(page);

  const result = await page.evaluate(async () => {
    const out: Record<string, string> = {};

    // 1. ¿Existe IndexedDB y se puede abrir?
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('diag-test', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('s');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      out.indexedDB = 'ok';

      // 2. ¿Se puede guardar un Blob directamente? (WebKit dice que no)
      try {
        await new Promise<void>((resolve, reject) => {
          const t = db.transaction('s', 'readwrite');
          const r = t.objectStore('s').put(new Blob(['x']), 'blob');
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        });
        out.putBlob = 'ok';
      } catch (e) {
        out.putBlob = `FALLA: ${(e as Error)?.message ?? e}`;
      }

      // 3. ¿Y un ArrayBuffer? (la solucion adoptada)
      await new Promise<void>((resolve, reject) => {
        const t = db.transaction('s', 'readwrite');
        const r = t.objectStore('s').put({ type: 'image/png', data: new ArrayBuffer(8) }, 'buf');
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
      });
      out.putArrayBuffer = 'ok';
      db.close();
    } catch (e) {
      out.indexedDB = `FALLA: ${(e as Error)?.message ?? e}`;
    }

    // 3. ¿createImageBitmap sobre un PNG 1x1?
    try {
      const res = await fetch(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      );
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      out.createImageBitmap = `ok ${bmp.width}x${bmp.height}`;
      bmp.close();
    } catch (e) {
      out.createImageBitmap = `FALLA: ${(e as Error)?.message ?? e}`;
    }

    // 4. ¿canvas.toBlob?
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.8));
      out.toBlob = blob ? `ok ${blob.size} bytes` : 'FALLA: devolvio null';
    } catch (e) {
      out.toBlob = `FALLA: ${(e as Error)?.message ?? e}`;
    }

    // 5. ¿crypto.randomUUID?
    out.randomUUID = 'randomUUID' in crypto ? 'disponible' : 'ausente';

    return out;
  });

  console.log('DIAGNOSTICO:', JSON.stringify(result, null, 2));
  console.log('LOGS DE PAGINA:', logs.slice(0, 10).join(' || '));

  expect(result.indexedDB).toBe('ok');
  // Lo que la app necesita de verdad: guardar ArrayBuffer, no Blob
  expect(result.putArrayBuffer, 'IndexedDB debe aceptar ArrayBuffer').toBe('ok');
});
