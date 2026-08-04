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
import { t } from '@/i18n';
import type { ChecklistItem, ShowDayItem } from '@bodyfit/domain/prepTypes';

/*
 * El cronograma y la lista se crean UNA vez, en el idioma activo en ese
 * momento, y a partir de ahi son datos del usuario: puede editarlos, anadir y
 * borrar. Por eso se traducen al sembrarlos y no en cada render.
 */
function defaultSchedule(): Omit<ShowDayItem, 'id' | 'done'>[] {
  return [
    { time: '05:30', label: t('show.s1'), detail: t('show.s1d') },
    { time: '06:00', label: t('show.s2'), detail: t('show.s2d') },
    { time: '07:00', label: t('show.s3') },
    { time: '08:00', label: t('show.s4'), detail: t('show.s4d') },
    { time: '08:30', label: t('show.s5'), detail: t('show.s5d') },
    { time: '09:00', label: t('show.s6') },
    { time: '10:00', label: t('show.s7'), detail: t('show.s7d') },
    { time: '10:30', label: t('show.s8'), detail: t('show.s8d') },
    { time: '11:00', label: t('show.s9'), detail: t('show.s9d') },
    { time: '14:00', label: t('show.s10') },
    { time: '17:00', label: t('show.s11'), detail: t('show.s11d') },
  ];
}

function defaultChecklist(): string[] {
  return [
    t('show.c1'), t('show.c2'), t('show.c3'), t('show.c4'),
    t('show.c5'), t('show.c6'), t('show.c7'), t('show.c8'),
    t('show.c9'), t('show.c10'), t('show.c11'), t('show.c12'),
  ];
}

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
        schedule: defaultSchedule().map((s) => ({ ...s, id: uid(), done: false })),
        checklist: defaultChecklist().map((label) => ({ id: uid(), label, done: false })),
      });
    }
  }, [prep, plan, saveShowDay]);

  if (!prep) {
    return (
      <>
        <PageHeader title={t('screen.showDay')} back />
        <Page>
          <EmptyState
            title={t('prep.noPrep')}
            description={t('show.noPrepDesc')}
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
        title={t('screen.showDay')}
        subtitle={`${friendlyDate(prep.showDate)} · ${prep.showName}`}
        back
      />

      <Page>
        <Card className="border-brand/25 bg-brand/8">
          <div className="flex gap-2.5">
            <WifiOff size={15} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[13px] text-muted">
              {t('show.offlineNote')}
            </p>
          </div>
        </Card>

        {/* ───────────────────────────────────── datos del dia */}
        <div className="mt-4">
          <SectionTitle>{t('show.data')}</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('show.venue')}</Label>
                <Input
                  aria-label={t('show.venue')}
                  value={plan.venue ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { venue: e.target.value })}
                  placeholder={t('show.venuePlaceholder')}
                />
              </div>
              <div>
                <Label>{t('show.competitorNumber')}</Label>
                <Input
                  aria-label={t('show.competitorNumber')}
                  value={plan.competitorNumber ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { competitorNumber: e.target.value })}
                  placeholder="—"
                />
              </div>
              <div>
                <Label>{t('show.arrivalTime')}</Label>
                <Input
                  aria-label={t('show.arrivalTime')}
                  type="time"
                  value={plan.arrivalTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { arrivalTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('show.checkin')}</Label>
                <Input
                  aria-label={t('show.checkinTime')}
                  type="time"
                  value={plan.checkInTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { checkInTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('show.tanning')}</Label>
                <Input
                  aria-label={t('show.tanningTime')}
                  type="time"
                  value={plan.tanningTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { tanningTime: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('show.categoryTime')}</Label>
                <Input
                  aria-label={t('show.categoryTime')}
                  type="time"
                  value={plan.categoryTime ?? ''}
                  onChange={(e) => updateShowDay(plan.id, { categoryTime: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label hint={t('show.musicHint')}>{t('show.routineMusic')}</Label>
              <Input
                aria-label={t('show.routineMusic')}
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
            {t('show.schedule')}
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
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              aria-label={t('show.newTime')}
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32 shrink-0"
            />
            <Input
              aria-label={t('show.newDescription')}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t('show.addToSchedule')}
            />
            <Button
              aria-label={t('show.addToSchedule')}
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
            {t('show.whatToBring')}
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
          <SectionTitle>{t('common.notes')}</SectionTitle>
          <textarea
            value={plan.notes ?? ''}
            onChange={(e) => updateShowDay(plan.id, { notes: e.target.value })}
            rows={4}
            placeholder={t('show.notesPlaceholder')}
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>
      </Page>
    </>
  );
}
