import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/utils';
import { t, type Dict } from '@/i18n';

const TABS: { to: string; key: keyof Dict }[] = [
  { to: '/cuerpo', key: 'tabs.body' },
  { to: '/checkin', key: 'tabs.checkin' },
  { to: '/fotos', key: 'tabs.photos' },
  { to: '/historial', key: 'tabs.history' },
];

/** Navegacion secundaria del area de progreso. */
export function ProgressTabs() {
  return (
    <div className="mx-auto mb-4 flex max-w-lg gap-1 rounded-2xl border border-line bg-surface2 p-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cx(
              'pressable flex-1 rounded-xl py-2 text-center text-[13px] font-medium transition-colors',
              isActive ? 'bg-brand text-base' : 'text-muted',
            )
          }
        >
          {t(tab.key)}
        </NavLink>
      ))}
    </div>
  );
}
