import { Outlet, useLocation } from 'react-router-dom';
import { RouteGuard } from './RouteGuard';
import { TabBar } from './TabBar';
import { RestTimerBar } from '@/features/training/RestTimerBar';
import { ActiveWorkoutBanner } from '@/features/training/ActiveWorkoutBanner';
import { SyncIndicator } from './SyncIndicator';

export function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/*
        `key` fuerza el remonte al cambiar de ruta para que la animacion de
        entrada se dispare igual que en una app nativa.
      */}
      <main
        key={pathname}
        className="fade-enter scroll-momentum flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
      >
        <RouteGuard>
          <Outlet />
        </RouteGuard>
      </main>

      {/*
        Va justo encima de la barra de pestanas, donde ya viven los avisos
        efimeros. Con la sincronizacion apagada devuelve `null` y no ocupa
        nada: no hay cambio visual para los usuarios actuales.
      */}
      <div className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 flex justify-center">
        <SyncIndicator />
      </div>

      <ActiveWorkoutBanner />
      <RestTimerBar />
      <TabBar />
    </div>
  );
}
