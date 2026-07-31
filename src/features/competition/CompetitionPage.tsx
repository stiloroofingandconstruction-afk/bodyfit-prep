import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  Footprints,
  Info,
  ListChecks,
  Pencil,
  PersonStanding,
  Sparkles,
  Sunrise,
  Trophy,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { Ring } from '@/components/ui/Ring';
import { PrepSetupSheet } from './PrepSetupSheet';
import { PROJECTION_LABEL, PROJECTION_TONE } from '@/domain/competition';
import { friendlyDate, startOfWeek, today } from '@/lib/date';
import { cx, fmtSigned } from '@/lib/utils';
import {
  useActivePrep,
  useCountdown,
  useProjection,
  useWeekActivity,
  useWeightTrend,
} from '@/store/selectors';
import { useSettingsStore } from '@/store/settingsStore';

const LINKS = [
  { to: '/diario', label: 'Registro diario', detail: 'Peso, sueno, energia y pasos', Icon: Sunrise },
  { to: '/cardio', label: 'Cardio y pasos', detail: 'Plan semanal y seguimiento', Icon: Footprints },
  { to: '/posing', label: 'Posing', detail: 'Sesiones, poses y temporizador', Icon: PersonStanding },
  { to: '/fotos', label: 'Fotos de progreso', detail: 'Angulos y comparacion', Icon: Camera },
  { to: '/checkin', label: 'Check-in semanal', detail: 'Resumen y recomendacion', Icon: CalendarCheck },
  { to: '/competencia/peak-week', label: 'Peak week', detail: 'Checklist y logistica', Icon: ListChecks },
  { to: '/competencia/dia-del-show', label: 'Dia del show', detail: 'Cronograma y checklist', Icon: Trophy },
  { to: '/competencia/post-show', label: 'Post-show', detail: 'Transicion y seguimiento', Icon: Activity },
  { to: '/informes', label: 'Informes y exportacion', detail: 'Resumen para tu coach', Icon: CalendarDays },
];

export default function CompetitionPage() {
  const prep = useActivePrep();
  const cd = useCountdown();
  const trend = useWeightTrend();
  const projection = useProjection();
  const week = useWeekActivity(startOfWeek(today()));
  const competitionMode = useSettingsStore((s) => s.competitionMode);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!prep || !competitionMode) {
    return (
      <>
        <PageHeader title="Competencia" subtitle="Preparacion para subir al escenario" />
        <Page>
          <EmptyState
            icon={<Trophy size={22} />}
            title="Sin competencia activa"
            description="Activa el modo competencia para tener cuenta atras, fases del prep, cardio, posing, peak week y dia del show."
            action={
              <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
                <Sparkles size={17} />
                Activar modo competencia
              </Button>
            }
          />
          <Card className="mt-4">
            <p className="text-[13px] text-muted">
              El modo competencia no cambia tus datos actuales: anade un seguimiento paralelo
              orientado a la fecha del show. Puedes desactivarlo cuando quieras desde Ajustes.
            </p>
          </Card>
        </Page>
        <PrepSetupSheet open={creating} onClose={() => setCreating(false)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={prep.showName}
        subtitle={`${prep.federation} · ${prep.division}${prep.category ? ` · ${prep.category}` : ''}`}
        action={
          <button
            onClick={() => setEditing(true)}
            className="pressable flex size-9 items-center justify-center rounded-full bg-surface2 text-muted"
            aria-label="Editar competencia"
          >
            <Pencil size={16} />
          </button>
        }
      />

      <Page>
        {/* ─────────────────────────────────────────── cuenta atras */}
        <Card>
          <div className="flex items-center gap-5">
            <Ring value={cd?.progressPct ?? 0} max={100} size={116} stroke={10} warnOver={false}>
              <span className="text-[30px] leading-none font-bold tabular">
                {cd ? Math.max(0, cd.daysOut) : 0}
              </span>
              <span className="mt-0.5 text-[10px] tracking-wider text-faint uppercase">
                {cd && cd.daysOut < 0 ? 'dias despues' : 'dias'}
              </span>
            </Ring>

            <div className="min-w-0 flex-1">
              <p className={cx('text-[17px] font-bold', cd?.phase.tone)}>{cd?.phase.label}</p>
              <p className="mt-1 text-[13px] text-muted">{cd?.phase.focus}</p>
              <p className="mt-2 text-[12px] tabular text-faint">
                {cd && cd.weeksOut > 0
                  ? `${cd.weeksOut} semanas${cd.extraDays ? ` y ${cd.extraDays} dias` : ''}`
                  : cd?.daysOut === 0
                    ? 'Hoy es el dia'
                    : 'Show finalizado'}
                {' · '}
                {friendlyDate(prep.showDate)}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1.5 flex justify-between text-[11px] text-faint">
              <span>Inicio {friendlyDate(prep.prepStartDate)}</span>
              <span>{cd?.progressPct ?? 0}% del prep</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${cd?.progressPct ?? 0}%` }} />
            </div>
          </div>
        </Card>

        {/* ─────────────────────────────────────────── estado */}
        <div className="mt-3">
          <SectionTitle>Estado</SectionTitle>
          <Card>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <Stat
                label="Media 7 dias"
                value={trend.avg7 != null ? trend.avg7.toFixed(1) : '—'}
                unit="kg"
              />
              <Stat
                label="Cambio semanal"
                value={trend.weekChange != null ? fmtSigned(trend.weekChange) : '—'}
                unit="kg"
              />
              <Stat
                label="Objetivo"
                value={prep.targetWeight ? prep.targetWeight.toFixed(1) : '—'}
                unit="kg"
              />
            </div>

            {projection && (
              <div className="rounded-2xl border border-line bg-surface2 p-3">
                <p className={cx('text-[14px] font-semibold', PROJECTION_TONE[projection.status])}>
                  {PROJECTION_LABEL[projection.status]}
                </p>
                <p className="mt-1 text-[13px] text-muted">{projection.explanation}</p>
              </div>
            )}
          </Card>
        </div>

        {/* ─────────────────────────────────────────── semana */}
        <div className="mt-3">
          <SectionTitle>Esta semana</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Cardio" value={week.cardioMinutes} unit="min" />
              <Stat label="Pasos / dia" value={week.avgSteps || '—'} />
              <Stat label="Posing" value={week.posingMinutes} unit="min" />
            </div>
          </Card>
        </div>

        {/* ─────────────────────────────────────────── modulos */}
        <div className="mt-5">
          <SectionTitle>Modulos del prep</SectionTitle>
          <div className="space-y-1.5">
            {LINKS.map(({ to, label, detail, Icon }) => (
              <Link
                key={to}
                to={to}
                className="pressable flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{label}</p>
                  <p className="truncate text-[12px] text-faint">{detail}</p>
                </div>
                <ChevronRight size={17} className="shrink-0 text-faint" />
              </Link>
            ))}
          </div>
        </div>

        <Card className="mt-5 border-line/70">
          <div className="flex gap-2.5">
            <Info size={15} className="mt-0.5 shrink-0 text-faint" />
            <p className="text-[12px] text-faint">
              BodyFit Prep es una herramienta de planificacion y seguimiento. No sustituye la
              valoracion de un profesional sanitario ni de un entrenador cualificado. Tus datos se
              guardan solo en este dispositivo.
            </p>
          </div>
        </Card>
      </Page>

      <PrepSetupSheet open={editing} onClose={() => setEditing(false)} existing={prep} />
    </>
  );
}
