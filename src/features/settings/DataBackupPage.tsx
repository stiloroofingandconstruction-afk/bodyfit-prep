import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  FileCheck2,
  HardDrive,
  Lock,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Slider } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Misc';
import {
  createBackup,
  parseBackup,
  restoreBackup,
  requestPersistence,
  storageStatus,
  type BackupReport,
  type StorageStatus,
} from '@/services/backup';
import { clearAll } from '@/services/storage';
import { daysSince, fmtBytes } from '@/domain/backup';
import { download } from '@/lib/utils';
import { fmtDateTime } from '@/lib/date';
import { useBackupStore } from '@/store/backupStore';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

/** Nombres legibles de las colecciones dentro de una copia. */
const COLLECTION_LABEL: Record<string, string> = {
  profile: 'Perfil',
  settings: 'Ajustes',
  nutrition: 'Nutricion',
  training: 'Entrenamiento',
  body: 'Cuerpo',
  checkin: 'Check-ins',
  photos: 'Fotos',
  prep: 'Competencia',
  activity: 'Cardio y pasos',
  backup: 'Copias',
};

export default function DataBackupPage() {
  const backup = useBackupStore();
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [report, setReport] = useState<BackupReport | null>(null);
  const [reportName, setReportName] = useState('');
  const [deleteStep, setDeleteStep] = useState(false);
  const [deleteWord, setDeleteWord] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    void storageStatus().then(setStatus);
  }, []);

  useEffect(refresh, [refresh]);

  const days = daysSince(backup.lastBackupAt);

  /* ── crear copia ── */
  const doBackup = async () => {
    setBusy('backup');
    try {
      const result = await createBackup();
      download(result.filename, result.json);
      backup.markBackedUp();
      toast(
        t('data.backup.created', { collections: result.collections, photos: result.photos }),
      );
      if (result.photosFailed > 0) {
        toast(t('data.backup.photosFailed', { n: result.photosFailed }), 'warn');
      }
      refresh();
    } catch (err) {
      console.error('[respaldo] no se pudo crear la copia', err);
      toast('No se pudo crear la copia', 'error');
    } finally {
      setBusy(null);
    }
  };

  /* ── verificar archivo ── */
  const doVerify = async (file: File) => {
    setReportName(file.name);
    try {
      setReport(parseBackup(await file.text()));
    } catch {
      toast('No se pudo leer el archivo', 'error');
    }
  };

  /* ── restaurar ── */
  const doRestore = async () => {
    if (!report?.ok) return;
    setBusy('restore');
    try {
      const result = await restoreBackup(report);
      useBackupStore.getState().markRestored();
      if (result.photosFailed > 0) {
        toast(`${result.photosFailed} fotos no se pudieron restaurar`, 'warn');
      }
      toast(t('data.restore.done'));
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      console.error('[respaldo] fallo la restauracion', err);
      toast('No se pudo restaurar la copia', 'error');
      setBusy(null);
    }
  };

  /* ── borrado ── */
  const doDelete = async () => {
    await clearAll();
    toast(t('data.delete.done'));
    setTimeout(() => window.location.reload(), 600);
  };

  const nearFull = status != null && status.supported && status.usedPct >= 80;

  return (
    <>
      <PageHeader back title={t('data.title')} subtitle={t('data.subtitle')} />

      <Page>
        {/* ═══════════════════════════════════════════════ almacenamiento ══ */}
        <SectionTitle>{t('data.storage.title')}</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                status?.persistent ? 'bg-brand/15 text-brand' : 'bg-surface2 text-faint'
              }`}
            >
              {status?.persistent ? <Lock size={18} /> : <HardDrive size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{t('data.storage.persistent')}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {status?.persistent
                  ? t('data.storage.persistentOn')
                  : t('data.storage.persistentOff')}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                status?.persistent ? 'bg-brand/15 text-brand' : 'bg-amber/15 text-amber'
              }`}
            >
              {status?.persistent ? 'Si' : 'No'}
            </span>
          </div>

          {status && !status.persistent && status.canRequest && (
            <Button
              className="mt-3"
              block
              variant="secondary"
              onClick={async () => {
                const granted = await requestPersistence();
                refresh();
                toast(
                  granted ? t('data.storage.requestGranted') : t('data.storage.requestDenied'),
                  granted ? 'ok' : 'warn',
                );
              }}
            >
              <ShieldAlert size={16} />
              {t('data.storage.request')}
            </Button>
          )}

          <div className="mt-4 border-t border-line pt-3">
            {status?.supported ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label={t('data.storage.used')} value={fmtBytes(status.usage)} />
                  <Stat
                    label={t('data.storage.free')}
                    value={fmtBytes(Math.max(0, status.quota - status.usage))}
                  />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
                  <div
                    className={`h-full rounded-full ${nearFull ? 'bg-amber' : 'bg-brand'}`}
                    style={{ width: `${Math.max(1, status.usedPct)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-faint">
                  {t('data.storage.usedOf', {
                    used: fmtBytes(status.usage),
                    quota: fmtBytes(status.quota),
                  })}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-faint">{t('data.storage.unsupported')}</p>
            )}
          </div>

          {nearFull && (
            <Notice tone="amber" icon={<AlertTriangle size={14} />}>
              {t('data.storage.evictionWarning')}
            </Notice>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-faint">{t('data.storage.iosNote')}</p>
        </Card>

        {/* ══════════════════════════════════════════════════════ copia ══ */}
        <div className="mt-5">
          <SectionTitle>{t('data.backup.title')}</SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
                <Database size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">
                  {backup.lastBackupAt ? t('data.backup.last') : t('data.backup.never')}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {backup.lastBackupAt
                    ? `${fmtDateTime(backup.lastBackupAt)} · ${relativeDays(days)}`
                    : t('data.backup.includes')}
                </p>
              </div>
            </div>

            {days != null && days >= backup.remindEveryDays && (
              <Notice tone="amber" icon={<AlertTriangle size={14} />}>
                {t('data.backup.dueBody', { n: days })}
              </Notice>
            )}

            <Button
              className="mt-3"
              block
              variant="primary"
              disabled={busy != null}
              onClick={doBackup}
            >
              <Download size={16} />
              {busy === 'backup' ? t('data.backup.creating') : t('data.backup.create')}
            </Button>

            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <Toggle
                label={t('data.backup.remind')}
                on={backup.remindEnabled}
                onToggle={() => backup.update({ remindEnabled: !backup.remindEnabled })}
              />
              {backup.remindEnabled && (
                <div>
                  <Label hint={t('data.backup.every', { n: backup.remindEveryDays })}>
                    {t('data.backup.every', { n: backup.remindEveryDays })}
                  </Label>
                  <Slider
                    aria-label={t('data.backup.remind')}
                    value={backup.remindEveryDays}
                    onChange={(v) => backup.update({ remindEveryDays: v })}
                    min={1}
                    max={30}
                    step={1}
                    labels={['1', '15', '30']}
                  />
                </div>
              )}
              <div>
                <Toggle
                  label={t('data.backup.autoDownload')}
                  on={backup.autoDownload}
                  onToggle={() => backup.update({ autoDownload: !backup.autoDownload })}
                />
                <p className="mt-1.5 text-[11px] text-faint">{t('data.backup.autoDownloadHint')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════ restaurar ══ */}
        <div className="mt-5">
          <SectionTitle>{t('data.restore.title')}</SectionTitle>
          <Card>
            <p className="mb-3 text-[13px] text-muted">{t('data.restore.hint')}</p>

            <Button block variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} />
              {t('data.restore.pick')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label={t('data.restore.pick')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void doVerify(file);
                e.target.value = '';
              }}
            />

            {report && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full ${
                      report.ok ? 'bg-brand/15 text-brand' : 'bg-rose/15 text-rose'
                    }`}
                  >
                    {report.ok ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <p className="text-[15px] font-medium">
                    {report.ok ? t('data.restore.valid') : t('data.restore.invalid')}
                  </p>
                </div>
                <p className="mt-1 truncate text-[12px] text-faint">{reportName}</p>

                {report.exportedAt && (
                  <p className="mt-2 text-[12px] text-muted">
                    {t('data.restore.exportedAt', { date: fmtDateTime(report.exportedAt) })} ·{' '}
                    {t('data.restore.formatVersion', { n: report.format ?? '?' })}
                  </p>
                )}

                <p className="mt-1 flex items-center gap-1.5 text-[12px]">
                  <FileCheck2
                    size={13}
                    className={
                      report.checksumOk === true
                        ? 'text-brand'
                        : report.checksumOk === false
                          ? 'text-rose'
                          : 'text-faint'
                    }
                  />
                  <span
                    className={
                      report.checksumOk === true
                        ? 'text-brand'
                        : report.checksumOk === false
                          ? 'text-rose'
                          : 'text-faint'
                    }
                  >
                    {report.checksumOk === true
                      ? t('data.restore.checksumOk')
                      : report.checksumOk === false
                        ? t('data.restore.checksumBad')
                        : t('data.restore.checksumMissing')}
                  </span>
                </p>

                {report.errors.map((e) => (
                  <Notice key={e} tone="rose" icon={<X size={14} />}>
                    {e}
                  </Notice>
                ))}
                {report.warnings.map((w) => (
                  <Notice key={w} tone="amber" icon={<AlertTriangle size={14} />}>
                    {w}
                  </Notice>
                ))}

                {report.ok && (
                  <>
                    <p className="mt-3 mb-1.5 text-[11px] tracking-wide text-faint uppercase">
                      {t('data.restore.contents')}
                    </p>
                    <ul className="space-y-1 text-[13px]">
                      {report.collections.map((c) => (
                        <li key={c.key} className="flex justify-between gap-3">
                          <span className="truncate text-muted">
                            {COLLECTION_LABEL[c.key] ?? c.key}
                          </span>
                          <span className="tabular shrink-0 text-faint">{c.entries}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3">
                        <span className="truncate text-muted">{t('tabs.photos')}</span>
                        <span className="tabular shrink-0 text-faint">
                          {t('data.restore.photosCount', {
                            n: report.photos,
                            size: fmtBytes(report.photoBytes),
                          })}
                        </span>
                      </li>
                    </ul>

                    <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/10 p-3">
                      <p className="text-[12px] text-amber">{t('data.restore.confirmBody')}</p>
                      <Button
                        className="mt-2.5"
                        block
                        variant="primary"
                        disabled={busy != null}
                        onClick={doRestore}
                      >
                        {busy === 'restore'
                          ? t('data.restore.restoring')
                          : t('data.restore.confirm')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════ borrar ══ */}
        <div className="mt-5">
          <SectionTitle>{t('data.delete.title')}</SectionTitle>
          <Card className="border-rose/25">
            <p className="text-[13px] text-muted">{t('data.delete.body')}</p>

            {!backup.lastBackupAt && (
              <Notice tone="rose" icon={<AlertTriangle size={14} />}>
                {t('data.delete.noBackupWarning')}
              </Notice>
            )}

            {!deleteStep ? (
              <Button
                className="mt-3"
                block
                variant="danger"
                onClick={() => {
                  setDeleteStep(true);
                  setDeleteWord('');
                }}
              >
                <Trash2 size={16} />
                {t('data.delete.start')}
              </Button>
            ) : (
              <div className="mt-3 space-y-3">
                <Button block variant="secondary" onClick={doBackup} disabled={busy != null}>
                  <Download size={16} />
                  {t('data.delete.backupFirst')}
                </Button>

                <div>
                  <Label>{t('data.delete.typeToConfirm', { word: t('data.delete.word') })}</Label>
                  <Input
                    aria-label={t('data.delete.typeToConfirm', { word: t('data.delete.word') })}
                    value={deleteWord}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    onChange={(e) => setDeleteWord(e.target.value)}
                    placeholder={t('data.delete.word')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setDeleteStep(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={deleteWord.trim().toUpperCase() !== t('data.delete.word')}
                    onClick={doDelete}
                  >
                    {t('data.delete.confirm')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <p className="mt-5 px-1 text-center text-[11px] text-faint">{t('data.noUpload')}</p>
      </Page>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── auxiliares ── */

function relativeDays(days: number | null): string {
  if (days == null) return '';
  if (days <= 0) return t('data.backup.today');
  if (days === 1) return t('data.backup.yesterday');
  return t('data.backup.daysAgo', { n: days });
}

const NOTICE_TONE = {
  amber: 'border-amber/30 bg-amber/10 text-amber',
  rose: 'border-rose/30 bg-rose/10 text-rose',
} as const;

function Notice({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof NOTICE_TONE;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`mt-3 flex gap-2 rounded-2xl border p-3 text-[12px] ${NOTICE_TONE[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[14px]">{label}</p>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`pressable flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
          on ? 'bg-brand' : 'bg-line2'
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
