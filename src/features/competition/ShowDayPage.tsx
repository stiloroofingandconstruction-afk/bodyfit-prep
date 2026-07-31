import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Trash2, WifiOff } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { CheckList } from './PeakWeekPage';
import { friendlyDate } from '@/lib/date';
import { uid } from '@/lib/utils';
import { alive } from '@/store/persist';
import { usePrepStore } from '@/store/prepStore';
import { useActivePrep } from '@/store/selectors';
import type { ChecklistItem, ShowDayItem } from '@/domain/prepTypes';

const DEFAULT_SCHEDULE: Omit<ShowDayItem, 'id' | 'done'>[] = [
  { time: '05:30', label: 'Despertar', detail: 'Sin prisa, con margen' },
  { time: '06:00', label: 'Primera comida', detail: 'La misma que has ensayado' },
  { time: '07:00', label: 'Salida hacia el recinto' },
  { time: '08:00', label: 'Registro y pesaje', detail: 'Documento de identidad y carnet' },
  { time: '08:30', label: 'Reunion de competidores', detail: 'Orden de salida y normas' },
  { time: '09:00', label: 'Ultima capa de tan y brillo' },
  { time: '10:00', label: 'Calentamiento y pump-up', detail: 'Bandas, repeticiones altas, sin fatiga' },
  { time: '10:30', label: 'Backstage', detail: 'Atento a las llamadas' },
  { time: '11:00', label: 'Prejudging', detail: 'Cuartos de vuelta y comparativas' },
  { time: '14:00', label: 'Comida entre rondas' },
  { time: '17:00', label: 'Finals', detail: 'Rutina y premiacion' },
];

const DEFAULT_CHECKLIST: string[] = [
  'Ropa de competicion',
  'Calzado de escenario',
  'Documento de identidad y carnet de federacion',
  'Comprobante de inscripcion',
  'Musica de la rutina en el formato pedido',
  'Comida y bebida conocidas',
  'Bandas elasticas para el pump-up',
  'Toallas viejas y ropa oscura',
  'Kit de retoque de tan y brillo',
  'Cargador y bateria externa',
  'Toalla y espejo de mano',
  'Alguien de confianza para ayudar backstage',
];

export default function ShowDayPage() {
  const prep = useActivePrep();
  const plans = usePrepStore((s) => s.showDayPlans);
  const saveShowDay = usePrepStore((s) => s.saveShowDay);
  const updateShowDay = usePrepStore((s) => s.updateShowDay);
  const [newTime, setNewTime] = useState('12:00');
  const [newLabel, setNewLabel] = useState('');

  const plan = useMemo(
    () => (prep ? alive(plans).find((p) => p.prepId === prep.id) : undefined),
    [plans, prep],
  );

  useEffect(() => {
    if (prep && !plan) {
      saveShowDay({
        prepId: prep.id,
        date: prep.showDate,
        schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s, id: uid(), done: false })),
        checklist: DEFAULT_CHECKLIST.map((label) => ({ id: uid(), label, done: false })),
      });
    }
  }, [prep, plan, saveShowDay]);

  if (!prep) {
    return (
      <>
        <PageHeader title="Dia del show" back />
        <Page>
          <EmptyState
            title="Sin competencia activa"
            description="Activa el modo competencia para preparar el dia del show."
          />
        </Page>
      </>
    );
  }

  if (!plan) return null;

  const sorted = [...plan.schedule].sort((a, b) => a.time.localeCompare(b.time));
  const doneCount = plan.schedule.filter((s) => s.done).length;

  return (
    <>
      <PageHeader
        title="Dia del show"
        subtitle={`${friendlyDate(prep.showDate)} · ${prep.showName}`}
        back
      />

      <Page>
        <Card className="border-brand/25 bg-brand/8">
          <div className="flex gap-2.5">
            <WifiOff size={15} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[13px] text-muted">
              Esta pantalla funciona sin conexion. En un recinto lleno la cobertura suele caer:
              todo lo que ves aqui esta guardado en el dispositivo.
            </p>
          </div>
        </Card>

        {/* ───────────────────────────────────── datos del dia */}
        <div className="mt-4">
          <SectionTitle>Datos</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recinto</Label>
                <Input
                  value={plan.venue ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { venue: e.target.value })}
                  placeholder="Teatro municipal"
                />
              </div>
              <div>
                <Label>Numero de competidor</Label>
                <Input
                  value={plan.competitorNumber ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { competitorNumber: e.target.value })}
                  placeholder="—"
                />
              </div>
              <div>
                <Label>Hora de llegada</Label>
                <Input
                  type="time"
                  value={plan.arrivalTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { arrivalTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Registro</Label>
                <Input
                  type="time"
                  value={plan.checkInTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { checkInTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Tanning</Label>
                <Input
                  type="time"
                  value={plan.tanningTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { tanningTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora de categoria</Label>
                <Input
                  type="time"
                  value={plan.categoryTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { categoryTime: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label hint="titulo o archivo">Musica de la rutina</Label>
              <Input
                value={plan.music ?? ''}
                onChange={(e) => updateShowDay(plan.id, { music: e.target.value })}
                placeholder="—"
              />
            </div>
          </Card>
        </div>

        {/* ───────────────────────────────────── cronograma */}
        <div className="mt-5">
          <SectionTitle
            action={<span className="text-[11px] text-faint">{doneCount}/{plan.schedule.length}</span>}
          >
            Cronograma
          </SectionTitle>
          <div className="space-y-1.5">
            {sorted.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${
                  item.done ? 'border-brand/30 bg-brand/8' : 'border-line bg-surface'
                }`}
              >
                <button
                  onClick={() =>
                    updateShowDay(plan.id, {
                      schedule: plan.schedule.map((s) =>
                        s.id === item.id ? { ...s, done: !s.done } : s,
                      ),
                    })
                  }
                  className="pressable flex w-14 shrink-0 items-center gap-1 rounded-lg bg-surface2 px-1.5 py-1 text-[12px] font-semibold tabular text-brand"
                >
                  <Clock size={11} />
                  {item.time}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] ${item.done ? 'text-muted line-through' : 'text-ink'}`}>
                    {item.label}
                  </p>
                  {item.detail && <p className="text-[12px] text-faint">{item.detail}</p>}
                </div>
                <button
                  onClick={() =>
                    updateShowDay(plan.id, {
                      schedule: plan.schedule.filter((s) => s.id !== item.id),
                    })
                  }
                  className="pressable flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
                  aria-label="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32 shrink-0"
            />
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Anadir al cronograma"
            />
            <Button
              variant="secondary"
              disabled={!newLabel.trim()}
              onClick={() => {
                updateShowDay(plan.id, {
                  schedule: [
                    ...plan.schedule,
                    { id: uid(), time: newTime, label: newLabel.trim(), done: false },
                  ],
                });
                setNewLabel('');
              }}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* ───────────────────────────────────── checklist */}
        <div className="mt-5">
          <SectionTitle
            action={
              <span className="text-[11px] text-faint">
                {plan.checklist.filter((i) => i.done).length}/{plan.checklist.length}
              </span>
            }
          >
            Que llevar
          </SectionTitle>
          <CheckList
            items={plan.checklist as ChecklistItem[]}
            onToggle={(id) =>
              updateShowDay(plan.id, {
                checklist: plan.checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
              })
            }
          />
        </div>

        <div className="mt-5">
          <SectionTitle>Notas</SectionTitle>
          <textarea
            value={plan.notes ?? ''}
            onChange={(e) => updateShowDay(plan.id, { notes: e.target.value })}
            rows={4}
            placeholder="Contactos, indicaciones del coach, recordatorios de ultima hora..."
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>
      </Page>
    </>
  );
}
