import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Download, LifeBuoy, RotateCcw } from 'lucide-react';
import { collectDiagnostics, logError, recordScreenFailure } from '@/services/errorLog';
import { APP_VERSION } from '@/services/backup';
import { download } from '@/lib/utils';
import { t } from '@/i18n';

interface Props {
  children: ReactNode;
  /** Ruta que envuelve, para contar fallos y activar el modo seguro. */
  route?: string;
  /** Etiqueta para el registro. */
  label?: string;
}

interface State {
  error: Error | null;
  failures: number;
}

/**
 * Limite de error global.
 *
 * Regla que manda sobre todo lo demas: aqui NUNCA se borran datos. Una
 * pantalla que revienta no es motivo para tirar meses de registros. Lo unico
 * que se ofrece es reintentar, reiniciar la interfaz (que es recargar la
 * pagina, no vaciar nada) y descargar el diagnostico.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, failures: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const route = this.props.route ?? location.pathname;
    logError(this.props.label ?? 'pantalla', error, route);
    if (info.componentStack) {
      console.error('[pantalla] pila de componentes', info.componentStack);
    }
    this.setState({ failures: recordScreenFailure(route) });
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  private restartUI = (): void => {
    // Recargar la pagina reconstruye toda la interfaz sin tocar el
    // almacenamiento. Es lo mas parecido a "apagar y encender" que existe sin
    // arriesgar los datos del usuario.
    window.location.reload();
  };

  private downloadDiagnostics = async (): Promise<void> => {
    const diag = await collectDiagnostics(APP_VERSION);
    download(
      `bodyfit-diagnostico-${diag.generatedAt.slice(0, 10)}.json`,
      JSON.stringify(diag, null, 2),
    );
  };

  render(): ReactNode {
    const { error, failures } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-base px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber/15 text-amber">
            <AlertTriangle size={22} />
          </div>

          <h1 className="text-[20px] leading-tight font-bold">{t('err.screenTitle')}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {t('err.screenBody')}
          </p>

          <div className="mt-4 rounded-2xl border border-brand/25 bg-brand/10 p-3">
            <p className="text-[13px] font-medium text-brand">{t('err.dataSafe')}</p>
            <p className="mt-1 text-[12px] text-muted">
              {t('err.dataSafeBody')}
            </p>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-[12px] text-faint">{t('err.technical')}</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-surface2 p-2.5 text-[11px] leading-relaxed break-words whitespace-pre-wrap text-muted">
              {error.message}
              {error.stack ? `\n\n${error.stack.split('\n').slice(0, 6).join('\n')}` : ''}
            </pre>
          </details>

          <div className="mt-5 space-y-2">
            {failures < 2 && (
              <button
                onClick={this.retry}
                className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-[15px] font-semibold text-base"
              >
                <RotateCcw size={16} />
                {t('err.retry')}
              </button>
            )}
            <button
              onClick={this.restartUI}
              className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface2 text-[15px]"
            >
              <LifeBuoy size={16} />
              {t('err.restartUI')}
            </button>
            <button
              onClick={() => void this.downloadDiagnostics()}
              className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line text-[15px] text-muted"
            >
              <Download size={16} />
              {t('err.downloadDiagnostics')}
            </button>
            <a
              href="/ajustes/datos"
              className="pressable flex h-12 w-full items-center justify-center rounded-2xl text-[14px] text-faint"
            >
              {t('err.goToData')}
            </a>
          </div>

          {failures >= 2 && (
            <p className="mt-4 text-[12px] text-faint">
              {t('err.safeModeNote', { n: failures })}
            </p>
          )}
        </div>
      </main>
    );
  }
}
