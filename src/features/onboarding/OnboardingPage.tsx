import { useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, NumberField, Segmented, Select, Slider } from '@/components/ui/Field';
import { ACTIVITY_LEVELS, computeTargets } from '@/domain/energy';
import { activityLabel } from '@/i18n/labels';
import { parseBackup, restoreBackup } from '@/services/backup';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';
import { toISODate } from '@/lib/date';
import { cx } from '@/lib/utils';
import { makeUnits } from '@/lib/useUnits';
import { DEFAULT_PROFILE, useProfileStore } from '@/store/profileStore';
import { useBodyStore } from '@/store/bodyStore';
import { usePrepStore } from '@/store/prepStore';
import { useSettingsStore, type Experience } from '@/store/settingsStore';
import { addDays } from '@/lib/date';
import type { ActivityLevel, Goal, Profile, Sex } from '@/domain/types';
import type { Division } from '@/domain/competition';
import type { WeightUnit } from '@/domain/units';

/** Solo dibuja la barra de progreso: de estos pasos no se muestra ningun texto. */
const STEP_COUNT = 5;

export default function OnboardingPage() {
  const complete = useProfileStore((s) => s.completeOnboarding);
  const upsertBody = useBodyStore((s) => s.upsert);
  const updateSettings = useSettingsStore((s) => s.update);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const createPrep = usePrepStore((s) => s.createPrep);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [weight, setWeight] = useState(80);

  /* Competencia */
  const [purpose, setPurpose] = useState<'recreativo' | 'competencia'>('recreativo');
  const [experience, setExperience] = useState<Experience>('intermedio');
  const [trainingDays, setTrainingDays] = useState(4);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [showName, setShowName] = useState('');
  const [division, setDivision] = useState<Division>("Men's Physique");
  const [showDate, setShowDate] = useState(addDays(toISODate(), 112));
  const [discomforts, setDiscomforts] = useState('');

  /* Restaurar una copia sin haber completado el onboarding */
  const restoreRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  // El onboarding aun no ha guardado la preferencia, asi que construye el API
  // de unidades con lo que el usuario acaba de elegir en el paso anterior.
  const u = makeUnits(weightUnit, weightUnit === 'kg' ? 'cm' : 'in');

  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const targets = computeTargets(draft, weight);

  const finish = () => {
    complete({ ...draft, startWeight: weight });
    upsertBody({ date: toISODate(), weight });

    setUnits({ weightUnit });
    updateSettings({
      experience,
      trainingDaysPerWeek: trainingDays,
      competitionMode: purpose === 'competencia',
      division,
      discomforts: discomforts.split(',').map((s) => s.trim()).filter(Boolean),
    });

    // Solo se crea la competencia si el usuario dio una fecha; todo es omitible
    if (purpose === 'competencia' && showName.trim()) {
      createPrep({
        showName: showName.trim(),
        federation: 'Otra',
        division,
        category: '',
        showDate,
        prepStartDate: toISODate(),
        startWeight: weight,
        status: 'activo',
      });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* <main> y no <div>: sin landmark principal, un lector de pantalla no
          tiene forma de saltar directo al contenido. */}
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-6">
        {/* Progreso */}
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <div
              key={i}
              className={cx(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-brand' : 'bg-line',
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="fade-enter flex flex-col items-center pt-10 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-brand">
              <svg viewBox="0 0 24 24" className="size-11 -rotate-45" fill="none">
                <path
                  d="M3 12h18M6 8v8M18 8v8M4 10v4M20 10v4"
                  stroke="#0B0F14"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-[32px] leading-tight font-bold tracking-tight">BodyFit Prep</h1>
            <p className="mt-3 max-w-xs text-[15px] text-muted">
              {t('ob.tagline')}
            </p>

            <ul className="mt-8 w-full space-y-3 text-left">
              {[
                t('ob.feature1'),
                t('ob.feature2'),
                t('ob.feature3'),
                t('ob.feature4'),
                t('ob.feature5'),
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px] text-muted">
                  <Check size={17} className="mt-0.5 shrink-0 text-brand" />
                  {f}
                </li>
              ))}
            </ul>

            {/*
              Punto de entrada para restaurar.

              Sin esto, alguien que cambia de telefono queda atrapado: la app
              recien instalada no tiene perfil, asi que muestra el onboarding y
              no deja llegar a Ajustes → Datos y respaldo, que es justo donde
              esta el boton de restaurar.
            */}
            <div className="mt-8 w-full border-t border-line pt-5 text-center">
              <p className="text-[13px] text-muted">{t('ob.hasBackup')}</p>
              <button
                onClick={() => restoreRef.current?.click()}
                disabled={restoring}
                className="pressable mt-2 text-[14px] font-medium text-brand disabled:opacity-50"
              >
                {restoring ? t('ob.restoring') : t('ob.restore')}
              </button>
              <input
                ref={restoreRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label={t('ob.restore')}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setRestoring(true);
                  try {
                    const report = parseBackup(await file.text());
                    if (!report.ok) {
                      toast(report.errors[0] ?? t('ob.restoreFailed'), 'error');
                      return;
                    }
                    await restoreBackup(report);
                    toast(t('data.restore.done'));
                    setTimeout(() => window.location.reload(), 900);
                  } catch {
                    toast(t('ob.restoreFailed'), 'error');
                  } finally {
                    setRestoring(false);
                  }
                }}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.purposeTitle')}</h2>
              <p className="mt-1 text-[14px] text-muted">
                {t('ob.purposeHint')}
              </p>
            </div>

            <div className="space-y-2">
              {(
                [
                  ['recreativo', t('ob.purposeRecreational'), t('ob.purposeRecreationalDesc')],
                  ['competencia', t('ob.purposeCompetition'), t('ob.purposeCompetitionDesc')],
                ] as ['recreativo' | 'competencia', string, string][]
              ).map(([value, title, desc]) => (
                <button
                  key={value}
                  onClick={() => setPurpose(value)}
                  className={cx(
                    'pressable w-full rounded-2xl border p-4 text-left transition-colors',
                    purpose === value ? 'border-brand bg-brand/10' : 'border-line bg-surface',
                  )}
                >
                  <p className={cx('text-[16px] font-semibold', purpose === value && 'text-brand')}>
                    {title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">{desc}</p>
                </button>
              ))}
            </div>

            {purpose === 'competencia' && (
              <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
                <div>
                  <Label hint={t('ob.showNameHint')}>{t('prep.showName')}</Label>
                  <Input
                    value={showName}
                    onChange={(e) => setShowName(e.target.value)}
                    placeholder={t('ob.showNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('prep.division')}</Label>
                  <Select aria-label={t('prep.division')} value={division} onChange={(e) => setDivision(e.target.value as Division)}>
                    {(
                      [
                        "Men's Physique", 'Classic Physique', 'Bodybuilding',
                        'Bikini', 'Wellness', 'Figure', 'Womens Physique',
                      ] as Division[]
                    ).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>{t('prep.showDate')}</Label>
                  <Input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <Label>{t('field.experience')}</Label>
              <Select aria-label={t('field.experience')} value={experience} onChange={(e) => setExperience(e.target.value as Experience)}>
                <option value="principiante">{t('exp.beginner')}</option>
                <option value="intermedio">{t('exp.intermediate')}</option>
                <option value="avanzado">{t('exp.advanced')}</option>
                <option value="competidor">{t('exp.competitor')}</option>
              </Select>
            </div>

            <div>
              <Label hint={t('field.days', { n: trainingDays })}>{t('field.trainingDaysWeek')}</Label>
              <Slider
                aria-label={t('field.trainingDaysWeek')}
                value={trainingDays}
                onChange={setTrainingDays}
                min={1}
                max={7}
                step={1}
                labels={['1', '4', '7']}
              />
            </div>

            <div>
              <Label>{t('ob.weightUnits')}</Label>
              <Segmented
                value={weightUnit}
                onChange={setWeightUnit}
                options={[
                  { value: 'kg', label: t('units.kg') },
                  { value: 'lb', label: t('units.lb') },
                ]}
              />
            </div>

            <div>
              <Label hint={t('ob.discomfortsHint')}>{t('ob.discomforts')}</Label>
              <Input
                value={discomforts}
                onChange={(e) => setDiscomforts(e.target.value)}
                placeholder={t('field.discomfortsPlaceholder')}
              />
              <p className="mt-1.5 text-[11px] text-faint">
                {t('ob.discomfortsNote')}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.dataTitle')}</h2>
              <p className="mt-1 text-[14px] text-muted">
                {t('ob.dataHint')}
              </p>
            </div>

            <div>
              <Label>{t('ob.nameQuestion')}</Label>
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('field.yourName')} />
            </div>

            <div>
              <Label>{t('field.sex')}</Label>
              <Segmented
                value={draft.sex}
                onChange={(v: Sex) => set({ sex: v })}
                options={[
                  { value: 'hombre', label: t('field.male') },
                  { value: 'mujer', label: t('field.female') },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('field.birth')}</Label>
                <Input
                  type="date"
                  value={draft.birthDate}
                  max={toISODate()}
                  onChange={(e) => set({ birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('field.height')}</Label>
                <NumberField
                  aria-label={t('field.height')}
                  value={u.toDisplayLength(draft.heightCm)}
                  decimals={u.lengthUnit === 'cm' ? 0 : 1}
                  // Vaciarlo no borra la altura: al salir del campo vuelve la
                  // ultima valida. Sin altura no hay calculo de macros.
                  onChange={(v) => {
                    if (v != null && v > 0) set({ heightCm: u.toCanonicalLength(v) });
                  }}
                  suffix={u.l}
                />
              </div>
            </div>

            <div>
              <Label hint={u.fmtWeight(weight)}>{t('field.currentWeight')}</Label>
              <Slider
                aria-label={t('field.currentWeight')}
                value={u.toDisplayWeight(weight)}
                onChange={(v) => setWeight(u.toCanonicalWeight(v))}
                min={u.weightUnit === 'kg' ? 40 : 88}
                max={u.weightUnit === 'kg' ? 180 : 397}
                step={u.weightUnit === 'kg' ? 0.5 : 1}
                labels={
                  u.weightUnit === 'kg' ? ['40', '110', '180'] : ['88', '242', '397']
                }
              />
            </div>

            <div>
              <Label>{t('field.activity')}</Label>
              <Select aria-label={t('field.activity')} value={draft.activity} onChange={(e) => set({ activity: e.target.value as ActivityLevel })}>
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {activityLabel(level)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.goalTitle')}</h2>
              <p className="mt-1 text-[14px] text-muted">{t('ob.goalHint')}</p>
            </div>

            <div className="space-y-2">
              {(
                [
                  ['definicion', t('goal.cut'), t('goal.cutDesc')],
                  ['mantenimiento', t('goal.maintain'), t('goal.maintainDesc')],
                  ['volumen', t('goal.bulk'), t('goal.bulkDesc')],
                ] as [Goal, string, string][]
              ).map(([value, title, desc]) => (
                <button
                  key={value}
                  onClick={() => set({ goal: value })}
                  className={cx(
                    'pressable w-full rounded-2xl border p-4 text-left transition-colors',
                    draft.goal === value ? 'border-brand bg-brand/10' : 'border-line bg-surface',
                  )}
                >
                  <p className={cx('text-[16px] font-semibold', draft.goal === value && 'text-brand')}>
                    {title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">{desc}</p>
                </button>
              ))}
            </div>

            {draft.goal !== 'mantenimiento' && (
              <div>
                <Label hint={`${u.fmtWeight((weight * draft.paceWeekPct) / 100, 2)} / ${t('common.week').toLowerCase()}`}>
                  {t('field.pace')}
                </Label>
                <Slider
                  aria-label={t('field.pace')}
                  value={draft.paceWeekPct}
                  onChange={(v) => set({ paceWeekPct: v })}
                  min={0.25}
                  max={1}
                  step={0.05}
                  labels={[t('field.paceSlow'), t('field.paceModerate'), t('field.paceAggressive')]}
                />
              </div>
            )}

            <div>
              <Label hint={t('field.goalWeightHint')}>{t('field.goalWeight')}</Label>
              <NumberField
                aria-label={t('field.goalWeight')}
                value={draft.goalWeight != null ? u.toDisplayWeight(draft.goalWeight) : null}
                onChange={(v) =>
                  set({ goalWeight: v != null && v > 0 ? u.toCanonicalWeight(v) : undefined })
                }
                suffix={u.w}
                placeholder="—"
              />
              <p className="mt-1.5 text-[11px] text-faint">{t('field.goalWeightNote')}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.macrosTitle')}</h2>
              <p className="mt-1 text-[14px] text-muted">
                {t('ob.macrosHint')}
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 text-center">
              <p className="text-[11px] tracking-wider text-faint uppercase">{t('ob.dailyTarget')}</p>
              <p className="mt-1 text-[44px] leading-[1.1] font-bold tabular text-brand">{targets.kcal}</p>
              <p className="text-[12px] text-faint">kcal</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
                <div>
                  <p className="text-[18px] font-semibold tabular text-protein">{targets.protein}g</p>
                  <p className="text-[11px] text-faint">{t('field.protein')}</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-carbs">{targets.carbs}g</p>
                  <p className="text-[11px] text-faint">{t('field.carbs')}</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-fat">{targets.fat}g</p>
                  <p className="text-[11px] text-faint">{t('field.fat')}</p>
                </div>
              </div>
            </div>

            <div>
              <Label
                hint={`${u.toDisplayPerWeight(draft.proteinPerKg).toFixed(2)} ${u.perW}`}
              >
                {t('field.perWeightUnit', { unit: t('field.protein') })}
              </Label>
              <Slider
                aria-label={t('field.perWeightUnit', { unit: t('field.protein') })}
                value={u.toDisplayPerWeight(draft.proteinPerKg)}
                onChange={(v) => set({ proteinPerKg: u.toCanonicalPerWeight(v) })}
                {...u.perWeightRange(1.2, 3)}
                labels={[
                  u.toDisplayPerWeight(1.2).toFixed(2),
                  u.toDisplayPerWeight(2.1).toFixed(2),
                  u.toDisplayPerWeight(3).toFixed(2),
                ]}
              />
            </div>
            <div>
              <Label hint={`${u.toDisplayPerWeight(draft.fatPerKg).toFixed(2)} ${u.perW}`}>
                {t('field.perWeightUnit', { unit: t('field.fat') })}
              </Label>
              <Slider
                aria-label={t('field.perWeightUnit', { unit: t('field.fat') })}
                value={u.toDisplayPerWeight(draft.fatPerKg)}
                onChange={(v) => set({ fatPerKg: u.toCanonicalPerWeight(v) })}
                {...u.perWeightRange(0.5, 1.5)}
                labels={[
                  u.toDisplayPerWeight(0.5).toFixed(2),
                  u.toDisplayPerWeight(1).toFixed(2),
                  u.toDisplayPerWeight(1.5).toFixed(2),
                ]}
              />
            </div>

            <p className="text-[12px] text-faint">
              {t('ob.carbsNote')}
            </p>
          </div>
        )}
      </main>

      <div className="safe-bottom mx-auto w-full max-w-lg px-5 pb-4">
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
              {t('ob.back')}
            </Button>
          )}
          {step < STEP_COUNT - 1 ? (
            <Button variant="primary" size="lg" block onClick={() => setStep((s) => s + 1)}>
              {t('ob.continue')}
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" size="lg" block onClick={finish}>
              {t('ob.start')}
              <ArrowRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
