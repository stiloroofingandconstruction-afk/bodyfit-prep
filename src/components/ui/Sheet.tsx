import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { t } from '@/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** `full` ocupa casi toda la pantalla (buscadores); `auto` se ajusta al contenido. */
  height?: 'auto' | 'full';
  footer?: ReactNode;
}

/**
 * Hoja inferior estilo iOS. Se monta en un portal para que ningun contenedor
 * con `overflow` la recorte.
 */
export function Sheet({ open, onClose, title, children, height = 'auto', footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label={t('common.close')}
        className="fade-enter absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'sheet-enter relative flex flex-col overflow-hidden rounded-t-3xl border-t border-line bg-surface',
          height === 'full' ? 'h-[92dvh]' : 'max-h-[88dvh]',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 pt-3 pb-3">
          <div className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-line2" />
          <h2 className="pt-1 text-[15px] font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="pressable -mr-1 flex size-8 items-center justify-center rounded-full bg-surface2 text-muted"
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-momentum flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>

        {footer && (
          <div className="safe-bottom border-t border-line bg-surface px-4 pt-3 pb-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
