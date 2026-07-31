import { NavLink } from 'react-router-dom';
import { Dumbbell, Home, Settings, Trophy, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { cx, haptic } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';

const BASE_TABS = [
  { to: '/', label: 'Inicio', Icon: Home, end: true },
  { to: '/nutricion', label: 'Nutricion', Icon: UtensilsCrossed },
  { to: '/entrenamiento', label: 'Entreno', Icon: Dumbbell },
];

export function TabBar() {
  const competitionMode = useSettingsStore((s) => s.competitionMode);

  /*
   * Con el modo competencia activo, la cuarta pestana pasa a ser el hub de prep:
   * es donde se vive el dia a dia de una preparacion. Progreso sigue accesible
   * desde ahi y desde el dashboard, y Ajustes nunca desaparece.
   */
  const tabs = [
    ...BASE_TABS,
    competitionMode
      ? { to: '/competencia', label: 'Prep', Icon: Trophy }
      : { to: '/cuerpo', label: 'Progreso', Icon: TrendingUp },
    { to: '/ajustes', label: 'Ajustes', Icon: Settings },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => haptic(5)}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 transition-colors',
                isActive ? 'text-brand' : 'text-faint',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="text-[10px] font-medium tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
