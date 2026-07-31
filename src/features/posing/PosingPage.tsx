import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pause, Play, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Label, Select, Stepper } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { Ring } from '@/components/ui/Ring';
import { POSE_BY_ID, posesFor } from '@/data/poses';
import { formatDuration, friendlyDate, startOfWeek, today } from '@/lib/date';
import { cx, haptic } from '@/lib/utils';
import { alive } from '@/store/persist';
import { useActivityStore } from '@/store/activityStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import type { Division } from '@/domain/competition';

const DIVISIONS: Division[] = [
  "Men's Physique", 'Classic Physique', 'Bodybuilding', 'Bikini', 'Wellness', 'Figure', 'Womens Physique',
];

export default function PosingPage() {
  const division = useSettingsStore((s) => s.division);
  const updateSettings = useSettingsStore((s) => s.update);
  const sessions = useActivityStore((s) => s.posingSessions);
  const removePosing = useActivityStore((s) => s.removePosing);
  const [running, setRunning] = useState(false);

  const poses = useMemo(() => posesFor(division), [division]);

  const history = useMemo(
    () => alive(sessions).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [sessions],
  );

  const weekMinutes = useMemo(() => {
    const start = startOfWeek(today());
    return alive(sessions).filter((s) => s.date >= start).reduce((n, s) => n + s.minutes, 0);
  }, [sessions]);

  const totalMinutes = useMemo(
    () => alive(sessions).reduce((n, s) => n + s.minutes, 0),
    [sessions],
  );

  return (
    <>
      <PageHeader title="Posing" subtitle={division} back />

      <Page>
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Esta semana" value={weekMinutes} unit="min" tone="text-brand" />
            <Stat label="Sesiones" value={alive(sessions).length} />
            <Stat label="Total" value={totalMinutes} unit="min" />
          </div>
        </Card>

        <div className="mt-3">
          <Label>Division</Label>
          <Select
            value={division}
            onChange={(e) => updateSettings({ division: e.target.value as Division })}
          >
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        <Button variant="primary" size="lg" block className="mt-3" onClick={() => setRunning(true)}>
          <Play size={17} />
          Empezar sesion
        </Button>

        {/* ─────────────────────────────────────── poses */}
        <div className="mt-5">
          <SectionTitle action={<span className="text-[11px] text-faint">{poses.length} poses</span>}>
            Poses de tu division
          </SectionTitle>
          <div className="space-y-1.5">
            {poses.map((p) => (
              <details key={p.id} className="rounded-2xl border border-line bg-surface px-3.5 py-3">
                <summary className="flex cursor-pointer items-center justify-between gap-2 list-none">
                  <span className="text-[15px] font-medium">{p.name}</span>
                  <span className="shrink-0 text-[11px] text-faint">{p.holdSeconds}s</span>
                </summary>
                <ul className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
                  {p.cues.map((c, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-muted">
                      <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-brand" />
                      {c}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <p className="mt-2 px-1 text-[11px] text-faint">
            Las poses obligatorias varian entre federaciones y temporadas. Confirma siempre la
            normativa oficial de la tuya.
          </p>
        </div>

        {/* ─────────────────────────────────────── historial */}
        <div className="mt-5">
          <SectionTitle>Historial</SectionTitle>
          {history.length === 0 ? (
            <EmptyState
              title="Sin sesiones registradas"
              description="El posing se entrena como cualquier otra habilidad: poco tiempo, muchos dias."
            />
          ) : (
            <div className="space-y-1.5">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{s.minutes} min · {s.division}</p>
                    <p className="truncate text-[12px] text-faint">
                      {friendlyDate(s.date)} · {s.posesPracticed.length} poses
                    </p>
                  </div>
                  <button
                    onClick={() => removePosing(s.id)}
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

      {running && <PosingTimer division={division} onClose={() => setRunning(false)} />}
    </>
  );
}

/* ────────────────────────────────────────────── temporizador de posing */

function PosingTimer({ division, onClose }: { division: Division; onClose: () => void }) {
  const poses = useMemo(() => posesFor(division), [division]);
  const addPosing = useActivityStore((s) => s.addPosing);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'hold' | 'rest'>('hold');
  const [remaining, setRemaining] = useState(poses[0]?.holdSeconds ?? 10);
  const [paused, setPaused] = useState(false);
  const [restSeconds, setRestSeconds] = useState(15);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const elapsedRef = useRef(0);

  const pose = poses[index];

  useEffect(() => {
    if (paused || !pose) return;
    const id = setInterval(() => {
      elapsedRef.current += 1;
      setRemaining((r) => {
        if (r > 1) return r - 1;
        haptic(30);
        // Cambio de fase
        if (phase === 'hold') {
          setPhase('rest');
          return restSeconds;
        }
        setPhase('hold');
        setIndex((i) => {
          const next = i + 1;
          return next < poses.length ? next : i;
        });
        return poses[Math.min(index + 1, poses.length - 1)]?.holdSeconds ?? 10;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, phase, restSeconds, index, poses, pose]);

  const finish = () => {
    const minutes = Math.max(1, Math.round(elapsedRef.current / 60));
    addPosing({
      date: today(),
      division,
      minutes,
      posesPracticed: poses.slice(0, index + 1).map((p) => p.id),
      checklist: done,
    });
    toast(`Sesion de ${minutes} min guardada`);
    onClose();
  };

  if (!pose) return null;

  const total = phase === 'hold' ? pose.holdSeconds : restSeconds;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Sesion de posing"
      height="full"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" block onClick={finish}>
            Terminar y guardar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center">
        <Ring
          value={total - remaining}
          max={total}
          size={190}
          stroke={13}
          color={phase === 'hold' ? 'var(--color-brand)' : 'var(--color-sky)'}
          warnOver={false}
        >
          <span className="text-[44px] leading-none font-bold tabular">{remaining}</span>
          <span className="mt-1 text-[11px] tracking-wider text-faint uppercase">
            {phase === 'hold' ? 'Mantener' : 'Descanso'}
          </span>
        </Ring>

        <p className="mt-4 text-[20px] font-bold">{pose.name}</p>
        <p className="text-[12px] text-faint">
          Pose {index + 1} de {poses.length} · {formatDuration(elapsedRef.current)} transcurridos
        </p>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPhase('hold');
              setRemaining(pose.holdSeconds);
            }}
          >
            <RotateCcw size={16} />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const next = Math.min(index + 1, poses.length - 1);
              setIndex(next);
              setPhase('hold');
              setRemaining(poses[next].holdSeconds);
            }}
          >
            <SkipForward size={16} />
          </Button>
        </div>

        <div className="mt-5 w-full">
          <Label hint={`${restSeconds}s`}>Descanso entre poses</Label>
          <Stepper value={restSeconds} onChange={setRestSeconds} step={5} min={5} max={90} suffix="s" />
        </div>

        <ul className="mt-5 w-full space-y-1.5 rounded-2xl border border-line bg-surface2 p-3">
          {pose.cues.map((c, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-muted">
              <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-brand" />
              {c}
            </li>
          ))}
        </ul>

        <div className="mt-4 w-full">
          <SectionTitle>Checklist de la sesion</SectionTitle>
          <div className="space-y-1">
            {poses.map((p) => (
              <button
                key={p.id}
                onClick={() => setDone((d) => ({ ...d, [p.id]: !d[p.id] }))}
                className="pressable flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-left"
              >
                <span
                  className={cx(
                    'flex size-6 shrink-0 items-center justify-center rounded-md',
                    done[p.id] ? 'bg-brand text-base' : 'border border-line bg-surface2 text-faint',
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="truncate text-[14px]">{POSE_BY_ID.get(p.id)?.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
