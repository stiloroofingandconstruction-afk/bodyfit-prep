import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, X } from 'lucide-react';
import { backupDue, daysSince } from '@bodyfit/domain/backup';
import { countStoredEntries, createBackup } from '@/services/backup';
import { logError } from '@/services/errorLog';
import { download } from '@/lib/utils';
import { useBackupStore } from '@/store/backupStore';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

const DAY_MS = 86_400_000;

/**
 * Aviso interno de copia de seguridad.
 *
 * No usa notificaciones del sistema: iOS no las da a una PWA salvo con permiso
 * explicito, y aqui no hace falta. Es una tira dentro de la app, y solo aparece
 * cuando ya hay datos que valga la pena no perder.
 */
export function BackupReminder() {
  const { pathname } = useLocation();
  const backup = useBackupStore();
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const count = await countStoredEntries().catch(() => 0);
      if (cancelled) return;
      setEntries(count);

      const due = backupDue({
        lastBackupAt: backup.lastBackupAt,
        everyDays: backup.remindEveryDays,
        entries: count,
      });
      if (!due) return;

      // Aplazado hace menos de un dia: no insistir
      const snoozed = backup.remindSnoozedAt
        ? Date.now() - new Date(backup.remindSnoozedAt).getTime() < DAY_MS
        : false;

      if (backup.autoDownload && !snoozed) {
        try {
          const result = await createBackup();
          download(result.filename, result.json);
          useBackupStore.getState().markBackedUp();
          toast(t('data.backup.created', { collections: result.collections, photos: result.photos }));
          return;
        } catch (err) {
          logError('respaldo automatico', err);
        }
      }

      if (backup.remindEnabled && !snoozed) setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
    // Se evalua una sola vez por arranque: el aviso no debe reaparecer al navegar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La propia pantalla de respaldo ya dice todo esto
  if (!visible || pathname.startsWith('/ajustes/datos')) return null;

  const days = daysSince(backup.lastBackupAt);

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div className="rise-enter mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-amber/30 bg-surface p-3 shadow-xl shadow-black/30">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber">
          <Database size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">{t('data.backup.due')}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {days != null
              ? t('data.backup.dueBody', { n: days })
              : `${entries} registros guardados solo en este dispositivo.`}
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              to="/ajustes/datos"
              onClick={() => setVisible(false)}
              className="pressable rounded-xl bg-brand px-3 py-1.5 text-[13px] font-medium text-base"
            >
              {t('data.backup.create')}
            </Link>
            <button
              onClick={() => {
                backup.snooze();
                setVisible(false);
              }}
              className="pressable rounded-xl bg-surface2 px-3 py-1.5 text-[13px] text-muted"
            >
              {t('data.backup.snooze')}
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            backup.snooze();
            setVisible(false);
          }}
          aria-label={t('common.close')}
          className="pressable -mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-faint"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
