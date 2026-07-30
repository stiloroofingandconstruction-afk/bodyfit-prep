import { useRef, useState } from 'react';
import { Download, Share, SquarePlus, Trash2, Upload } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Segmented, Select, Slider } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Misc';
import { ACTIVITY_LABEL, ageFrom, bmr, tdee } from '@/domain/energy';
import { clearAll, exportAll, importAll } from '@/services/storage';
import { download } from '@/lib/utils';
import { toISODate } from '@/lib/date';
import { useProfile, useProfileStore } from '@/store/profileStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useCurrentWeight, useTargets } from '@/store/selectors';
import { alive } from '@/store/persist';
import { toast } from '@/store/uiStore';
import type { ActivityLevel, Goal, Sex } from '@/domain/types';

export default function SettingsPage() {
  const profile = useProfile();
  const update = useProfileStore((s) => s.update);
  const weight = useCurrentWeight();
  const targets = useTargets();
  const customFoods = useNutritionStore((s) => s.customFoods);
  const removeCustomFood = useNutritionStore((s) => s.removeCustomFood);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const maintenance = tdee(profile, weight);
  const basal = Math.round(bmr(profile, weight));
  const customs = alive(customFoods);

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Perfil, objetivos y datos" />

      <Page>
        {/* ------------------------------------------------------------ perfil */}
        <SectionTitle>Perfil</SectionTitle>
        <Card>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={profile.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sexo</Label>
                <Segmented
                  value={profile.sex}
                  onChange={(v: Sex) => update({ sex: v })}
                  options={[
                    { value: 'hombre', label: 'Hombre' },
                    { value: 'mujer', label: 'Mujer' },
                  ]}
                />
              </div>
              <div>
                <Label hint={`${ageFrom(profile.birthDate)} anos`}>Nacimiento</Label>
                <Input
                  type="date"
                  value={profile.birthDate}
                  max={toISODate()}
                  onChange={(e) => update({ birthDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Altura</Label>
                <Input
                  inputMode="numeric"
                  value={profile.heightCm}
                  onChange={(e) => update({ heightCm: Number(e.target.value) || 0 })}
                  suffix="cm"
                />
              </div>
              <div>
                <Label hint="opcional">Peso objetivo</Label>
                <Input
                  inputMode="decimal"
                  value={profile.goalWeight ?? ''}
                  onChange={(e) => update({ goalWeight: Number(e.target.value) || undefined })}
                  suffix="kg"
                  placeholder="—"
                />
              </div>
            </div>

            <div>
              <Label>Nivel de actividad</Label>
              <Select
                value={profile.activity}
                onChange={(e) => update({ activity: e.target.value as ActivityLevel })}
              >
                {Object.entries(ACTIVITY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------------------- objetivo */}
        <div className="mt-5">
          <SectionTitle>Objetivo</SectionTitle>
          <Card>
            <Segmented
              value={profile.goal}
              onChange={(v: Goal) => update({ goal: v })}
              options={[
                { value: 'definicion', label: 'Definicion' },
                { value: 'mantenimiento', label: 'Mantener' },
                { value: 'volumen', label: 'Volumen' },
              ]}
            />

            {profile.goal !== 'mantenimiento' && (
              <div className="mt-4">
                <Label hint={`${profile.paceWeekPct}% / semana ≈ ${((weight * profile.paceWeekPct) / 100).toFixed(2)} kg`}>
                  Ritmo
                </Label>
                <Slider
                  value={profile.paceWeekPct}
                  onChange={(v) => update({ paceWeekPct: v })}
                  min={0.25}
                  max={1}
                  step={0.05}
                  labels={['Lento', 'Moderado', 'Agresivo']}
                />
                <p className="mt-1.5 text-[12px] text-faint">
                  {profile.goal === 'definicion'
                    ? 'Por encima de 1% semanal empiezas a perder musculo con la grasa.'
                    : 'Ganar mas rapido no es ganar mas musculo, es ganar mas grasa.'}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------------ macros */}
        <div className="mt-5">
          <SectionTitle>Macros</SectionTitle>
          <Card>
            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
              <Stat label="Kcal" value={targets.kcal} tone="text-brand" />
              <Stat label="Prot" value={`${targets.protein}g`} tone="text-protein" />
              <Stat label="Carb" value={`${targets.carbs}g`} tone="text-carbs" />
              <Stat label="Gras" value={`${targets.fat}g`} tone="text-fat" />
            </div>

            <div className="space-y-5">
              <div>
                <Label hint={`${profile.proteinPerKg} g/kg → ${Math.round(weight * profile.proteinPerKg)} g`}>
                  Proteina
                </Label>
                <Slider
                  value={profile.proteinPerKg}
                  onChange={(v) => update({ proteinPerKg: v })}
                  min={1.2}
                  max={3}
                  step={0.1}
                  labels={['1.2', '2.1', '3.0']}
                />
              </div>
              <div>
                <Label hint={`${profile.fatPerKg} g/kg → ${Math.round(weight * profile.fatPerKg)} g`}>
                  Grasa
                </Label>
                <Slider
                  value={profile.fatPerKg}
                  onChange={(v) => update({ fatPerKg: v })}
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  labels={['0.5', '1.0', '1.5']}
                />
              </div>
              <div>
                <Label hint={profile.kcalOverride ? 'manual' : 'automatico'}>Calorias</Label>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    value={profile.kcalOverride ?? ''}
                    onChange={(e) => update({ kcalOverride: Number(e.target.value) || null })}
                    placeholder={String(targets.kcal)}
                    suffix="kcal"
                  />
                  {profile.kcalOverride && (
                    <Button variant="secondary" onClick={() => update({ kcalOverride: null })}>
                      Auto
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <Stat label="Metabolismo basal" value={basal} unit="kcal" />
              <Stat label="Mantenimiento" value={maintenance} unit="kcal" />
            </div>
            <p className="mt-2 text-[11px] text-faint">
              Mifflin-St Jeor sobre {weight.toFixed(1)} kg. Los carbohidratos se calculan con lo que
              sobra tras fijar proteina y grasa.
            </p>
          </Card>
        </div>

        {/* ----------------------------------------------- alimentos propios */}
        {customs.length > 0 && (
          <div className="mt-5">
            <SectionTitle>Mis alimentos ({customs.length})</SectionTitle>
            <div className="space-y-1.5">
              {customs.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{f.name}</p>
                    <p className="text-[12px] tabular text-faint">
                      {Math.round(f.per100.kcal)} kcal · P {f.per100.protein} · C {f.per100.carbs} · G{' '}
                      {f.per100.fat} / 100 {f.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCustomFood(f.id)}
                    className="pressable flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- datos */}
        <div className="mt-5">
          <SectionTitle>Datos</SectionTitle>
          <Card>
            <p className="mb-3 text-[13px] text-muted">
              Todo se guarda en este dispositivo. Exporta de vez en cuando: es tu copia de seguridad
              hasta que activemos la nube.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  download(`bodyfit-${toISODate()}.json`, await exportAll());
                  toast('Copia exportada');
                }}
              >
                <Download size={16} />
                Exportar
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload size={16} />
                Importar
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await importAll(await file.text());
                  toast('Copia importada. Reiniciando...');
                  setTimeout(() => window.location.reload(), 700);
                } catch {
                  toast('El archivo no es una copia valida', 'error');
                }
              }}
            />

            <button
              onClick={async () => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                await clearAll();
                window.location.reload();
              }}
              className="mt-3 w-full rounded-2xl border border-rose/30 bg-rose/10 py-3 text-[14px] font-medium text-rose"
            >
              {confirmReset ? 'Pulsa otra vez para borrar todo' : 'Borrar todos los datos'}
            </button>
          </Card>
        </div>

        {/* ------------------------------------------------------ instalacion */}
        <div className="mt-5">
          <SectionTitle>Instalar en el iPhone</SectionTitle>
          <Card>
            <ol className="space-y-2.5 text-[13px] text-muted">
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  1
                </span>
                Abre esta pagina en Safari
              </li>
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Pulsa Compartir <Share size={14} className="inline text-ink" />
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  3
                </span>
                <span className="flex items-center gap-1.5">
                  Elige Anadir a pantalla de inicio <SquarePlus size={14} className="inline text-ink" />
                </span>
              </li>
            </ol>
            <p className="mt-3 text-[12px] text-faint">
              Se abrira a pantalla completa, sin barras del navegador y funcionara sin conexion.
            </p>
          </Card>
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">BodyFit Prep · v1.0.0</p>
      </Page>
    </>
  );
}
