import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Database,
  FileText,
  Film,
  Info,
  Share,
  ShieldCheck,
  SquarePlus,
  Stethoscope,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, NumberField, Segmented, Select, Slider } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Misc';
import { ACTIVITY_LEVELS, ageFrom, bmr, tdee } from '@/domain/energy';
import { activityLabel } from '@/i18n/labels';
import { useUnits } from '@/lib/useUnits';
import { fmtDateTime, toISODate } from '@/lib/date';
import { useProfile, useProfileStore } from '@/store/profileStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useSettingsStore, type Experience } from '@/store/settingsStore';
import { useBackupStore } from '@/store/backupStore';
import { useActivePrep, useCurrentWeight, useTargets } from '@/store/selectors';
import { alive } from '@/store/persist';
import { LOCALE_LABEL, t, type Locale } from '@/i18n';
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
  const lastBackup = useBackupStore((s) => s.lastBackupAt);
  const u = useUnits();

  const maintenance = tdee(profile, weight);
  const basal = Math.round(bmr(profile, weight));
  const customs = alive(customFoods);

  return (
    <>
      <PageHeader title={t('screen.settings')} subtitle={t('set.subtitle')} />

      <Page>
        {/* ------------------------------------------------- modo competencia */}
        <SectionTitle>{t('set.competition')}</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
              <Trophy size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{t('set.competitionMode')}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {prep
                  ? `${prep.showName} · ${prep.division}`
                  : t('set.competitionModeDesc')}
              </p>
            </div>
            <button
              onClick={() => settings.update({ competitionMode: !settings.competitionMode })}
              className={cxToggle(settings.competitionMode)}
              aria-label={t('set.competitionToggle')}
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
              <span>{prep ? t('set.viewCompetition') : t('set.setupCompetition')}</span>
              <ChevronRight size={16} className="text-faint" />
            </Link>
          )}
        </Card>

        {/* ------------------------------------------------------------ perfil */}
        <SectionTitle>{t('set.profile')}</SectionTitle>
        <Card>
          <div className="space-y-4">
            <div>
              <Label>{t('field.name')}</Label>
              <Input
                value={profile.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={t('field.yourName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('field.sex')}</Label>
                <Segmented
                  value={profile.sex}
                  onChange={(v: Sex) => update({ sex: v })}
                  options={[
                    { value: 'hombre', label: t('field.male') },
                    { value: 'mujer', label: t('field.female') },
                  ]}
                />
              </div>
              <div>
                <Label hint={String(ageFrom(profile.birthDate))}>{t('field.birth')}</Label>
                <Input
                  aria-label={t('field.birthDate')}
                  type="date"
                  value={profile.birthDate}
                  max={toISODate()}
                  onChange={(e) => update({ birthDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('field.height')}</Label>
                <NumberField
                  aria-label={t('field.height')}
                  value={u.toDisplayLength(profile.heightCm)}
                  decimals={u.lengthUnit === 'cm' ? 0 : 1}
                  onChange={(v) => {
                    if (v != null && v > 0) update({ heightCm: u.toCanonicalLength(v) });
                  }}
                  suffix={u.l}
                />
              </div>
              <div>
                <Label hint={t('field.goalWeightHint')}>{t('field.goalWeight')}</Label>
                <NumberField
                  aria-label={t('field.goalWeight')}
                  value={profile.goalWeight != null ? u.toDisplayWeight(profile.goalWeight) : null}
                  onChange={(v) =>
                    update({ goalWeight: v != null && v > 0 ? u.toCanonicalWeight(v) : undefined })
                  }
                  suffix={u.w}
                  placeholder="—"
                />
              </div>
            </div>

            <div>
              <Label>{t('field.activity')}</Label>
              <Select
                aria-label={t('field.activity')}
                value={profile.activity}
                onChange={(e) => update({ activity: e.target.value as ActivityLevel })}
              >
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {activityLabel(level)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------------------- objetivo */}
        <div className="mt-5">
          <SectionTitle>{t('field.goal')}</SectionTitle>
          <Card>
            <Segmented
              value={profile.goal}
              onChange={(v: Goal) => update({ goal: v })}
              options={[
                { value: 'definicion', label: t('goal.cut') },
                { value: 'mantenimiento', label: t('goal.maintainShort') },
                { value: 'volumen', label: t('goal.bulk') },
              ]}
            />

            {profile.goal !== 'mantenimiento' && (
              <div className="mt-4">
                <Label
                  hint={`${profile.paceWeekPct}% / ${t('common.week').toLowerCase()} ≈ ${u.fmtWeight(
                    (weight * profile.paceWeekPct) / 100,
                    2,
                  )}`}
                >
                  {t('field.pace')}
                </Label>
                <Slider
                  aria-label={t('field.pace')}
                  value={profile.paceWeekPct}
                  onChange={(v) => update({ paceWeekPct: v })}
                  min={0.25}
                  max={1}
                  step={0.05}
                  labels={[t('field.paceSlow'), t('field.paceModerate'), t('field.paceAggressive')]}
                />
                <p className="mt-1.5 text-[12px] text-faint">
                  {profile.goal === 'definicion' ? t('goal.cutNote') : t('goal.bulkNote')}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------------ macros */}
        <div className="mt-5">
          <SectionTitle>{t('set.macros')}</SectionTitle>
          <Card>
            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
              <Stat label="kcal" value={targets.kcal} tone="text-brand" />
              <Stat label={t('field.protein')} value={`${targets.protein} g`} tone="text-protein" />
              <Stat label={t('field.carbs')} value={`${targets.carbs} g`} tone="text-carbs" />
              <Stat label={t('field.fat')} value={`${targets.fat} g`} tone="text-fat" />
            </div>

            <div className="space-y-5">
              <div>
                <Label
                  hint={`${u.toDisplayPerWeight(profile.proteinPerKg).toFixed(u.weightUnit === 'kg' ? 1 : 2)} ${u.perW} → ${Math.round(weight * profile.proteinPerKg)} g`}
                >
                  {t('field.protein')}
                </Label>
                <Slider
                  aria-label={t('field.perWeightUnit', { unit: t('field.protein') })}
                  value={u.toDisplayPerWeight(profile.proteinPerKg)}
                  onChange={(v) => update({ proteinPerKg: u.toCanonicalPerWeight(v) })}
                  {...u.perWeightRange(1.2, 3)}
                  labels={[
                    u.toDisplayPerWeight(1.2).toFixed(2),
                    u.toDisplayPerWeight(2.1).toFixed(2),
                    u.toDisplayPerWeight(3).toFixed(2),
                  ]}
                />
              </div>
              <div>
                <Label
                  hint={`${u.toDisplayPerWeight(profile.fatPerKg).toFixed(2)} ${u.perW} → ${Math.round(weight * profile.fatPerKg)} g`}
                >
                  {t('field.fat')}
                </Label>
                <Slider
                  aria-label={t('field.perWeightUnit', { unit: t('field.fat') })}
                  value={u.toDisplayPerWeight(profile.fatPerKg)}
                  onChange={(v) => update({ fatPerKg: u.toCanonicalPerWeight(v) })}
                  {...u.perWeightRange(0.5, 1.5)}
                  labels={[
                    u.toDisplayPerWeight(0.5).toFixed(2),
                    u.toDisplayPerWeight(1).toFixed(2),
                    u.toDisplayPerWeight(1.5).toFixed(2),
                  ]}
                />
              </div>
              <div>
                <Label hint={profile.kcalOverride ? t('field.manual') : t('field.auto')}>{t('field.calories')}</Label>
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
                      {t('field.auto')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <Stat label={t('set.basalMetabolism')} value={basal} unit="kcal" />
              <Stat label={t('set.maintenance')} value={maintenance} unit="kcal" />
            </div>
            <p className="mt-2 text-[11px] text-faint">
              {t('set.macrosNote', { weight: u.fmtWeight(weight) })}
            </p>
          </Card>
        </div>

        {/* ------------------------------------------- unidades e idioma */}
        <div className="mt-5">
          <SectionTitle>{t('units.title')}</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label>{t('units.weight')}</Label>
                <Segmented
                  value={settings.weightUnit}
                  onChange={(v: WeightUnit) => settings.setUnits({ weightUnit: v })}
                  options={[
                    { value: 'kg', label: t('units.kg') },
                    { value: 'lb', label: t('units.lb') },
                  ]}
                />
              </div>
              <div>
                <Label>{t('units.length')}</Label>
                <Segmented
                  value={settings.lengthUnit}
                  onChange={(v: LengthUnit) => settings.setUnits({ lengthUnit: v })}
                  options={[
                    { value: 'cm', label: t('units.cm') },
                    { value: 'in', label: t('units.in') },
                  ]}
                />
              </div>
              <div>
                <Label>{t('units.language')}</Label>
                <Segmented
                  value={settings.locale}
                  onChange={(v: Locale) => settings.setLocaleSetting(v)}
                  options={(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => ({
                    value: l,
                    label: LOCALE_LABEL[l],
                  }))}
                />
                <p className="mt-1.5 text-[11px] text-faint">{t('units.languageNote')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* --------------------------------------------- entrenamiento */}
        <div className="mt-5">
          <SectionTitle>{t('set.training')}</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label>{t('field.experience')}</Label>
                <Select
                  aria-label={t('field.experience')}
                  value={settings.experience}
                  onChange={(e) => settings.update({ experience: e.target.value as Experience })}
                >
                  <option value="principiante">{t('exp.beginner')}</option>
                  <option value="intermedio">{t('exp.intermediate')}</option>
                  <option value="avanzado">{t('exp.advanced')}</option>
                  <option value="competidor">{t('exp.competitor')}</option>
                </Select>
              </div>
              <div>
                <Label hint={t('field.days', { n: settings.trainingDaysPerWeek })}>
                  {t('field.trainingDays')}
                </Label>
                <Slider
                  aria-label={t('field.trainingDaysWeek')}
                  value={settings.trainingDaysPerWeek}
                  onChange={(v) => settings.update({ trainingDaysPerWeek: v })}
                  min={1}
                  max={7}
                  step={1}
                  labels={['1', '4', '7']}
                />
              </div>
              <div>
                <Label hint={t('field.commaSeparated')}>{t('field.discomforts')}</Label>
                <Input
                  aria-label={t('field.discomforts')}
                  value={settings.discomforts.join(', ')}
                  onChange={(e) =>
                    settings.update({
                      discomforts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={t('field.discomfortsPlaceholder')}
                />
                <p className="mt-1.5 text-[11px] text-faint">
                  {t('set.lumbarNote')}
                </p>
              </div>
              {settings.avoidedExercises.length > 0 && (
                <div>
                  <Label hint={String(settings.avoidedExercises.length)}>{t('set.avoidedExercises')}</Label>
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
          <SectionTitle>{t('set.tools')}</SectionTitle>
          <div className="space-y-1.5">
            {[
              { to: '/ejercicios', label: t('set.toolLibrary'), detail: t('set.toolLibraryDesc'), Icon: ShieldCheck },
              { to: '/ajustes/videos', label: t('set.toolVideos'), detail: t('set.toolVideosDesc'), Icon: Film },
              { to: '/ajustes/recordatorios', label: t('set.toolReminders'), detail: t('set.toolRemindersDesc'), Icon: Bell },
              { to: '/informes', label: t('set.toolReports'), detail: t('set.toolReportsDesc'), Icon: FileText },
              { to: '/ajustes/datos', label: t('data.openLink'), detail: t('data.openHint'), Icon: Database },
              { to: '/ajustes/diagnostico', label: t('set.toolDiagnostics'), detail: t('set.toolDiagnosticsDesc'), Icon: Stethoscope },
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
            <SectionTitle>{`${t('set.myFoods')} (${customs.length})`}</SectionTitle>
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
                    aria-label={t('common.delete')}
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
          <SectionTitle>{t('set.data')}</SectionTitle>
          <Card>
            <p className="text-[13px] text-muted">
              {t('set.dataNote')}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface2 px-3 py-2.5 text-[13px]">
              <span className="text-muted">{t('data.backup.last')}</span>
              <span className={lastBackup ? 'text-ink' : 'text-amber'}>
                {lastBackup ? fmtDateTime(lastBackup) : t('data.backup.neverShort')}
              </span>
            </div>
            <Link
              to="/ajustes/datos"
              className="pressable mt-2 flex items-center justify-between rounded-xl bg-brand px-3 py-2.5 text-[14px] font-medium text-base"
            >
              <span>{t('data.openLink')}</span>
              <ChevronRight size={16} />
            </Link>
          </Card>
        </div>

        {/* ------------------------------------------------------ instalacion */}
        <div className="mt-5">
          <SectionTitle>{t('set.installTitle')}</SectionTitle>
          <Card>
            <ol className="space-y-2.5 text-[13px] text-muted">
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  1
                </span>
                {t('set.installStep1')}
              </li>
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  {t('set.installStep2')} <Share size={14} className="inline text-ink" />
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] text-brand">
                  3
                </span>
                <span className="flex items-center gap-1.5">
                  {t('set.installStep3')} <SquarePlus size={14} className="inline text-ink" />
                </span>
              </li>
            </ol>
            <p className="mt-3 text-[12px] text-faint">
              {t('set.installNote')}
            </p>
          </Card>
        </div>

        {/* ------------------------------------------------------- avisos */}
        <div className="mt-5">
          <SectionTitle>{t('set.notice')}</SectionTitle>
          <Card className="border-line/70">
            <div className="flex gap-2.5">
              <Info size={15} className="mt-0.5 shrink-0 text-faint" />
              <div className="space-y-2 text-[12px] text-faint">
                <p>{t('disclaimer.medical')}</p>
                <p>{t('disclaimer.peakWeek')}</p>
                <p>{t('disclaimer.local')}</p>
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
