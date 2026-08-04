import { useState } from 'react';
import { Check, ChevronDown, Lightbulb, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Stepper } from '@/components/ui/Field';
import { ACTION_LABEL, ACTION_TONE, type RecommendationResult } from '@bodyfit/domain/recommendations';
import { cx, fmtSigned } from '@/lib/utils';
import { t } from '@/i18n';

interface Props {
  result: RecommendationResult;
  currentKcal: number;
  currentCardio: number;
  onAccept: (kcalDelta: number, cardioDelta: number) => void;
  onReject: () => void;
  resolved?: 'aceptada' | 'rechazada' | 'modificada' | 'pendiente';
}

/**
 * Tarjeta de recomendacion.
 *
 * Muestra SIEMPRE los datos usados y el razonamiento antes de la propuesta, y
 * nunca aplica nada por su cuenta: el usuario acepta, rechaza o modifica.
 */
export function RecommendationCard({
  result,
  currentKcal,
  currentCardio,
  onAccept,
  onReject,
  resolved = 'pendiente',
}: Props) {
  const [showData, setShowData] = useState(false);
  const [editing, setEditing] = useState(false);
  const [kcalDelta, setKcalDelta] = useState(result.kcalDelta);
  const [cardioDelta, setCardioDelta] = useState(result.cardioMinutesDelta);

  const noChange = result.kcalDelta === 0 && result.cardioMinutesDelta === 0;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className={cx(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2',
            ACTION_TONE[result.action],
          )}
        >
          <Lightbulb size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                'rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                ACTION_TONE[result.action],
              )}
            >
              {ACTION_LABEL[result.action]}
            </span>
            <span className="text-[10px] text-faint">confianza {result.confidence}</span>
          </div>
          <p className={cx('mt-1.5 text-[16px] font-semibold', ACTION_TONE[result.action])}>
            {result.headline}
          </p>
        </div>
      </div>

      {/* razonamiento */}
      <ul className="mt-3 space-y-1.5">
        {result.reasoning.map((r, i) => (
          <li key={i} className="flex gap-2 text-[13px] text-muted">
            <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-current opacity-40" />
            {r}
          </li>
        ))}
      </ul>

      {/* datos usados */}
      <button
        onClick={() => setShowData((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-[12px] text-muted"
      >
        <span>{t('chk.dataUsed')}</span>
        <ChevronDown size={14} className={cx('transition-transform', showData && 'rotate-180')} />
      </button>
      {showData && (
        <ul className="mt-1.5 space-y-1 rounded-xl border border-line bg-surface2 p-3">
          {result.dataUsed.map((d, i) => (
            <li key={i} className="text-[12px] tabular text-faint">
              {d}
            </li>
          ))}
        </ul>
      )}

      {/* propuesta */}
      {!noChange && (
        <div className="mt-3 rounded-2xl border border-line bg-surface2 p-3">
          <p className="mb-2 text-[11px] tracking-wider text-faint uppercase">Cambio propuesto</p>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label hint={`${currentKcal} → ${currentKcal + kcalDelta} kcal`}>Calorias</Label>
                <Stepper
                  value={kcalDelta}
                  onChange={setKcalDelta}
                  step={25}
                  min={-400}
                  max={400}
                  suffix="kcal"
                />
              </div>
              <div>
                <Label hint={`${currentCardio} → ${currentCardio + cardioDelta} min/sem`}>
                  Cardio semanal
                </Label>
                <Stepper
                  value={cardioDelta}
                  onChange={setCardioDelta}
                  step={15}
                  min={-180}
                  max={180}
                  suffix="min"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {result.kcalDelta !== 0 && (
                <Row label="Calorias" from={currentKcal} to={currentKcal + result.kcalDelta} unit="kcal" />
              )}
              {result.cardioMinutesDelta !== 0 && (
                <Row
                  label="Cardio semanal"
                  from={currentCardio}
                  to={currentCardio + result.cardioMinutesDelta}
                  unit="min"
                />
              )}
            </div>
          )}
          <p className="mt-2 border-t border-line pt-2 text-[12px] text-faint">
            {result.estimatedImpact}
          </p>
        </div>
      )}

      {noChange && (
        <p className="mt-3 rounded-2xl border border-line bg-surface2 p-3 text-[13px] text-muted">
          {result.estimatedImpact}
        </p>
      )}

      {/* acciones */}
      {resolved === 'pendiente' ? (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={onReject}>
            <X size={16} />
            Rechazar
          </Button>
          {!noChange && (
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Ver original' : 'Modificar'}
            </Button>
          )}
          <Button
            variant="primary"
            block
            onClick={() => onAccept(editing ? kcalDelta : result.kcalDelta, editing ? cardioDelta : result.cardioMinutesDelta)}
          >
            <Check size={16} />
            {noChange ? 'De acuerdo' : 'Aceptar'}
          </Button>
        </div>
      ) : (
        <p
          className={cx(
            'mt-3 rounded-xl px-3 py-2 text-center text-[13px] font-medium',
            resolved === 'rechazada' ? 'bg-surface2 text-muted' : 'bg-brand/12 text-brand',
          )}
        >
          Recomendacion {resolved}
        </p>
      )}
    </Card>
  );
}

function Row({ label, from, to, unit }: { label: string; from: number; to: number; unit: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="tabular">
        <span className="text-faint">{from}</span>
        <span className="mx-1.5 text-brand">→</span>
        <span className="font-semibold text-ink">
          {to} {unit}
        </span>
        <span className="ml-2 text-[12px] text-faint">{fmtSigned(to - from)}</span>
      </span>
    </div>
  );
}
