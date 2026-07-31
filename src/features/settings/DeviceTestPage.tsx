import { useState } from 'react';
import { Check, Info, Printer, RotateCcw } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CHECKLIST_ITEM_COUNT, DEVICE_CHECKLIST } from '@/data/deviceChecklist';
import { useDeviceTestStore } from '@/store/deviceTestStore';
import { fmtDateTime } from '@/lib/date';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

/**
 * Lista de comprobacion para el iPhone real.
 *
 * Todas las casillas empiezan vacias y solo las marca una persona. La app no
 * da por aprobado nada que dependa de un dispositivo fisico: seria mentir sobre
 * la unica parte de la validacion que no puede hacer sola.
 */
export default function DeviceTestPage() {
  const { checked, toggle, reset, checkedAt } = useDeviceTestStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / CHECKLIST_ITEM_COUNT) * 100);

  return (
    <>
      <PageHeader
        back
        title={t('dev.title')}
        subtitle={t('dev.subtitle', { done, total: CHECKLIST_ITEM_COUNT })}
      />

      <Page>
        <Card>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{t('dev.progress')}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {checkedAt ? t('dev.lastMark', { date: fmtDateTime(checkedAt) }) : t('dev.noChecks')}
              </p>
            </div>
            <p className="tabular text-[20px] leading-[1.1] font-semibold text-brand">{pct}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(1, pct)}%` }} />
          </div>

          <div className="mt-4 flex gap-2 rounded-2xl border border-line bg-surface2 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-faint" />
            <p className="text-[12px] leading-relaxed text-muted">
              {t('dev.manualOnly')}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              {t('dev.print')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                toast(t('dev.resetDone'));
              }}
            >
              <RotateCcw size={16} />
              {t('dev.reset')}
            </Button>
          </div>
        </Card>

        {DEVICE_CHECKLIST.map((group) => {
          const groupDone = group.items.filter((i) => checked[i.id]).length;
          return (
            <div key={group.id} className="mt-5">
              <SectionTitle>
                {group.title} · {groupDone}/{group.items.length}
              </SectionTitle>
              <Card padded={false}>
                <ul className="divide-y divide-line">
                  {group.items.map((item) => {
                    const on = Boolean(checked[item.id]);
                    const open = expanded === item.id;
                    return (
                      <li key={item.id}>
                        <div className="flex items-start gap-3 px-3.5 py-3">
                          <button
                            onClick={() => toggle(item.id)}
                            role="checkbox"
                            aria-checked={on}
                            aria-label={item.title}
                            className={`pressable mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              on ? 'border-brand bg-brand text-base' : 'border-line2 bg-surface2'
                            }`}
                          >
                            {on && <Check size={14} />}
                          </button>
                          <button
                            onClick={() => setExpanded(open ? null : item.id)}
                            className="min-w-0 flex-1 text-left"
                            aria-expanded={open}
                          >
                            <p className={`text-[14px] leading-snug ${on ? 'text-faint line-through' : ''}`}>
                              {item.title}
                            </p>
                            {!open && (
                              <p className="mt-0.5 truncate text-[12px] text-faint">{item.how}</p>
                            )}
                          </button>
                        </div>

                        {open && (
                          <div className="space-y-2 px-3.5 pb-3.5 pl-[3.25rem] text-[12px] leading-relaxed">
                            <Field label={t('dev.how')} value={item.how} />
                            <Field label={t('dev.expected')} value={item.expected} />
                            <Field label={t('dev.whyManual')} value={item.whyManual} muted />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          );
        })}

        <p className="mt-5 text-center text-[11px] text-faint">
          {t('dev.fullGuide')}
        </p>
      </Page>
    </>
  );
}

function Field({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <p className={muted ? 'text-faint' : 'text-muted'}>
      <span className="text-[11px] tracking-wide text-faint uppercase">{label}: </span>
      {value}
    </p>
  );
}
