import { useMemo, useState } from 'react';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { REMINDER_LABEL, type ReminderKind } from '@/domain/prepTypes';
import { reminderLabel } from '@/i18n/labels';
import { cx } from '@/lib/utils';
import { alive } from '@/store/persist';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import { usePendingReminders } from './useReminders';
import { weekdayInitials } from '@/lib/date';
import { t } from '@/i18n';

const KINDS = Object.keys(REMINDER_LABEL) as ReminderKind[];
/* Domingo primero: el indice coincide con Date.getDay(). */
function dayNames(): string[] {
  const mondayFirst = weekdayInitials();
  return [mondayFirst[6], ...mondayFirst.slice(0, 6)];
}

export default function RemindersPage() {
  const reminders = useSettingsStore((s) => s.reminders);
  const addReminder = useSettingsStore((s) => s.addReminder);
  const updateReminder = useSettingsStore((s) => s.updateReminder);
  const removeReminder = useSettingsStore((s) => s.removeReminder);
  const pending = usePendingReminders();

  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<ReminderKind>('peso');
  const [time, setTime] = useState('07:00');
  const [days, setDays] = useState<number[]>([]);

  const list = useMemo(
    () => alive(reminders).sort((a, b) => a.time.localeCompare(b.time)),
    [reminders],
  );

  return (
    <>
      <PageHeader title={t('screen.reminders')} subtitle={t('rem.subtitle')} back />

      <Page>
        <Card className="border-line/70">
          <p className="text-[13px] text-muted">
            {t('rem.note')}
          </p>
        </Card>

        {pending.length > 0 && (
          <div className="mt-4">
            <SectionTitle>{t('rem.pendingNow')}</SectionTitle>
            <div className="space-y-1.5">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-3.5 py-3"
                >
                  <Bell size={17} className="shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-brand">
                      {r.label ?? reminderLabel(r.kind)}
                    </p>
                    <p className="text-[12px] text-muted">{t('rem.scheduledFor', { time: r.time })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" block className="mt-4" onClick={() => setAdding(true)}>
          <Plus size={17} />
          {t('rem.new')}
        </Button>

        <div className="mt-5">
          <SectionTitle>{t('rem.yours')}</SectionTitle>
          {list.length === 0 ? (
            <EmptyState
              icon={<BellOff size={22} />}
              title={t('rem.empty')}
              description={t('rem.emptyDesc')}
            />
          ) : (
            <div className="space-y-1.5">
              {list.map((r) => (
                <div
                  key={r.id}
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border px-3.5 py-3',
                    r.enabled ? 'border-line bg-surface' : 'border-line bg-surface opacity-50',
                  )}
                >
                  <button
                    onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                    className={cx(
                      'pressable flex size-9 shrink-0 items-center justify-center rounded-xl',
                      r.enabled ? 'bg-brand text-base' : 'border border-line bg-surface2 text-faint',
                    )}
                    aria-label={r.enabled ? t('rem.disable') : t('rem.enable')}
                  >
                    {r.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{r.label ?? reminderLabel(r.kind)}</p>
                    <p className="text-[12px] tabular text-faint">
                      {r.time} ·{' '}
                      {r.days.length === 0
                        ? t('rem.everyDay')
                        : r.days.map((d) => dayNames()[d]).join(' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeReminder(r.id)}
                    className="pressable flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page>

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title={t('rem.new')}
        footer={
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              addReminder(kind, time, days);
              toast(t('rem.created'));
              setAdding(false);
              setDays([]);
            }}
          >
            {t('rem.create')}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>{t('rem.typeLabel')}</Label>
            <Select aria-label={t('rem.type')} value={kind} onChange={(e) => setKind(e.target.value as ReminderKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {reminderLabel(k)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t('rem.timeLabel')}</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <Label
              hint={days.length === 0 ? t('rem.everyDay') : t('rem.daysCount', { n: days.length })}
            >
              {t('rem.weekDays')}
            </Label>
            <div className="flex gap-1.5">
              {dayNames().map((d, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setDays((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i].sort()))
                  }
                  className={cx(
                    'pressable h-11 flex-1 rounded-xl text-[14px] font-medium',
                    days.includes(i)
                      ? 'bg-brand text-base'
                      : 'border border-line bg-surface2 text-muted',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
