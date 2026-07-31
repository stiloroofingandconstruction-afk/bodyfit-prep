import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div className={cx('card', padded && 'p-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] leading-tight font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">{children}</h2>
      {action}
    </div>
  );
}

/**
 * Enlace de accion de una seccion ("Ver todo", "Registrar").
 *
 * El padding amplia el area tactil: un enlace de 18 px de alto es casi
 * imposible de acertar con el pulgar en un movil, aunque el texto se lea bien.
 */
export function ActionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="pressable -my-2 -mr-2 rounded-lg px-2 py-2 text-[12px] font-medium text-brand"
    >
      {children}
    </Link>
  );
}
