import { useEffect, useMemo, useState } from 'react';
import { Camera, Plus, Ruler, Scale, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label, Segmented } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { ProgressTabs } from './ProgressTabs';
import { WeightSheet } from './WeightSheet';
import { bmi, bodyFatCategory, ema, leanMass, navyBodyFat, weeklyTrend, weightSeries } from '@/domain/body';
import { compressImage, deletePhoto, photoURL, putPhoto } from '@/services/blobStore';
import { friendlyDate, shortDate, today } from '@/lib/date';
import { uid } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { useProfile } from '@/store/profileStore';
import { useBodyStore } from '@/store/bodyStore';
import { useCurrentWeight, useMeasurements } from '@/store/selectors';
import { toast } from '@/store/uiStore';
import type { BodyMeasurement } from '@/domain/types';

type Range = '30' | '90' | 'all';

export default function BodyPage() {
  const profile = useProfile();
  const measurements = useMeasurements();
  const weight = useCurrentWeight();
  const remove = useBodyStore((s) => s.remove);
  const u = useUnits();

  const [range, setRange] = useState<Range>('90');
  const [weighing, setWeighing] = useState(false);
  const [measuring, setMeasuring] = useState(false);

  const series = useMemo(() => weightSeries(measurements), [measurements]);
  const filtered = useMemo(() => {
    if (range === 'all') return series;
    const n = Number(range);
    return series.slice(-n);
  }, [series, range]);
  const smoothed = useMemo(() => ema(filtered), [filtered]);
  const trend = useMemo(() => weeklyTrend(series), [series]);

  const latest = measurements[measurements.length - 1];
  const bodyFat = useMemo(() => {
    if (!latest?.neck || !latest?.waist) return latest?.bodyFat ?? null;
    return navyBodyFat({
      sex: profile.sex,
      heightCm: profile.heightCm,
      neck: latest.neck,
      waist: latest.waist,
      hip: latest.hip,
    });
  }, [latest, profile]);

  const category = bodyFat != null ? bodyFatCategory(profile.sex, bodyFat) : null;
  const totalChange = series.length > 1 ? series[series.length - 1].value - series[0].value : 0;

  return (
    <>
      <PageHeader title="Progreso" subtitle="Peso, medidas y fotos" />

      <Page>
        <ProgressTabs />

        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" size="lg" onClick={() => setWeighing(true)}>
            <Scale size={17} />
            Registrar peso
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setMeasuring(true)}>
            <Ruler size={17} />
            Medidas
          </Button>
        </div>

        {/* -------------------------------------------------------- peso */}
        <Card className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <Stat label="Peso actual" value={u.numWeight(weight)} unit={u.w} />
            <Stat
              label="Tendencia"
              value={u.fmtWeightDelta(trend).replace(` ${u.w}`, '')}
              unit={`${u.w}/sem`}
              tone={
                trend === 0
                  ? 'text-muted'
                  : (profile.goal === 'definicion') === trend < 0
                    ? 'text-brand'
                    : 'text-amber'
              }
            />
            <Stat label="Cambio total" value={u.fmtWeightDelta(totalChange).replace(` ${u.w}`, '')} unit={u.w} />
          </div>

          <Segmented
            className="mb-3"
            value={range}
            onChange={setRange}
            options={[
              { value: '30', label: '30 dias' },
              { value: '90', label: '90 dias' },
              { value: 'all', label: 'Todo' },
            ]}
          />

          <LineChart
            data={filtered.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
            overlay={smoothed.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
            height={170}
            unit={` ${u.w}`}
          />
        </Card>

        {/* ---------------------------------------------- composicion */}
        <div className="mt-5">
          <SectionTitle>Composicion corporal</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Grasa corporal"
                value={bodyFat != null ? `${bodyFat}` : '—'}
                unit={bodyFat != null ? '%' : ''}
                tone={category?.tone ?? 'text-ink'}
                sub={category?.label}
              />
              <Stat
                label="Masa magra"
                value={bodyFat != null ? u.numWeight(leanMass(weight, bodyFat)) : '—'}
                unit={u.w}
              />
              <Stat label="IMC" value={bmi(weight, profile.heightCm).toFixed(1)} />
            </div>
            {bodyFat == null && (
              <p className="mt-3 text-[12px] text-faint">
                Registra cuello y cintura en Medidas para calcular el % de grasa con el metodo Navy.
              </p>
            )}
          </Card>
        </div>

        <PhotoSection />

        {/* --------------------------------------------------- historial */}
        <div className="mt-5">
          <SectionTitle>Registros</SectionTitle>
          {measurements.length === 0 ? (
            <EmptyState
              icon={<Scale size={22} />}
              title="Sin registros"
              description="Empieza pesandote hoy. Con dos semanas de datos la tendencia ya te dice la verdad."
            />
          ) : (
            <div className="space-y-1.5">
              {[...measurements].reverse().slice(0, 20).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium tabular">
                      {m.weight != null ? u.fmtWeight(m.weight) : 'Medidas'}
                    </p>
                    <p className="text-[12px] text-faint">
                      {friendlyDate(m.date)}
                      {m.waist ? ` · cintura ${u.fmtLength(m.waist)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(m.id)}
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

      <WeightSheet open={weighing} onClose={() => setWeighing(false)} />
      <MeasurementSheet open={measuring} onClose={() => setMeasuring(false)} latest={latest} />
    </>
  );
}

/* ------------------------------------------------------------- medidas -- */

const FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: 'neck', label: 'Cuello' },
  { key: 'shoulder', label: 'Hombros' },
  { key: 'chest', label: 'Pecho' },
  { key: 'waist', label: 'Cintura' },
  { key: 'hip', label: 'Cadera' },
  { key: 'arm', label: 'Brazo' },
  { key: 'thigh', label: 'Muslo' },
  { key: 'calf', label: 'Gemelo' },
];

function MeasurementSheet({
  open,
  onClose,
  latest,
}: {
  open: boolean;
  onClose: () => void;
  latest?: BodyMeasurement;
}) {
  const upsert = useBodyStore((s) => s.upsert);
  const u = useUnits();
  const [values, setValues] = useState<Record<string, string>>({});

  // Los campos se rellenan en la unidad del usuario y se convierten al guardar
  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = latest?.[f.key];
      if (typeof v === 'number') seed[f.key] = u.numLength(v);
    }
    setValues(seed);
  }, [open, latest, u]);

  const save = () => {
    const patch: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(values[f.key]);
      if (n > 0) patch[f.key] = u.toCanonicalLength(n);
    }
    upsert({ date: today(), ...patch });
    toast('Medidas guardadas');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Medidas corporales"
      height="full"
      footer={
        <Button variant="primary" size="lg" block onClick={save}>
          Guardar medidas
        </Button>
      }
    >
      <p className="mb-4 text-[13px] text-muted">
        En {u.lengthUnit === 'cm' ? 'centimetros' : 'pulgadas'}. Mide siempre a la misma hora y
        sin tensar el musculo.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              inputMode="decimal"
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder="0"
              suffix={u.l}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-faint">
        Cuello y cintura (y cadera en mujeres) alimentan el calculo de % de grasa.
      </p>
    </Sheet>
  );
}

/* --------------------------------------------------------------- fotos -- */

function PhotoSection() {
  const measurements = useMeasurements();
  const attachPhoto = useBodyStore((s) => s.attachPhoto);
  const detachPhoto = useBodyStore((s) => s.detachPhoto);
  const [urls, setUrls] = useState<{ id: string; date: string; url: string }[]>([]);

  const photos = useMemo(
    () =>
      measurements
        .flatMap((m) => (m.photoIds ?? []).map((id) => ({ id, date: m.date })))
        .reverse()
        .slice(0, 12),
    [measurements],
  );

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const out: { id: string; date: string; url: string }[] = [];
      for (const p of photos) {
        const url = await photoURL(p.id);
        if (url) {
          created.push(url);
          out.push({ ...p, url });
        }
      }
      if (!cancelled) setUrls(out);
    })();
    return () => {
      cancelled = true;
      created.forEach(URL.revokeObjectURL);
    };
  }, [photos]);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const blob = await compressImage(file);
    const id = uid('photo');
    await putPhoto(id, blob);
    attachPhoto(today(), id);
    toast('Foto guardada');
  };

  return (
    <div className="mt-5">
      <SectionTitle
        action={
          <label className="pressable cursor-pointer text-[12px] text-brand">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            <Plus size={12} className="mr-0.5 inline" />
            Anadir
          </label>
        }
      >
        Fotos de progreso
      </SectionTitle>

      {urls.length === 0 ? (
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface2 text-faint">
              <Camera size={19} />
            </div>
            <p className="text-[13px] text-muted">
              Misma luz, misma pose, mismo momento del dia. Las fotos ven lo que la bascula no.
            </p>
          </div>
        </Card>
      ) : (
        <div className="scroll-momentum -mx-4 flex gap-2 overflow-x-auto px-4">
          {urls.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <img
                src={p.url}
                alt={`Progreso ${p.date}`}
                className="h-40 w-28 rounded-2xl border border-line object-cover"
              />
              <span className="absolute inset-x-1 bottom-1 rounded-lg bg-black/60 py-0.5 text-center text-[10px] backdrop-blur">
                {shortDate(p.date)}
              </span>
              <button
                onClick={async () => {
                  await deletePhoto(p.id);
                  detachPhoto(p.date, p.id);
                }}
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                aria-label="Eliminar foto"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
