import { projectionLabel } from '@/i18n/labels';
import { useUnits } from '@/lib/useUnits';
import { cx } from '@/lib/utils';
import { PROJECTION_TONE, type Projection } from '@/domain/competition';
import { t } from '@/i18n';

/**
 * Explicacion de la proyeccion al show.
 *
 * El dominio devuelve los numeros en kg y en forma estructurada; aqui se
 * traducen y se convierten a las unidades del usuario. Antes la frase venia ya
 * montada desde el dominio, siempre en espanol y siempre en kg, aunque el
 * usuario tuviera la app en libras.
 */
export function ProjectionText({ projection }: { projection: Projection }) {
  const u = useUnits();
  const d = projection.detail;

  const body =
    d.kind === 'no-data'
      ? t('proj.noData', { n: d.daysLogged })
      : d.kind === 'no-target'
        ? t('proj.noTarget', {
            pace: u.fmtWeightDelta(d.weeklyKg, 2),
            weight: u.fmtWeight(d.projectedKg),
          })
        : t('proj.full', {
            avg: u.fmtWeight(d.avgKg),
            pace: u.fmtWeightDelta(d.weeklyKg, 2),
            required: u.fmtWeightDelta(d.requiredWeeklyKg, 2),
            weeks: d.weeksLeft.toFixed(1),
            projected: u.fmtWeight(d.projectedKg),
            gap: u.fmtWeight(d.gapKg),
            direction: d.above ? t('proj.above') : t('proj.below'),
          });

  return (
    <>
      <p className={cx('text-[13px] font-semibold', PROJECTION_TONE[projection.status])}>
        {projectionLabel(projection.status)}
      </p>
      <p className="mt-1 text-[12px] text-muted">{body}</p>
    </>
  );
}
