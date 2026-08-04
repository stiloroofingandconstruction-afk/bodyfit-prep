import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  Download,
  Smartphone,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import {
  clearErrors,
  clearSafeMode,
  collectDiagnostics,
  getErrors,
  safeModeRoutes,
  type Diagnostics,
} from '@/services/errorLog';
import { APP_VERSION } from '@/services/backup';
import { fmtBytes } from '@bodyfit/domain/backup';
import { download } from '@/lib/utils';
import { fmtDateTime } from '@/lib/date';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

export default function DiagnosticsPage() {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [errors, setErrors] = useState(() => getErrors());
  const [safe, setSafe] = useState(() => safeModeRoutes());

  const refresh = useCallback(() => {
    void collectDiagnostics(APP_VERSION).then(setDiag);
    setErrors(getErrors());
    setSafe(safeModeRoutes());
  }, []);

  useEffect(refresh, [refresh]);

  return (
    <>
      <PageHeader back title={t('diag.title')} subtitle={t('diag.subtitle')} />

      <Page>
        {/* ────────────────────────────────────────── prueba en iPhone ── */}
        <SectionTitle>{t('diag.manualCheck')}</SectionTitle>
        <Link
          to="/ajustes/diagnostico/iphone"
          className="pressable flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
            <Smartphone size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">{t('diag.iphoneTest')}</p>
            <p className="truncate text-[12px] text-faint">
              {t('diag.iphoneTestDesc')}
            </p>
          </div>
          <ChevronRight size={17} className="shrink-0 text-faint" />
        </Link>

        {/* ──────────────────────────────────────────────── entorno ── */}
        <div className="mt-5">
          <SectionTitle>{t('diag.environment')}</SectionTitle>
          <Card>
            <dl className="space-y-2 text-[13px]">
              <Row label={t('diag.version')} value={APP_VERSION} />
              <Row
                label={t('diag.installed')}
                value={diag ? (diag.standalone ? t('common.yes') : t('common.no')) : '—'}
              />
              <Row
                label={t('diag.serviceWorker')}
                value={
                  diag
                    ? diag.serviceWorker.controlled
                      ? t('diag.swActive')
                      : diag.serviceWorker.supported
                        ? t('diag.swSupported')
                        : t('diag.swUnsupported')
                    : '—'
                }
              />
              <Row
                label={t('diag.protectedStorage')}
                value={diag ? (diag.storage.persistent ? t('common.yes') : t('common.no')) : '—'}
              />
              <Row
                label={t('diag.usedSpace')}
                value={
                  diag?.storage.usage != null
                    ? `${fmtBytes(diag.storage.usage)}${diag.storage.quota ? ` / ${fmtBytes(diag.storage.quota)}` : ''}`
                    : t('diag.notAvailable')
                }
              />
              <Row
                label={t('diag.photosInDb')}
                value={
                  diag?.indexedDB.error
                    ? t('diag.accessError')
                    : diag?.indexedDB.photos != null
                      ? String(diag.indexedDB.photos)
                      : '—'
                }
              />
              <Row
                label={t('diag.screen')}
                value={diag ? `${diag.viewport.width}×${diag.viewport.height} @${diag.viewport.dpr}x` : '—'}
              />
              <Row label={t('diag.connection')} value={diag ? (diag.online ? t('diag.online') : t('diag.offline')) : '—'} />
            </dl>

            {diag?.indexedDB.error && (
              <div className="mt-3 rounded-2xl border border-rose/30 bg-rose/10 p-3 text-[12px] text-rose">
                {t('diag.dbError', { error: diag.indexedDB.error })}
              </div>
            )}

            <Button
              className="mt-3"
              block
              variant="secondary"
              onClick={async () => {
                const d = await collectDiagnostics(APP_VERSION);
                download(
                  `bodyfit-diagnostico-${d.generatedAt.slice(0, 10)}.json`,
                  JSON.stringify(d, null, 2),
                );
                toast(t('diag.downloaded'));
              }}
            >
              <Download size={16} />
              {t('err.downloadDiagnostics')}
            </Button>
            <p className="mt-2 text-[11px] text-faint">
              {t('diag.privacyNote')}
            </p>
          </Card>
        </div>

        {/* ───────────────────────────────────────────── modo seguro ── */}
        {safe.length > 0 && (
          <div className="mt-5">
            <SectionTitle>{t('diag.safeModeScreens')}</SectionTitle>
            <Card>
              <p className="text-[13px] text-muted">
                {t('diag.safeModeIntro')}
              </p>
              <ul className="mt-3 space-y-1.5">
                {safe.map((route) => (
                  <li
                    key={route}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface2 px-3 py-2 text-[13px]"
                  >
                    <span className="truncate">{route}</span>
                    <button
                      onClick={() => {
                        clearSafeMode(route);
                        setSafe(safeModeRoutes());
                        toast(t('diag.willRetry'));
                      }}
                      className="pressable shrink-0 text-[12px] text-brand"
                    >
                      {t('diag.reactivate')}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* ─────────────────────────────────────────── registro de errores ── */}
        <div className="mt-5">
          <SectionTitle>
            {t('diag.errorLog')} {errors.length > 0 && `(${errors.length})`}
          </SectionTitle>
          <Card padded={errors.length === 0}>
            {errors.length === 0 ? (
              <EmptyState
                icon={<Activity size={22} />}
                title={t('diag.noErrors')}
                description={t('diag.noErrorsDesc')}
              />
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {errors.slice(0, 20).map((e, i) => (
                    <li key={`${e.at}-${i}`} className="px-3.5 py-3">
                      <div className="flex items-start gap-2">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-snug break-words">{e.message}</p>
                          <p className="mt-1 text-[11px] text-faint">
                            {fmtDateTime(e.at)} · {e.source}
                            {e.route ? ` · ${e.route}` : ''}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line p-3">
                  <Button
                    block
                    variant="secondary"
                    onClick={() => {
                      clearErrors();
                      setErrors([]);
                      toast(t('diag.logCleared'));
                    }}
                  >
                    <Trash2 size={16} />
                    {t('diag.clearLog')}
                  </Button>
                  <p className="mt-2 text-[11px] text-faint">
                    {t('diag.clearLogNote')}
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </Page>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="tabular truncate text-right">{value}</dd>
    </div>
  );
}
