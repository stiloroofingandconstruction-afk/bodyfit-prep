import { useMemo, useState } from 'react';
import { Check, Footprints, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Segmented, Select, Stepper } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { BarChart } from '@/components/ui/Chart';
import { CARDIO_LABEL, type CardioType, type Intensity } from '@/domain/prepTypes';
import { dayInitial, friendlyDate, startOfWeek, today, weekRange } from '@/lib/date';
import { cx } from '@/lib/utils';
import { alive } from '@/store/persist';
import { useActivityStore } from '@/store/activityStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeekActivity } from '@/store/selectors';
import { toast } from '@/store/uiStore';

const TYPES = Object.keys(CARDIO_LABEL) as CardioType[];

export default function CardioPage() {
  const weekStart = startOfWeek(today());
  const week = useWeekActivity(weekStart);
  const addCardio = useActivityStore((s) => s.addCardio);
  const toggleDone = useActivityStore((s) => s.toggleCardioDone);
  const removeCardio = useActivityStore((s) => s.removeCardio);
  const saveCardioPlan = useActivityStore((s) => s.saveCardioPlan);
  const materializePlan = useActivityStore((s) => s.materializePlan);
  const plans = useActivityStore((s) => s.cardioPlans);
  const setSteps = useActivityStore((s) => s.setSteps);
  const stepEntries = useActivityStore((s) => s.steps);
  const { stepGoal, update } = useSettingsStore();

  const [adding, setAdding] = useState(false);
  const [planning, setPlanning] = useState(false);

  const plan = useMemo(
    () => alive(plans).find((p) => p.weekStart === weekStart),
    [plans, weekStart],
  );

  const days = useMemo(() => weekRange(weekStart), [weekStart]);

  const stepsByDay = useMemo(() => {
    const map = new Map(alive(stepEntries).map((s) => [s.date, s.steps]));
    return days.map((d) => ({
      label: dayInitial(d),
      value: map.get(d) ?? 0,
      highlight: d === today(),
    }));
  }, [stepEntries, days]);

  const sorted = useMemo(
    () => [...week.cardioSessions].sort((a, b) => a.date.localeCompare(b.date)),
    [week.cardioSessions],
  );

  return (
    <>
      <PageHeader title="Cardio y pasos" subtitle="Plan semanal y seguimiento" back />

      <Page>
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Completado" value={week.cardioMinutes} unit="min" tone="text-brand" />
            <Stat label="Planificado" value={week.cardioPlanned} unit="min" />
            <Stat label="Sesiones" value={`${sorted.filter((s) => s.completed).length}/${sorted.length}`} />
          </div>
          {week.cardioPlanned > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(100, (week.cardioMinutes / week.cardioPlanned) * 100)}%` }}
              />
            </div>
          )}
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" size="lg" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Registrar sesion
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setPlanning(true)}>
            Plan semanal
          </Button>
        </div>

        {/* ───────────────────────────────────────── sesiones */}
        <div className="mt-5">
          <SectionTitle
            action={plan ? <span className="text-[11px] text-faint">{plan.sessionsPerWeek}×/sem</span> : undefined}
          >
            Sesiones de esta semana
          </SectionTitle>
          {sorted.length === 0 ? (
            <EmptyState
              title="Sin sesiones esta semana"
              description="Crea un plan semanal o registra sesiones sueltas conforme las hagas."
            />
          ) : (
            <div className="space-y-1.5">
              {sorted.map((s) => (
                <div
                  key={s.id}
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border px-3.5 py-3',
                    s.completed ? 'border-brand/30 bg-brand/8' : 'border-line bg-surface',
                  )}
                >
                  <button
                    onClick={() => toggleDone(s.id)}
                    className={cx(
                      'pressable flex size-9 shrink-0 items-center justify-center rounded-xl',
                      s.completed ? 'bg-brand text-base' : 'border border-line bg-surface2 text-faint',
                    )}
                    aria-label="Marcar completado"
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{CARDIO_LABEL[s.type]}</p>
                    <p className="text-[12px] tabular text-faint">
                      {friendlyDate(s.date)} · {s.minutes} min · {s.intensity}
                      {s.planned && ' · planificada'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCardio(s.id)}
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

        {/* ───────────────────────────────────────── pasos */}
        <div className="mt-5">
          <SectionTitle
            action={
              <span className="text-[11px] text-faint">
                media {week.avgSteps.toLocaleString('es')}
              </span>
            }
          >
            Pasos
          </SectionTitle>
          <Card>
            <BarChart data={stepsByDay} height={130} />
            <div className="mt-3 border-t border-line pt-3">
              <Label hint={`${stepGoal.toLocaleString('es')} pasos`}>Objetivo diario</Label>
              <Stepper
                value={stepGoal}
                onChange={(v) => update({ stepGoal: v })}
                step={500}
                min={2000}
                max={30000}
                suffix="pasos"
              />
            </div>
            <div className="mt-3">
              <Label>Pasos de hoy</Label>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (v > 0) setSteps(today(), v);
                  }}
                />
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface2 text-brand">
                  <Footprints size={18} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Page>

      <AddCardioSheet open={adding} onClose={() => setAdding(false)} onAdd={addCardio} />

      <PlanSheet
        open={planning}
        onClose={() => setPlanning(false)}
        onSave={(p) => {
          const saved = saveCardioPlan({ ...p, weekStart });
          // Reparte las sesiones a partir de manana
          materializePlan(saved, days.filter((d) => d >= today()));
          toast('Plan semanal creado');
          setPlanning(false);
        }}
      />
    </>
  );
}

/* ───────────────────────────────────────────────────────── auxiliares */

function AddCardioSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    date: string;
    type: CardioType;
    minutes: number;
    intensity: Intensity;
    planned: boolean;
    completed: boolean;
    machine?: string;
    notes?: string;
  }) => unknown;
}) {
  const [type, setType] = useState<CardioType>('cinta-inclinada');
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>('moderada');
  const [date, setDate] = useState(today());
  const [machine, setMachine] = useState('');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrar cardio"
      footer={
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => {
            onAdd({
              date,
              type,
              minutes,
              intensity,
              planned: false,
              completed: true,
              ...(machine.trim() ? { machine: machine.trim() } : {}),
            });
            toast(`${minutes} min de ${CARDIO_LABEL[type].toLowerCase()}`);
            onClose();
          }}
        >
          Guardar sesion
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Tipo</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as CardioType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{CARDIO_LABEL[t]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Duracion</Label>
          <Stepper value={minutes} onChange={setMinutes} step={5} min={5} max={180} suffix="min" />
        </div>
        <div>
          <Label>Intensidad</Label>
          <Segmented
            value={intensity}
            onChange={setIntensity}
            options={[
              { value: 'baja', label: 'Baja' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'alta', label: 'Alta' },
            ]}
          />
        </div>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label hint="opcional">Maquina</Label>
          <Input value={machine} onChange={(e) => setMachine(e.target.value)} placeholder="Cinta 3" />
        </div>
      </div>
    </Sheet>
  );
}

function PlanSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (plan: {
    sessionsPerWeek: number;
    minutesPerSession: number;
    type: CardioType;
    intensity: Intensity;
  }) => void;
}) {
  const [sessions, setSessions] = useState(4);
  const [minutes, setMinutes] = useState(30);
  const [type, setType] = useState<CardioType>('cinta-inclinada');
  const [intensity, setIntensity] = useState<Intensity>('baja');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Plan semanal de cardio"
      footer={
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => onSave({ sessionsPerWeek: sessions, minutesPerSession: minutes, type, intensity })}
        >
          Crear plan y sesiones
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Sesiones por semana</Label>
          <Stepper value={sessions} onChange={setSessions} step={1} min={1} max={14} />
        </div>
        <div>
          <Label>Minutos por sesion</Label>
          <Stepper value={minutes} onChange={setMinutes} step={5} min={10} max={120} suffix="min" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as CardioType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{CARDIO_LABEL[t]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Intensidad</Label>
          <Segmented
            value={intensity}
            onChange={setIntensity}
            options={[
              { value: 'baja', label: 'Baja' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'alta', label: 'Alta' },
            ]}
          />
        </div>
        <div className="rounded-2xl border border-line bg-surface2 p-3">
          <p className="text-[13px] text-muted">
            Total semanal: <strong className="text-ink">{sessions * minutes} min</strong>
          </p>
          <p className="mt-1 text-[12px] text-faint">
            Se crearan las sesiones pendientes de esta semana a partir de hoy. Puedes marcarlas o
            borrarlas una a una.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
