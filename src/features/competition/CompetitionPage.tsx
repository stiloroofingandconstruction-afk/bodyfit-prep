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
import { ProjectionText } from './ProjectionText';
import { phaseFocus, phaseLabel } from '@/i18n/labels';
import { friendlyDate, startOfWeek, today } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import {
  useActivePrep,
  useCountdown,
  useProjection,
  useWeekActivity,
  useWeightTrend,
} from '@/store/selectors';
import { useSettingsStore } from '@/store/settingsStore';
import { t, type Dict } from '@/i18n';

const LINKS: { to: string; label: keyof Dict; detail: keyof Dict; Icon: typeof Sunrise }[] = [
  { to: '/diario', label: 'comp.linkDaily', detail: 'comp.linkDailyDesc', Icon: Sunrise },
  { to: '/cardio', label: 'cardio.title', detail: 'cardio.subtitle', Icon: Footprints },
  { to: '/posing', label: 'posing.title', detail: 'comp.linkPosingDesc', Icon: PersonStanding },
  { to: '/fotos', label: 'photos.title', detail: 'comp.linkPhotosDesc', Icon: Camera },
  { to: '/checkin', label: 'screen.checkin', detail: 'comp.linkCheckinDesc', Icon: CalendarCheck },
  { to: '/competencia/peak-week', label: 'screen.peakWeek', detail: 'comp.linkPeakDesc', Icon: ListChecks },
  { to: '/competencia/dia-del-show', label: 'screen.showDay', detail: 'comp.linkShowDesc', Icon: Trophy },
  { to: '/competencia/post-show', label: 'screen.postShow', detail: 'comp.linkPostDesc', Icon: Activity },
  { to: '/informes', label: 'screen.reports', detail: 'comp.linkReportsDesc', Icon: CalendarDays },
];

export default function CompetitionPage() {
  const prep = useActivePrep();
  const cd = useCountdown();
  const trend = useWeightTrend();
  const projection = useProjection();
  const week = useWeekActivity(startOfWeek(today()));
  const competitionMode = useSettingsStore((s) => s.competitionMode);
  const u = useUnits();
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!prep || !competitionMode) {
    return (
      <>
        <PageHeader title={t('prep.title')} subtitle={t('comp.subtitle')} />
        <Page>
          <EmptyState
            icon={<Trophy size={22} />}
            title={t('prep.noPrep')}
            description={t('comp.noPrepDesc')}
            action={
              <Button variant="primary" size="lg" onClick={() => setCreating(true)}>
                <Sparkles size={17} />
                {t('prep.activate')}
              </Button>
            }
          />
          <Card className="mt-4">
            <p className="text-[13px] text-muted">
              {t('comp.parallelNote')}
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
            aria-label={t('comp.editPrep')}
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
              <span className="text-[30px] leading-[1.1] font-bold tabular">
                {cd ? Math.max(0, cd.daysOut) : 0}
              </span>
              <span className="mt-0.5 text-[10px] tracking-wider text-faint uppercase">
                {cd && cd.daysOut < 0 ? t('comp.daysAfter') : t('comp.days')}
              </span>
            </Ring>

            <div className="min-w-0 flex-1">
              <p className={cx('text-[17px] font-bold', cd?.phase.tone)}>
                {cd ? phaseLabel(cd.phase) : ''}
              </p>
              <p className="mt-1 text-[13px] text-muted">{cd ? phaseFocus(cd.phase) : ''}</p>
              <p className="mt-2 text-[12px] tabular text-faint">
                {cd && cd.weeksOut > 0
                  ? cd.extraDays
                    ? t('comp.weeksAndDays', { weeks: cd.weeksOut, days: cd.extraDays })
                    : t('comp.weeksLeft', { weeks: cd.weeksOut })
                  : cd?.daysOut === 0
                    ? t('comp.todayIsTheDay')
                    : t('comp.showFinished')}
                {' · '}
                {friendlyDate(prep.showDate)}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1.5 flex justify-between text-[11px] text-faint">
              <span>{t('comp.startedOn', { date: friendlyDate(prep.prepStartDate) })}</span>
              <span>{t('comp.prepProgress', { pct: cd?.progressPct ?? 0 })}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${cd?.progressPct ?? 0}%` }} />
            </div>
          </div>
        </Card>

        {/* ─────────────────────────────────────────── estado */}
        <div className="mt-3">
          <SectionTitle>{t('comp.state')}</SectionTitle>
          <Card>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <Stat
                label={t('daily.avg7')}
                value={trend.avg7 != null ? u.numWeight(trend.avg7) : '—'}
                unit={u.w}
              />
              <Stat
                label={t('daily.weekChange')}
                value={trend.weekChange != null ? u.fmtWeightDelta(trend.weekChange).replace(` ${u.w}`, '') : '—'}
                unit={u.w}
              />
              <Stat
                label={t('home.target')}
                value={prep.targetWeight ? u.numWeight(prep.targetWeight) : '—'}
                unit={u.w}
              />
            </div>

            {projection && (
              <div className="rounded-2xl border border-line bg-surface2 p-3">
                <ProjectionText projection={projection} />
              </div>
            )}
          </Card>
        </div>

        {/* ─────────────────────────────────────────── semana */}
        <div className="mt-3">
          <SectionTitle>{t('comp.thisWeek')}</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat label={t('daily.cardio')} value={week.cardioMinutes} unit={t('cardio.min')} />
              <Stat label={t('comp.stepsPerDay')} value={week.avgSteps || '—'} />
              <Stat label={t('posing.title')} value={week.posingMinutes} unit={t('cardio.min')} />
            </div>
          </Card>
        </div>

        {/* ─────────────────────────────────────────── modulos */}
        <div className="mt-5">
          <SectionTitle>{t('comp.modules')}</SectionTitle>
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
                  <p className="truncate text-[15px] font-medium">{t(label)}</p>
                  <p className="truncate text-[12px] text-faint">{t(detail)}</p>
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
              {t('disclaimer.medical')} {t('disclaimer.local')}
            </p>
          </div>
        </Card>
      </Page>

      <PrepSetupSheet open={editing} onClose={() => setEditing(false)} existing={prep} />
    </>
  );
}
