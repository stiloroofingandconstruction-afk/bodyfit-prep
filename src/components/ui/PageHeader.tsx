import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: boolean;
}

/** Cabecera fija con desenfoque, como las barras de navegacion de iOS. */
export function PageHeader({ title, subtitle, action, back }: Props) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-base/80 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="pressable -ml-1 flex size-9 items-center justify-center rounded-full bg-surface2 text-muted"
            aria-label="Volver"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-lg px-4 py-4">{children}</div>;
}
