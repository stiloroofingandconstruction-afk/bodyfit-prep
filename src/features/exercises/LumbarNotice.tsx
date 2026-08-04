import { AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Misc';
import { LUMBAR_TONE, lumbarAlternativesFor } from '@/data/exercises';
import { lumbarLabel } from '@/i18n/catalogLabels';
import { cx } from '@/lib/utils';
import { t } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import type { Exercise } from '@bodyfit/domain/types';

/** ¿El usuario declaro sensibilidad lumbar en Ajustes? */
export function useLumbarSensitive(): boolean {
  const discomforts = useSettingsStore((s) => s.discomforts);
  return discomforts.some((d) =>
    /lumbar|espalda baja|espalda|lomo|ciatic|hernia|disco/i.test(d),
  );
}

interface Props {
  exercise: Exercise;
  /** Cambiar a otro ejercicio (sustituir en la sesion o navegar). */
  onSelect?: (id: string) => void;
  /** Version compacta para listas. */
  compact?: boolean;
}

/**
 * Capa de seguridad lumbar.
 *
 * Muestra el nivel de demanda, cuando conviene reducir carga y alternativas
 * concretas. Si el usuario declaro sensibilidad lumbar en Ajustes, el aviso
 * sube de tono. No diagnostica ni prescribe tratamiento.
 */
export function LumbarNotice({ exercise, onSelect, compact }: Props) {
  const sensitive = useLumbarSensitive();
  const avoided = useSettingsStore((s) => s.avoidedExercises);
  const toggleAvoided = useSettingsStore((s) => s.toggleAvoidedExercise);

  if (exercise.lumbarLoad === 'bajo') return null;

  const alternatives = lumbarAlternativesFor(exercise);
  const isAvoided = avoided.includes(exercise.id);
  const high = exercise.lumbarLoad === 'alto';

  if (compact) {
    return (
      <p className={cx('flex items-center gap-1.5 text-[12px]', LUMBAR_TONE[exercise.lumbarLoad])}>
        <AlertTriangle size={12} className="shrink-0" />
        {lumbarLabel(exercise.lumbarLoad)}
        {sensitive && high && ` · ${t('ex.lumbarSensitiveShort')}`}
      </p>
    );
  }

  return (
    <Card
      className={cx(
        'border',
        high ? 'border-rose/30 bg-rose/8' : 'border-carbs/30 bg-carbs/8',
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle size={18} className={cx('mt-0.5 shrink-0', LUMBAR_TONE[exercise.lumbarLoad])} />
        <div className="min-w-0 flex-1">
          <p className={cx('text-[14px] font-semibold', LUMBAR_TONE[exercise.lumbarLoad])}>
            {lumbarLabel(exercise.lumbarLoad)}
            {sensitive && ` · ${t('ex.lumbarSensitiveOn')}`}
          </p>

          <p className="mt-1.5 text-[13px] text-muted">
            {high ? t('ex.lumbarHighBody') : t('ex.lumbarModerateBody')}
          </p>

          {exercise.technique.lumbarAdaptation && (
            <div className="mt-2.5 rounded-xl border border-line/60 bg-surface2/60 p-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
                <ShieldCheck size={12} />
                {t('exercise.lumbarAdaptation')}
              </p>
              <p className="text-[13px] text-muted">{exercise.technique.lumbarAdaptation}</p>
            </div>
          )}

          <div className="mt-2.5">
            <p className="mb-1 text-[11px] tracking-wide text-faint uppercase">
              {t('exercise.whenToReduce')}
            </p>
            <ul className="space-y-1">
              {[
                t('ex.reduce1'),
                t('ex.reduce2'),
                t('ex.reduce3'),
                t('ex.reduce4'),
              ].map((line) => (
                <li key={line} className="flex gap-2 text-[13px] text-muted">
                  <span className="mt-1.5 block size-1 shrink-0 rounded-full bg-current opacity-50" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {alternatives.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] tracking-wide text-faint uppercase">
                {t('exercise.saferAlternatives')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {alternatives.map((alt) => (
                  <Chip key={alt.id} onClick={onSelect ? () => onSelect(alt.id) : undefined}>
                    {alt.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => toggleAvoided(exercise.id)}
            className={cx(
              'pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium',
              isAvoided
                ? 'border-brand/30 bg-brand/12 text-brand'
                : 'border-line bg-surface2 text-muted',
            )}
          >
            <XCircle size={14} />
            {isAvoided ? t('exercise.avoiding') : t('exercise.avoidForNow')}
          </button>

          <p className="mt-2 text-[11px] text-faint">
            {t('ex.lumbarDisclaimer')}
          </p>
        </div>
      </div>
    </Card>
  );
}
