import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import { RestTimerBar } from '@/features/training/RestTimerBar';
import { ActiveWorkoutBanner } from '@/features/training/ActiveWorkoutBanner';

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
        <Outlet />
      </main>

      <ActiveWorkoutBanner />
      <RestTimerBar />
      <TabBar />
    </div>
  );
}
