import { useMemo, useState } from 'react';
import { ClipboardCopy, Download, FileText } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import {
  cardioCSV,
  checkinsCSV,
  coachReport,
  nutritionCSV,
  weightCSV,
  workoutsCSV,
} from '@/services/exports';
import { exportAll } from '@/services/storage';
import { startOfWeek, today, weekRange } from '@/lib/date';
import { download } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { alive } from '@/store/persist';
import { useNutritionStore } from '@/store/nutritionStore';
import { useActivityStore } from '@/store/activityStore';
import { useProfile } from '@/store/profileStore';
import {
  useActivePrep,
  useCheckins,
  useCountdown,
  useMeasurements,
  usePhotos,
  useReadiness,
  useTargets,
  useWeekActivity,
  useWeightTrend,
  useWorkouts,
} from '@/store/selectors';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

export default function ReportsPage() {
  const profile = useProfile();
  const readiness = useReadiness();
  const measurements = useMeasurements();
  const workouts = useWorkouts();
  const checkins = useCheckins();
  const photos = usePhotos();
  const entries = useNutritionStore((s) => s.entries);
  const cardio = useActivityStore((s) => s.cardioSessions);
  const steps = useActivityStore((s) => s.steps);
  const targets = useTargets();
  const trend = useWeightTrend();
  const prep = useActivePrep();
  const cd = useCountdown();

  const u = useUnits();
  const weekStart = startOfWeek(today());
  const week = useWeekActivity(weekStart);
  const [preview, setPreview] = useState<string | null>(null);

  const report = useMemo(() => {
    const days = weekRange(weekStart).filter((d) => d <= today());
    const logged = days.filter((d) => alive(entries).some((e) => e.date === d)).length;
    const recent = readiness.filter((r) => r.date >= weekStart);
    const avg = (key: 'sleepQuality' | 'energy' | 'hunger' | 'stress') => {
      const vals = recent.filter((r) => r[key] != null).map((r) => r[key] as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const latest = measurements[measurements.length - 1];
    const measures: { label: string; value: number }[] = [];
    if (latest) {
      const fields: [keyof typeof latest, string][] = [
        ['waist', 'Cintura'], ['chest', 'Pecho'], ['arm', 'Brazo'],
        ['thigh', 'Muslo'], ['hip', 'Cadera'], ['calf', 'Pantorrilla'],
      ];
      for (const [key, label] of fields) {
        const v = latest[key];
        if (typeof v === 'number') measures.push({ label, value: v });
      }
    }

    return coachReport({
      athleteName: profile.name,
      ...(prep ? { showName: prep.showName } : {}),
      ...(cd ? { daysOut: cd.daysOut, phase: cd.phase.label } : {}),
      weekStart,
      avgWeight: trend.avg7,
      prevAvgWeight: trend.prevAvg7,
      weekChange: trend.weekChange,
      weekPct: trend.weekPct,
      targets,
      adherence: days.length ? (logged / days.length) * 100 : 0,
      cardioMinutes: week.cardioMinutes,
      avgSteps: week.avgSteps,
      workouts: workouts.filter((w) => w.date >= weekStart).length,
      posingMinutes: week.posingMinutes,
      sleep: avg('sleepQuality'),
      energy: avg('energy'),
      hunger: avg('hunger'),
      stress: avg('stress'),
      strength: null,
      measurements: measures,
      photos: photos.filter((p) => p.date >= weekStart).length,
      units: u,
    });
  }, [profile.name, prep, cd, weekStart, trend, targets, entries, readiness, week, workouts, measurements, photos, u]);

  const stamp = today();

  const EXPORTS = [
    {
      label: 'Peso y medidas',
      detail: `CSV con peso diario (${u.w}), hora, cintura (${u.l}) y notas`,
      file: `bodyfit-peso-${stamp}.csv`,
      make: () => weightCSV(readiness, measurements, u),
      type: 'text/csv',
    },
    {
      label: 'Nutricion',
      detail: 'CSV con cada alimento registrado y sus macros',
      file: `bodyfit-nutricion-${stamp}.csv`,
      make: () => nutritionCSV(alive(entries)),
      type: 'text/csv',
    },
    {
      label: 'Entrenamientos',
      detail: 'CSV con cada serie: peso, repeticiones y tipo',
      file: `bodyfit-entrenos-${stamp}.csv`,
      make: () => workoutsCSV(workouts, u),
      type: 'text/csv',
    },
    {
      label: 'Check-ins',
      detail: 'CSV con el historico semanal completo',
      file: `bodyfit-checkins-${stamp}.csv`,
      make: () => checkinsCSV(checkins, u),
      type: 'text/csv',
    },
    {
      label: 'Cardio y pasos',
      detail: 'CSV con sesiones de cardio y pasos diarios',
      file: `bodyfit-cardio-${stamp}.csv`,
      make: () => cardioCSV(alive(cardio), alive(steps)),
      type: 'text/csv',
    },
  ];

  return (
    <>
      <PageHeader title={t('screen.reports')} subtitle={t('rep.subtitle')} back />

      <Page>
        {/* ─────────────────────────── informe para coach */}
        <SectionTitle>{t('rep.coachSummary')}</SectionTitle>
        <Card>
          <p className="text-[13px] text-muted">
            Genera el resumen de la semana en curso con peso medio, ritmo, macros, adherencia,
            cardio, pasos, sensaciones y medidas. Se escribe en tus unidades ({u.w} y {u.l}) y esta
            listo para pegar en un mensaje o imprimir.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="primary" onClick={() => setPreview(report)}>
              <FileText size={16} />
              Ver resumen
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                download(`bodyfit-resumen-${stamp}.md`, report, 'text/markdown');
                toast('Resumen descargado');
              }}
            >
              <Download size={16} />
              Descargar
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-faint">
            {t('rep.photosNote')}
          </p>
        </Card>

        {/* ─────────────────────────── CSV */}
        <div className="mt-5">
          <SectionTitle>Exportar a CSV</SectionTitle>
          <div className="space-y-1.5">
            {EXPORTS.map((x) => (
              <button
                key={x.file}
                onClick={() => {
                  download(x.file, x.make(), x.type);
                  toast(`${x.label} exportado`);
                }}
                className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
                  <Download size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{x.label}</p>
                  <p className="truncate text-[12px] text-faint">{x.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─────────────────────────── respaldo completo */}
        <div className="mt-5">
          <SectionTitle>Respaldo completo</SectionTitle>
          <Card>
            <p className="text-[13px] text-muted">
              {t('rep.jsonNote')}
            </p>
            <Button
              variant="secondary"
              block
              className="mt-3"
              onClick={async () => {
                download(`bodyfit-completo-${stamp}.json`, await exportAll());
                toast('Respaldo descargado');
              }}
            >
              <Download size={16} />
              Descargar JSON completo
            </Button>
          </Card>
        </div>
      </Page>

      <Sheet
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Resumen semanal"
        height="full"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(preview ?? '');
                  toast('Copiado al portapapeles');
                } catch {
                  toast('El navegador no permitio copiar', 'warn');
                }
              }}
            >
              <ClipboardCopy size={17} />
            </Button>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => {
                download(`bodyfit-resumen-${stamp}.md`, preview ?? '', 'text/markdown');
                toast('Resumen descargado');
              }}
            >
              Descargar
            </Button>
          </div>
        }
      >
        <pre className="scroll-momentum overflow-x-auto rounded-2xl border border-line bg-surface2 p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-muted">
          {preview}
        </pre>
      </Sheet>
    </>
  );
}
