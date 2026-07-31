import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Chip, EmptyState } from '@/components/ui/Misc';
import {
  DIFFICULTY_LABEL,
  EXERCISES,
  LUMBAR_TONE,
  MUSCLE_LABEL,
  MUSCLE_ORDER,
  searchExercises,
} from '@/data/exercises';
import { cx } from '@/lib/utils';
import type { Difficulty, MuscleGroup } from '@/domain/types';

export default function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [lumbarOnly, setLumbarOnly] = useState(false);

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
      <PageHeader title="Ejercicios" subtitle={`${EXERCISES.length} ejercicios con guia de tecnica`} back />

      <Page>
        <div className="relative">
          <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio, musculo o etiqueta"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-10 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>

        <div className="scroll-momentum -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={muscle === null} onClick={() => setMuscle(null)}>
            Todos
          </Chip>
          {MUSCLE_ORDER.map((m) => (
            <Chip key={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>
              {MUSCLE_LABEL[m]}
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
              {DIFFICULTY_LABEL[d]}
            </Chip>
          ))}
          <Chip active={lumbarOnly} onClick={() => setLumbarOnly(!lumbarOnly)}>
            <ShieldCheck size={12} className="mr-1 inline" />
            Lumbar segura
          </Chip>
        </div>

        {results.length === 0 ? (
          <EmptyState title="Sin resultados" description="Prueba con otro termino o quita algun filtro." />
        ) : (
          <div className="mt-5 space-y-5">
            {grouped.map(({ muscle: m, list }) => (
              <div key={m}>
                <h2 className="mb-2 px-1 text-xs font-semibold tracking-wider text-faint uppercase">
                  {MUSCLE_LABEL[m]} · {list.length}
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
                          {DIFFICULTY_LABEL[ex.difficulty]} · {ex.equipment}
                          {ex.lumbarLoad !== 'bajo' && (
                            <span className={cx('ml-1.5', LUMBAR_TONE[ex.lumbarLoad])}>
                              · lumbar {ex.lumbarLoad}
                            </span>
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
