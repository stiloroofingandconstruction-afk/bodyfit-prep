import { useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label, NumberField, Segmented, Slider } from '@/components/ui/Field';
import { computeTargets } from '@/domain/energy';
import { parseBackup, restoreBackup } from '@/services/backup';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';
import { toISODate } from '@/lib/date';
import { cx } from '@/lib/utils';
import { makeUnits } from '@/lib/useUnits';
import { DEFAULT_PROFILE, useProfileStore } from '@/store/profileStore';
import { useBodyStore } from '@/store/bodyStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Goal, Profile, Sex } from '@/domain/types';
import type { WeightUnit, LengthUnit } from '@/domain/units';

/**
 * Onboarding en tres preguntas.
 *
 * Antes preguntaba doce cosas repartidas en cinco pantallas: division, nombre
 * del show, experiencia, dias de entrenamiento, molestias, nivel de actividad,
 * ritmo, proteina y grasa por kilo. Nada de eso hace falta para dibujar la
 * primera pantalla, y todo se puede cambiar despues en Ajustes.
 *
 * Aqui solo se pide lo que no se puede deducir de ninguna otra forma: sexo y
 * edad, altura y peso, y hacia donde vas. El resto arranca con valores
 * razonables y se afina cuando el usuario tenga motivos para hacerlo.
 */
const QUESTIONS = 3;

/**
 * Sistema de unidades segun el idioma del telefono.
 *
 * Un usuario en Estados Unidos que ve kilogramos en la primera pantalla piensa
 * que la app no es para el. Es la unica preferencia que se puede acertar sin
 * preguntar, asi que se acierta y se deja de preguntar.
 */
function localeUnits(): { weightUnit: WeightUnit; lengthUnit: LengthUnit } {
  const tag = typeof navigator !== 'undefined' ? navigator.language : 'es';
  const imperial = /^en-(US|LR|MM)\b/i.test(tag);
  return imperial ? { weightUnit: 'lb', lengthUnit: 'in' } : { weightUnit: 'kg', lengthUnit: 'cm' };
}

export default function OnboardingPage() {
  const complete = useProfileStore((s) => s.completeOnboarding);
  const upsertBody = useBodyStore((s) => s.upsert);
  const setUnits = useSettingsStore((s) => s.setUnits);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [weight, setWeight] = useState(DEFAULT_PROFILE.startWeight);
  const [units] = useState(localeUnits);

  /* Restaurar una copia sin haber completado el onboarding */
  const restoreRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  const u = makeUnits(units.weightUnit, units.lengthUnit);
  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const targets = computeTargets(draft, weight);

  const finish = () => {
    setUnits(units);
    complete({ ...draft, startWeight: weight });
    upsertBody({ date: toISODate(), weight });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* <main> y no <div>: sin landmark principal, un lector de pantalla no
          tiene forma de saltar directo al contenido. */}
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-6">
        {/* La bienvenida no cuenta como pregunta: la barra mide las tres que hay */}
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: QUESTIONS }, (_, i) => (
            <div
              key={i}
              className={cx(
                'h-1 flex-1 rounded-full transition-colors',
                i < step ? 'bg-brand' : 'bg-line',
              )}
            />
          ))}
        </div>

        {/* ──────────────────────────────────────────────── bienvenida ── */}
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
            <p className="mt-3 max-w-xs text-[15px] text-muted">{t('ob.tagline')}</p>

            <ul className="mt-8 w-full space-y-3 text-left">
              {[t('ob.feature1'), t('ob.feature2'), t('ob.feature3')].map((f) => (
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

        {/* ───────────────────────────────────────── 1 · quien eres ── */}
        {step === 1 && (
          <div className="fade-enter space-y-6">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.q1Title')}</h2>
              <p className="mt-1 text-[14px] text-muted">{t('ob.q1Hint')}</p>
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

            <div>
              <Label>{t('field.birth')}</Label>
              <input
                type="date"
                aria-label={t('field.birthDate')}
                value={draft.birthDate}
                max={toISODate()}
                onChange={(e) => set({ birthDate: e.target.value })}
                className="h-12 w-full rounded-2xl border border-line bg-surface2 px-3.5 text-[15px] outline-none transition-colors focus:border-brand/60"
              />
            </div>
          </div>
        )}

        {/* ───────────────────────────── 2 · cuanto mides y pesas ── */}
        {step === 2 && (
          <div className="fade-enter space-y-6">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.q2Title')}</h2>
              <p className="mt-1 text-[14px] text-muted">{t('ob.q2Hint')}</p>
            </div>

            <div>
              <Label>{t('field.height')}</Label>
              <NumberField
                aria-label={t('field.height')}
                value={u.toDisplayLength(draft.heightCm)}
                decimals={u.lengthUnit === 'cm' ? 0 : 1}
                onChange={(v) => {
                  if (v != null && v > 0) set({ heightCm: u.toCanonicalLength(v) });
                }}
                suffix={u.l}
              />
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
                labels={u.weightUnit === 'kg' ? ['40', '110', '180'] : ['88', '242', '397']}
              />
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────── 3 · que buscas ── */}
        {step === 3 && (
          <div className="fade-enter space-y-6">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">{t('ob.q3Title')}</h2>
              <p className="mt-1 text-[14px] text-muted">{t('ob.q3Hint')}</p>
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
                  <p
                    className={cx('text-[16px] font-semibold', draft.goal === value && 'text-brand')}
                  >
                    {title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">{desc}</p>
                </button>
              ))}
            </div>

            {/*
              El objetivo calculado se muestra como resultado, no como un paso
              mas que rellenar: quien quiera afinar proteina y grasa lo hara en
              Ajustes, y quien no, arranca con un plan correcto sin tocar un
              solo control.
            */}
            <div className="rounded-3xl border border-line bg-surface p-5 text-center">
              <p className="text-[11px] tracking-wider text-faint uppercase">
                {t('ob.resultTitle')}
              </p>
              <p className="mt-1 text-[44px] leading-[1.1] font-bold tabular text-brand">
                {targets.kcal}
              </p>
              <p className="text-[12px] text-faint">kcal</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
                <div>
                  <p className="text-[18px] font-semibold tabular text-protein">
                    {targets.protein} g
                  </p>
                  <p className="text-[11px] text-faint">{t('field.protein')}</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-carbs">{targets.carbs} g</p>
                  <p className="text-[11px] text-faint">{t('field.carbs')}</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-fat">{targets.fat} g</p>
                  <p className="text-[11px] text-faint">{t('field.fat')}</p>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-faint">{t('ob.resultNote')}</p>
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
          {step < QUESTIONS ? (
            <Button variant="primary" size="lg" block onClick={() => setStep((s) => s + 1)}>
              {t('ob.continue')}
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" size="lg" block onClick={finish}>
              {t('ob.finish')}
              <ArrowRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
