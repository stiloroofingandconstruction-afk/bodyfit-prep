import { useMemo, useState } from 'react';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { REMINDER_LABEL, type ReminderKind } from '@/domain/prepTypes';
import { cx } from '@/lib/utils';
import { alive } from '@/store/persist';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import { usePendingReminders } from './useReminders';

const KINDS = Object.keys(REMINDER_LABEL) as ReminderKind[];
const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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
      <PageHeader title="Recordatorios" subtitle="Avisos dentro de la app" back />

      <Page>
        <Card className="border-line/70">
          <p className="text-[13px] text-muted">
            Los recordatorios aparecen dentro de la app cuando llega su hora. Las notificaciones push
            del sistema todavia no estan disponibles: iOS solo las permite en apps instaladas en la
            pantalla de inicio y con permiso explicito. La arquitectura ya esta preparada para
            activarlas cuando decidas darles permiso.
          </p>
        </Card>

        {pending.length > 0 && (
          <div className="mt-4">
            <SectionTitle>Pendientes ahora</SectionTitle>
            <div className="space-y-1.5">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-3.5 py-3"
                >
                  <Bell size={17} className="shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-brand">
                      {r.label ?? REMINDER_LABEL[r.kind]}
                    </p>
                    <p className="text-[12px] text-muted">Programado para las {r.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" block className="mt-4" onClick={() => setAdding(true)}>
          <Plus size={17} />
          Nuevo recordatorio
        </Button>

        <div className="mt-5">
          <SectionTitle>Tus recordatorios</SectionTitle>
          {list.length === 0 ? (
            <EmptyState
              icon={<BellOff size={22} />}
              title="Sin recordatorios"
              description="Empieza por el peso en ayunas: es el dato que mas se olvida y el que sostiene todo lo demas."
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
                    aria-label={r.enabled ? 'Desactivar' : 'Activar'}
                  >
                    {r.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{r.label ?? REMINDER_LABEL[r.kind]}</p>
                    <p className="text-[12px] tabular text-faint">
                      {r.time} ·{' '}
                      {r.days.length === 0
                        ? 'todos los dias'
                        : r.days.map((d) => DAY_NAMES[d]).join(' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeReminder(r.id)}
                    className="pressable flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
                    aria-label="Eliminar"
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
        title="Nuevo recordatorio"
        footer={
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              addReminder(kind, time, days);
              toast('Recordatorio creado');
              setAdding(false);
              setDays([]);
            }}
          >
            Crear recordatorio
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value as ReminderKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {REMINDER_LABEL[k]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <Label hint={days.length === 0 ? 'todos los dias' : `${days.length} dias`}>
              Dias de la semana
            </Label>
            <div className="flex gap-1.5">
              {DAY_NAMES.map((d, i) => (
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
