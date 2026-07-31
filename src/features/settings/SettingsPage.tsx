import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Download,
  FileText,
  Film,
  Info,
  Share,
  ShieldCheck,
  SquarePlus,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
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
import { useSettingsStore, type Experience } from '@/store/settingsStore';
import { useActivePrep, useCurrentWeight, useTargets } from '@/store/selectors';
import { alive } from '@/store/persist';
import { toast } from '@/store/uiStore';
import { LOCALE_LABEL, type Locale } from '@/i18n';
import { EXERCISE_BY_ID } from '@/data/exercises';
import type { ActivityLevel, Goal, Sex } from '@/domain/types';
import type { WeightUnit, LengthUnit } from '@/domain/units';

export default function SettingsPage() {
  const profile = useProfile();
  const update = useProfileStore((s) => s.update);
  const weight = useCurrentWeight();
  const targets = useTargets();
  const customFoods = useNutritionStore((s) => s.customFoods);
  const removeCustomFood = useNutritionStore((s) => s.removeCustomFood);
  const settings = useSettingsStore();
  const prep = useActivePrep();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const maintenance = tdee(profile, weight);
  const basal = Math.round(bmr(profile, weight));
  const customs = alive(customFoods);

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Perfil, objetivos y datos" />

      <Page>
        {/* ------------------------------------------------- modo competencia */}
        <SectionTitle>Competencia</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
              <Trophy size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">Modo competencia</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {prep
                  ? `${prep.showName} · ${prep.division}`
                  : 'Cuenta atras, fases del prep, cardio, posing, peak week y dia del show'}
              </p>
            </div>
            <button
              onClick={() => settings.update({ competitionMode: !settings.competitionMode })}
              className={cxToggle(settings.competitionMode)}
              aria-label="Alternar modo competencia"
            >
              <span
                className={`block size-5 rounded-full bg-white transition-transform ${
                  settings.competitionMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          {settings.competitionMode && (
            <Link
              to="/competencia"
              className="pressable mt-3 flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5 text-[14px]"
            >
              <span>{prep ? 'Ver panel de competencia' : 'Configurar competencia'}</span>
              <ChevronRight size={16} className="text-faint" />
            </Link>
          )}
        </Card>

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

        {/* ------------------------------------------- unidades e idioma */}
        <div className="mt-5">
          <SectionTitle>Unidades e idioma</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label>Peso</Label>
                <Segmented
                  value={settings.weightUnit}
                  onChange={(v: WeightUnit) => settings.setUnits({ weightUnit: v })}
                  options={[
                    { value: 'kg', label: 'Kilogramos' },
                    { value: 'lb', label: 'Libras' },
                  ]}
                />
              </div>
              <div>
                <Label>Longitud</Label>
                <Segmented
                  value={settings.lengthUnit}
                  onChange={(v: LengthUnit) => settings.setUnits({ lengthUnit: v })}
                  options={[
                    { value: 'cm', label: 'Centimetros' },
                    { value: 'in', label: 'Pulgadas' },
                  ]}
                />
              </div>
              <div>
                <Label>Idioma</Label>
                <Segmented
                  value={settings.locale}
                  onChange={(v: Locale) => settings.setLocaleSetting(v)}
                  options={(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => ({
                    value: l,
                    label: LOCALE_LABEL[l],
                  }))}
                />
                <p className="mt-1.5 text-[11px] text-faint">
                  La app esta completa en espanol. El ingles cubre la navegacion y los modulos de
                  competencia; el resto se ira traduciendo.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* --------------------------------------------- entrenamiento */}
        <div className="mt-5">
          <SectionTitle>Entrenamiento</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label>Nivel de experiencia</Label>
                <Select
                  value={settings.experience}
                  onChange={(e) => settings.update({ experience: e.target.value as Experience })}
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="competidor">Competidor</option>
                </Select>
              </div>
              <div>
                <Label hint={`${settings.trainingDaysPerWeek} dias`}>Dias de entrenamiento</Label>
                <Slider
                  value={settings.trainingDaysPerWeek}
                  onChange={(v) => settings.update({ trainingDaysPerWeek: v })}
                  min={1}
                  max={7}
                  step={1}
                  labels={['1', '4', '7']}
                />
              </div>
              <div>
                <Label hint="separadas por comas">Molestias fisicas</Label>
                <Input
                  value={settings.discomforts.join(', ')}
                  onChange={(e) =>
                    settings.update({
                      discomforts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="lumbar, hombro derecho"
                />
                <p className="mt-1.5 text-[11px] text-faint">
                  La biblioteca de ejercicios marca la carga lumbar y propone alternativas cuando es
                  alta. No es consejo medico.
                </p>
              </div>
              {settings.avoidedExercises.length > 0 && (
                <div>
                  <Label hint={`${settings.avoidedExercises.length}`}>Ejercicios a evitar</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {settings.avoidedExercises.map((id) => (
                      <button
                        key={id}
                        onClick={() => settings.toggleAvoidedExercise(id)}
                        className="pressable rounded-full border border-rose/30 bg-rose/10 px-2.5 py-1 text-[12px] text-rose"
                      >
                        {EXERCISE_BY_ID.get(id)?.name ?? id} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* --------------------------------------------------- herramientas */}
        <div className="mt-5">
          <SectionTitle>Herramientas</SectionTitle>
          <div className="space-y-1.5">
            {[
              { to: '/ejercicios', label: 'Biblioteca de ejercicios', detail: 'Tecnica, variantes y seguridad', Icon: ShieldCheck },
              { to: '/ajustes/videos', label: 'Videos de ejercicios', detail: 'Asocia tus propios videos', Icon: Film },
              { to: '/ajustes/recordatorios', label: 'Recordatorios', detail: 'Avisos dentro de la app', Icon: Bell },
              { to: '/informes', label: 'Informes y exportacion', detail: 'CSV, JSON y resumen para coach', Icon: FileText },
            ].map(({ to, label, detail, Icon }) => (
              <Link
                key={to}
                to={to}
                className="pressable flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
                  <Icon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{label}</p>
                  <p className="truncate text-[12px] text-faint">{detail}</p>
                </div>
                <ChevronRight size={17} className="shrink-0 text-faint" />
              </Link>
            ))}
          </div>
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

        {/* ------------------------------------------------------- avisos */}
        <div className="mt-5">
          <SectionTitle>Aviso</SectionTitle>
          <Card className="border-line/70">
            <div className="flex gap-2.5">
              <Info size={15} className="mt-0.5 shrink-0 text-faint" />
              <div className="space-y-2 text-[12px] text-faint">
                <p>
                  BodyFit Prep es una herramienta de planificacion y seguimiento. No sustituye la
                  atencion medica ni la valoracion de un entrenador cualificado.
                </p>
                <p>
                  La app no recomienda sustancias, diureticos ni protocolos de deshidratacion, y no
                  automatiza manipulaciones de agua o sodio. Ante cualquier sintoma que te preocupe,
                  consulta con un profesional sanitario.
                </p>
                <p>Tus datos se guardan unicamente en este dispositivo.</p>
              </div>
            </div>
          </Card>
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">BodyFit Prep · v2.0.0</p>
      </Page>
    </>
  );
}

/** Interruptor tipo iOS. */
function cxToggle(on: boolean): string {
  return `pressable flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
    on ? 'bg-brand' : 'bg-line2'
  }`;
}
