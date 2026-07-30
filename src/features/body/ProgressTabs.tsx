import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/utils';

const TABS = [
  { to: '/cuerpo', label: 'Cuerpo' },
  { to: '/checkin', label: 'Check-in' },
  { to: '/historial', label: 'Historial' },
];

/** Navegacion secundaria del area de progreso. */
export function ProgressTabs() {
  return (
    <div className="mx-auto mb-4 flex max-w-lg gap-1 rounded-2xl border border-line bg-surface2 p-1">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            cx(
              'pressable flex-1 rounded-xl py-2 text-center text-[13px] font-medium transition-colors',
              isActive ? 'bg-brand text-base' : 'text-muted',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
