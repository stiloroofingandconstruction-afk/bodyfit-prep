import { NavLink } from 'react-router-dom';
import { Dumbbell, Home, Settings, Trophy, TrendingUp, UtensilsCrossed } from 'lucide-react';
import { cx, haptic } from '@/lib/utils';
import { t } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export function TabBar() {
  const competitionMode = useSettingsStore((s) => s.competitionMode);
  // Leer el idioma suscribe el componente: al cambiarlo, las etiquetas se
  // actualizan al instante sin recargar.
  useSettingsStore((s) => s.locale);

  const BASE_TABS = [
    { to: '/', label: t('nav.home'), Icon: Home, end: true },
    { to: '/nutricion', label: t('nav.nutrition'), Icon: UtensilsCrossed },
    { to: '/entrenamiento', label: t('nav.training'), Icon: Dumbbell },
  ];

  /*
   * Con el modo competencia activo, la cuarta pestana pasa a ser el hub de prep:
   * es donde se vive el dia a dia de una preparacion. Progreso sigue accesible
   * desde ahi y desde el dashboard, y Ajustes nunca desaparece.
   */
  const tabs = [
    ...BASE_TABS,
    competitionMode
      ? { to: '/competencia', label: t('nav.prep'), Icon: Trophy }
      : { to: '/cuerpo', label: t('nav.progress'), Icon: TrendingUp },
    { to: '/ajustes', label: t('nav.settings'), Icon: Settings },
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
