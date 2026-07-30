import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, Segmented, Select, Slider } from '@/components/ui/Field';
import { ACTIVITY_LABEL } from '@/domain/energy';
import { computeTargets } from '@/domain/energy';
import { toISODate } from '@/lib/date';
import { cx } from '@/lib/utils';
import { DEFAULT_PROFILE, useProfileStore } from '@/store/profileStore';
import { useBodyStore } from '@/store/bodyStore';
import type { ActivityLevel, Goal, Profile, Sex } from '@/domain/types';

const STEPS = ['Bienvenida', 'Tus datos', 'Objetivo', 'Macros'];

export default function OnboardingPage() {
  const complete = useProfileStore((s) => s.completeOnboarding);
  const upsertBody = useBodyStore((s) => s.upsert);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [weight, setWeight] = useState(80);

  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const targets = computeTargets(draft, weight);

  const finish = () => {
    complete({ ...draft, startWeight: weight });
    upsertBody({ date: toISODate(), weight });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      <div className="mx-auto w-full max-w-lg flex-1 px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-6">
        {/* Progreso */}
        <div className="mb-8 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
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
              Entrenamiento, nutricion inteligente y seguimiento fisico. Sin contar calorias a mano:
              escribes el alimento y la app calcula los gramos.
            </p>

            <ul className="mt-8 w-full space-y-3 text-left">
              {[
                'Escribes "Pollo" y te pregunta los gramos',
                'Dices que quieres comer y calcula las cantidades',
                'Un boton completa los macros que te faltan',
                'Registro de entrenos con records y volumen',
                'Check-in semanal que ajusta tus calorias',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px] text-muted">
                  <Check size={17} className="mt-0.5 shrink-0 text-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">Tus datos</h2>
              <p className="mt-1 text-[14px] text-muted">
                Con esto calculamos tu gasto energetico real.
              </p>
            </div>

            <div>
              <Label>¿Como te llamas?</Label>
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Tu nombre" />
            </div>

            <div>
              <Label>Sexo</Label>
              <Segmented
                value={draft.sex}
                onChange={(v: Sex) => set({ sex: v })}
                options={[
                  { value: 'hombre', label: 'Hombre' },
                  { value: 'mujer', label: 'Mujer' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nacimiento</Label>
                <Input
                  type="date"
                  value={draft.birthDate}
                  max={toISODate()}
                  onChange={(e) => set({ birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Altura</Label>
                <Input
                  inputMode="numeric"
                  value={draft.heightCm}
                  onChange={(e) => set({ heightCm: Number(e.target.value) || 0 })}
                  suffix="cm"
                />
              </div>
            </div>

            <div>
              <Label hint={`${weight.toFixed(1)} kg`}>Peso actual</Label>
              <Slider value={weight} onChange={setWeight} min={40} max={180} step={0.5} labels={['40', '110', '180']} />
            </div>

            <div>
              <Label>Nivel de actividad</Label>
              <Select value={draft.activity} onChange={(e) => set({ activity: e.target.value as ActivityLevel })}>
                {Object.entries(ACTIVITY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">¿Que buscas?</h2>
              <p className="mt-1 text-[14px] text-muted">Define el rumbo. Se puede cambiar cuando quieras.</p>
            </div>

            <div className="space-y-2">
              {(
                [
                  ['definicion', 'Definicion', 'Perder grasa manteniendo el musculo'],
                  ['mantenimiento', 'Mantenimiento', 'Sostener el peso y mejorar rendimiento'],
                  ['volumen', 'Volumen', 'Ganar musculo con superavit controlado'],
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
                <Label hint={`${((weight * draft.paceWeekPct) / 100).toFixed(2)} kg/semana`}>Ritmo</Label>
                <Slider
                  value={draft.paceWeekPct}
                  onChange={(v) => set({ paceWeekPct: v })}
                  min={0.25}
                  max={1}
                  step={0.05}
                  labels={['Lento', 'Moderado', 'Agresivo']}
                />
              </div>
            )}

            <div>
              <Label hint="opcional">Peso objetivo</Label>
              <Input
                inputMode="decimal"
                value={draft.goalWeight ?? ''}
                onChange={(e) => set({ goalWeight: Number(e.target.value) || undefined })}
                suffix="kg"
                placeholder="—"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-enter space-y-5">
            <div>
              <h2 className="text-[26px] leading-tight font-bold">Tus macros</h2>
              <p className="mt-1 text-[14px] text-muted">
                Calculado con Mifflin-St Jeor. Ajusta si ya sabes lo que te funciona.
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 text-center">
              <p className="text-[11px] tracking-wider text-faint uppercase">Objetivo diario</p>
              <p className="mt-1 text-[44px] leading-none font-bold tabular text-brand">{targets.kcal}</p>
              <p className="text-[12px] text-faint">kcal</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
                <div>
                  <p className="text-[18px] font-semibold tabular text-protein">{targets.protein}g</p>
                  <p className="text-[11px] text-faint">Proteina</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-carbs">{targets.carbs}g</p>
                  <p className="text-[11px] text-faint">Carbos</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold tabular text-fat">{targets.fat}g</p>
                  <p className="text-[11px] text-faint">Grasas</p>
                </div>
              </div>
            </div>

            <div>
              <Label hint={`${draft.proteinPerKg} g/kg`}>Proteina por kilo</Label>
              <Slider
                value={draft.proteinPerKg}
                onChange={(v) => set({ proteinPerKg: v })}
                min={1.2}
                max={3}
                step={0.1}
                labels={['1.2', '2.1', '3.0']}
              />
            </div>
            <div>
              <Label hint={`${draft.fatPerKg} g/kg`}>Grasa por kilo</Label>
              <Slider
                value={draft.fatPerKg}
                onChange={(v) => set({ fatPerKg: v })}
                min={0.5}
                max={1.5}
                step={0.05}
                labels={['0.5', '1.0', '1.5']}
              />
            </div>

            <p className="text-[12px] text-faint">
              Los carbohidratos rellenan lo que queda: son la palanca que moveremos en cada check-in.
            </p>
          </div>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-lg px-5 pb-4">
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
              Atras
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="lg" block onClick={() => setStep((s) => s + 1)}>
              Continuar
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" size="lg" block onClick={finish}>
              Empezar
              <ArrowRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
