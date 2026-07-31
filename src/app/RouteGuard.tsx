import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { clearSafeMode, isSafeMode } from '@/services/errorLog';
import { t } from '@/i18n';

/**
 * Envuelve cada ruta en su propio limite de error y aplica el modo seguro.
 *
 * El limite se reinicia con la ruta (`key={pathname}`): si el usuario navega a
 * otra pantalla despues de un fallo, debe encontrarsela funcionando, no la
 * pantalla de error anterior congelada.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [safe, setSafe] = useState(() => isSafeMode(pathname));

  useEffect(() => {
    setSafe(isSafeMode(pathname));
  }, [pathname]);

  if (safe) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-amber/15 text-amber">
          <ShieldAlert size={20} />
        </div>
        <h1 className="mt-4 text-[19px] font-bold">{t('err.safeModeTitle')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {t('err.safeModeBody')}
        </p>
        <p className="mt-2 text-[13px] text-muted">
          {t('err.safeModeData')}
        </p>
        <button
          onClick={() => {
            clearSafeMode(pathname);
            setSafe(false);
          }}
          className="pressable mt-5 h-12 w-full rounded-2xl bg-brand text-[15px] font-semibold text-base"
        >
          {t('err.safeModeRetry')}
        </button>
        <a
          href="/ajustes/datos"
          className="pressable mt-2 flex h-12 w-full items-center justify-center rounded-2xl border border-line text-[15px]"
        >
          {t('err.goToData')}
        </a>
      </main>
    );
  }

  return (
    <ErrorBoundary key={pathname} route={pathname} label={`ruta ${pathname}`}>
      {children}
    </ErrorBoundary>
  );
}
