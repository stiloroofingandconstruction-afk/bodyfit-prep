import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[13px] font-medium text-muted">{children}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </div>
  );
}

const CONTROL =
  'w-full h-12 rounded-2xl bg-surface2 border border-line px-3.5 text-[15px] outline-none ' +
  'focus:border-brand/60 transition-colors placeholder:text-faint';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

export function Input({ className, suffix, ...rest }: InputProps) {
  if (!suffix) return <input className={cx(CONTROL, className)} {...rest} />;
  return (
    <div className="relative">
      <input className={cx(CONTROL, 'pr-12', className)} {...rest} />
      <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-faint">
        {suffix}
      </span>
    </div>
  );
}

interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Valor en la unidad que ve el usuario. `null` significa vacio. */
  value: number | null;
  /** Se llama con `null` cuando el campo queda vacio. */
  onChange: (value: number | null) => void;
  decimals?: number;
  suffix?: string;
}

/**
 * Campo numerico que se deja escribir y, sobre todo, se deja borrar.
 *
 * Un `<input>` cuyo `value` sale de formatear el numero guardado es imposible
 * de vaciar: escribes "80", se guarda 80 y vuelve pintado como "80.0"; pulsas
 * borrar, queda "80." que sigue valiendo 80, y el campo se repinta "80.0" otra
 * vez. El texto nunca llega a estar vacio.
 *
 * La solucion es separar lo que el usuario esta escribiendo de lo que hay
 * guardado: mientras el campo tiene el foco manda el texto tal cual, y solo al
 * salir se vuelve a formatear a partir del valor real.
 */
export function NumberField({
  value,
  onChange,
  decimals = 1,
  suffix,
  className,
  onBlur,
  ...rest
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const formatted = value == null ? '' : value.toFixed(decimals);
  const shown = draft ?? formatted;

  return (
    <Input
      {...rest}
      className={className}
      suffix={suffix}
      inputMode="decimal"
      value={shown}
      onChange={(e) => {
        // La coma es lo natural en espanol; dentro se trabaja siempre con punto
        const raw = e.target.value.replace(',', '.');
        // Digitos y un unico punto decimal: nada mas
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;

        setDraft(raw);
        if (raw.trim() === '') {
          onChange(null);
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={(e) => {
        // Fuera del campo vuelve a mandar el valor guardado, ya formateado
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(CONTROL, 'appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex gap-1 rounded-2xl border border-line bg-surface2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'pressable flex-1 rounded-xl px-2 py-2 text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-brand text-base' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  decimals = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
}) {
  const clampTo = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(clampTo(value - step))}
        className="pressable flex size-11 items-center justify-center rounded-2xl border border-line bg-surface2 text-xl"
      >
        −
      </button>
      <div className="flex-1 rounded-2xl border border-line bg-surface2 py-2.5 text-center text-[17px] font-semibold tabular">
        {value.toFixed(decimals)}
        {suffix && <span className="ml-1 text-[13px] font-normal text-faint">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(clampTo(value + step))}
        className="pressable flex size-11 items-center justify-center rounded-2xl border border-line bg-surface2 text-xl"
      >
        +
      </button>
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  labels,
  'aria-label': ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  labels?: string[];
  /**
   * Nombre accesible. La etiqueta visual es un hermano, no un <label for>,
   * asi que sin esto el control no tiene nombre para un lector de pantalla.
   */
  'aria-label'?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        /*
         * El elemento mide 28 px de alto para que el pulgar lo acierte, pero la
         * barra visible sigue siendo de 8 px: `background-clip: content-box`
         * pinta el degradado solo en la caja de contenido, y el padding vertical
         * queda transparente formando el area tactil.
         */
        className="h-7 w-full cursor-pointer appearance-none rounded-full bg-clip-content py-2.5 outline-none [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-lg"
        style={{
          background: `linear-gradient(to right, var(--color-brand) ${pct}%, var(--color-line) ${pct}%)`,
          backgroundClip: 'content-box',
        }}
      />
      {labels && (
        <div className="mt-1 flex justify-between text-[11px] text-faint">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
