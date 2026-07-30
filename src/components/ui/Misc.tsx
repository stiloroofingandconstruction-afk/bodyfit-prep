import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export function Stat({
  label,
  value,
  unit,
  tone = 'text-ink',
  sub,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] tracking-wide text-faint uppercase">{label}</p>
      <p className={cx('mt-0.5 text-[19px] leading-tight font-semibold tabular', tone)}>
        {value}
        {unit && <span className="ml-0.5 text-[12px] font-normal text-faint">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-faint">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-surface2 text-faint">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-medium">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  tone,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'pressable rounded-full border px-3 py-1.5 text-[13px] whitespace-nowrap',
        active ? 'border-brand/50 bg-brand/15 text-brand' : 'border-line bg-surface2 text-muted',
        tone,
      )}
    >
      {children}
    </button>
  );
}

const TOAST_TONE = {
  ok: 'bg-brand text-base',
  info: 'bg-surface2 text-ink border border-line',
  warn: 'bg-amber text-base',
  error: 'bg-rose text-base',
} as const;

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'rise-enter max-w-sm rounded-2xl px-4 py-2.5 text-[14px] font-medium shadow-xl shadow-black/40',
            TOAST_TONE[t.tone],
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
