import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Chip, EmptyState } from '@/components/ui/Misc';
import { EXERCISES, LUMBAR_TONE, MUSCLE_ORDER, searchExercises } from '@/data/exercises';
import { difficultyLabel, muscleLabel } from '@/i18n/catalogLabels';
import { t, type Dict } from '@/i18n';
import { cx } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import type { Difficulty, MuscleGroup } from '@bodyfit/domain/types';
import { useExerciseCatalog } from '@/data/useCatalog';

/** Nivel de carga lumbar en minuscula, para incrustarlo en una frase. */
const LUMBAR_WORD: Record<'bajo' | 'moderado' | 'alto', keyof Dict> = {
  bajo: 'ex.lumbarLow',
  moderado: 'ex.lumbarModerate',
  alto: 'ex.lumbarHigh',
};

export default function ExerciseLibraryPage() {
  // Descarga el catalogo al entrar en la pantalla, no en el arranque
  useExerciseCatalog();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [lumbarOnly, setLumbarOnly] = useState(false);
  const avoided = useSettingsStore((s) => s.avoidedExercises);

  const results = useMemo(() => {
    let list = query.trim() ? searchExercises(query, 300) : EXERCISES;
    if (muscle) list = list.filter((e) => e.primary === muscle);
    if (difficulty) list = list.filter((e) => e.difficulty === difficulty);
    if (lumbarOnly) list = list.filter((e) => e.lumbarLoad === 'bajo');
    return list;
  }, [query, muscle, difficulty, lumbarOnly]);

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, typeof results>();
    for (const ex of results) {
      const list = map.get(ex.primary) ?? [];
      list.push(ex);
      map.set(ex.primary, list);
    }
    return MUSCLE_ORDER.filter((m) => map.has(m)).map((m) => ({ muscle: m, list: map.get(m)! }));
  }, [results]);

  return (
    <>
      <PageHeader
        title={t('screen.exercises')}
        subtitle={t('ex.subtitle', { n: EXERCISES.length })}
        back
      />

      <Page>
        <div className="relative">
          <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('ex.searchPlaceholder')}
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-10 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>

        <div className="scroll-momentum -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={muscle === null} onClick={() => setMuscle(null)}>
            {t('ex.all')}
          </Chip>
          {MUSCLE_ORDER.map((m) => (
            <Chip key={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>
              {muscleLabel(m)}
            </Chip>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {(['principiante', 'intermedio', 'avanzado'] as Difficulty[]).map((d) => (
            <Chip
              key={d}
              active={difficulty === d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
            >
              {difficultyLabel(d)}
            </Chip>
          ))}
          <Chip active={lumbarOnly} onClick={() => setLumbarOnly(!lumbarOnly)}>
            <ShieldCheck size={12} className="mr-1 inline" />
            {t('ex.lumbarSafeFilter')}
          </Chip>
        </div>

        {results.length === 0 ? (
          <EmptyState title={t('ex.noResults')} description={t('ex.noResultsDesc')} />
        ) : (
          <div className="mt-5 space-y-5">
            {grouped.map(({ muscle: m, list }) => (
              <div key={m}>
                <h2 className="mb-2 px-1 text-xs font-semibold tracking-wider text-faint uppercase">
                  {muscleLabel(m)} · {list.length}
                </h2>
                <div className="space-y-1.5">
                  {list.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => navigate(`/ejercicios/${ex.id}`)}
                      className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{ex.name}</p>
                        <p className="truncate text-[12px] text-faint">
                          {difficultyLabel(ex.difficulty)} · {ex.equipment}
                          {ex.lumbarLoad !== 'bajo' && (
                            <span className={cx('ml-1.5', LUMBAR_TONE[ex.lumbarLoad])}>
                              ·{' '}
                              {t('ex.lumbarInline', {
                                level: t(LUMBAR_WORD[ex.lumbarLoad]),
                              })}
                            </span>
                          )}
                          {avoided.includes(ex.id) && (
                            <span className="ml-1.5 text-rose">· {t('ex.avoidingInline')}</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight size={17} className="shrink-0 text-faint" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>
    </>
  );
}
