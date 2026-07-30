import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx, haptic } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-base font-semibold active:bg-brand-dim',
  secondary: 'bg-surface2 text-ink border border-line',
  ghost: 'text-muted active:bg-surface2',
  danger: 'bg-rose/15 text-rose border border-rose/30',
  outline: 'border border-line text-ink',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-[15px] rounded-2xl',
  lg: 'h-14 px-5 text-base rounded-2xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  block,
  className,
  children,
  onClick,
  ...rest
}: Props) {
  return (
    <button
      className={cx(
        'pressable inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      onClick={(e) => {
        haptic();
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
