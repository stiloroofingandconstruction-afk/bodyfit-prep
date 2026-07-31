import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { addDays, dayName, friendlyDate, startOfWeek, weekRange } from '@/lib/date';
import { cx, uid } from '@/lib/utils';
import { alive } from '@/store/persist';
import { usePrepStore } from '@/store/prepStore';
import { useActivePrep, useCountdown } from '@/store/selectors';
import type { ChecklistItem } from '@/domain/prepTypes';

/**
 * Peak week con enfoque conservador.
 *
 * Deliberadamente NO automatiza cargas o descargas de agua, sodio, carbohidratos
 * ni suplementacion: son decisiones individuales que requieren un coach y, en su
 * caso, supervision medica. Lo que si hace es asegurar que no se te olvide nada
 * de la logistica, que es donde de verdad se pierden shows.
 */
const DEFAULT_CHECKLIST: string[] = [
  'Mantener la rutina de comidas que ya conoces',
  'Mantener la ingesta habitual de agua',
  'Mantener el sodio habitual de tu dieta',
  'Practicar posing a diario, con la musica del show',
  'Reducir el volumen de entrenamiento, mantener la intensidad tecnica',
  'Priorizar el sueno: 7–9 horas',
  'Nada de alimentos nuevos esta semana',
  'Nada de suplementos nuevos esta semana',
  'Revisar que la ropa de competicion esta lista y probada',
  'Confirmar la hora y el lugar del registro',
];

const DEFAULT_LOGISTICS: string[] = [
  'Inscripcion confirmada y pagada',
  'Carnet de federacion en regla',
  'Tan reservado o material comprado',
  'Ropa de competicion (traje, trunks, bikini)',
  'Calzado para el escenario',
  'Musica entregada en el formato pedido',
  'Documento de identidad',
  'Transporte al recinto',
  'Alojamiento confirmado',
  'Comida conocida preparada para el dia',
  'Toallas viejas y sabanas oscuras para el tan',
  'Bandas elasticas para el pump-up',
  'Cargador y bateria externa',
];

function toItems(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({ id: uid(), label, done: false }));
}

export default function PeakWeekPage() {
  const prep = useActivePrep();
  const cd = useCountdown();
  const plans = usePrepStore((s) => s.peakWeekPlans);
  const savePeakWeek = usePrepStore((s) => s.savePeakWeek);
  const updatePeakWeek = usePrepStore((s) => s.updatePeakWeek);

  const weekStart = useMemo(
    () => (prep ? startOfWeek(addDays(prep.showDate, -6)) : startOfWeek(new Date().toISOString().slice(0, 10))),
    [prep],
  );

  const plan = useMemo(
    () => (prep ? alive(plans).find((p) => p.prepId === prep.id) : undefined),
    [plans, prep],
  );

  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (prep && !plan) {
      savePeakWeek({
        prepId: prep.id,
        weekStart,
        checklist: toItems(DEFAULT_CHECKLIST),
        logistics: toItems(DEFAULT_LOGISTICS),
        dailyNotes: {},
        acknowledgedDisclaimer: false,
      });
    }
    if (plan) setAck(plan.acknowledgedDisclaimer);
  }, [prep, plan, weekStart, savePeakWeek]);

  if (!prep) {
    return (
      <>
        <PageHeader title="Peak week" back />
        <Page>
          <EmptyState
            title="Sin competencia activa"
            description="Activa el modo competencia para planificar tu peak week."
          />
        </Page>
      </>
    );
  }

  if (!plan) return null;

  const toggle = (list: 'checklist' | 'logistics', id: string) => {
    updatePeakWeek(plan.id, {
      [list]: plan[list].map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    });
  };

  const days = weekRange(weekStart);
  const doneCount = plan.checklist.filter((i) => i.done).length + plan.logistics.filter((i) => i.done).length;
  const totalCount = plan.checklist.length + plan.logistics.length;

  return (
    <>
      <PageHeader
        title="Peak week"
        subtitle={`Semana del ${friendlyDate(weekStart)} · ${doneCount}/${totalCount} completado`}
        back
      />

      <Page>
        {/* ─────────────────────────────────── aviso obligatorio */}
        <Card className="border-carbs/30 bg-carbs/8">
          <div className="flex gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-carbs" />
            <div>
              <p className="text-[14px] font-semibold text-carbs">Lee esto antes de empezar</p>
              <p className="mt-1.5 text-[13px] text-muted">
                Cualquier manipulacion avanzada de agua, sodio, carbohidratos o suplementacion debe
                hacerse con un coach cualificado y, cuando corresponda, supervision medica. Esta app
                no automatiza, no calcula y no recomienda ese tipo de protocolos.
              </p>
              <p className="mt-2 text-[13px] text-muted">
                La peak week no arregla un prep: lo revela. Lo que mas suma a estas alturas es no
                cambiar nada de lo que ya funciona y tener la logistica resuelta.
              </p>
              {!ack && (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setAck(true);
                    updatePeakWeek(plan.id, { acknowledgedDisclaimer: true });
                  }}
                >
                  Entendido
                </Button>
              )}
            </div>
          </div>
        </Card>

        {cd && cd.weeksOut > 1 && (
          <Card className="mt-3">
            <div className="flex gap-2.5">
              <Info size={15} className="mt-0.5 shrink-0 text-sky" />
              <p className="text-[13px] text-muted">
                Aun faltan {cd.weeksOut} semanas. Puedes ir preparando la logistica: es lo que menos
                cuesta adelantar y lo que mas tranquilidad da al llegar.
              </p>
            </div>
          </Card>
        )}

        {/* ─────────────────────────────────── checklist */}
        <div className="mt-5">
          <SectionTitle
            action={
              <span className="text-[11px] text-faint">
                {plan.checklist.filter((i) => i.done).length}/{plan.checklist.length}
              </span>
            }
          >
            Rutina de la semana
          </SectionTitle>
          <CheckList items={plan.checklist} onToggle={(id) => toggle('checklist', id)} />
        </div>

        {/* ─────────────────────────────────── logistica */}
        <div className="mt-5">
          <SectionTitle
            action={
              <span className="text-[11px] text-faint">
                {plan.logistics.filter((i) => i.done).length}/{plan.logistics.length}
              </span>
            }
          >
            Logistica
          </SectionTitle>
          <CheckList items={plan.logistics} onToggle={(id) => toggle('logistics', id)} />
        </div>

        {/* ─────────────────────────────────── notas por dia */}
        <div className="mt-5">
          <SectionTitle>Notas por dia</SectionTitle>
          <div className="space-y-2">
            {days.map((d) => (
              <div key={d} className="rounded-2xl border border-line bg-surface p-3">
                <p className="mb-1.5 text-[13px] font-medium">
                  {dayName(d)}
                  {d === prep.showDate && <span className="ml-2 text-brand">· dia del show</span>}
                </p>
                <textarea
                  value={plan.dailyNotes[d] ?? ''}
                  onChange={(e) =>
                    updatePeakWeek(plan.id, {
                      dailyNotes: { ...plan.dailyNotes, [d]: e.target.value },
                    })
                  }
                  rows={2}
                  placeholder="Comidas, entrenamiento, posing, descanso..."
                  className="w-full resize-none rounded-xl border border-line bg-surface2 px-3 py-2 text-[14px] outline-none placeholder:text-faint focus:border-brand/60"
                />
              </div>
            ))}
          </div>
        </div>
      </Page>
    </>
  );
}

export function CheckList({
  items,
  onToggle,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          className={cx(
            'pressable flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left',
            item.done ? 'border-brand/30 bg-brand/8' : 'border-line bg-surface',
          )}
        >
          <span
            className={cx(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md',
              item.done ? 'bg-brand text-base' : 'border border-line bg-surface2 text-faint',
            )}
          >
            <Check size={13} strokeWidth={3} />
          </span>
          <span className={cx('text-[14px]', item.done ? 'text-muted line-through' : 'text-ink')}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
