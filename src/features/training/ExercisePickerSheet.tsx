import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Chip } from '@/components/ui/Misc';
import { MUSCLE_LABEL, MUSCLE_ORDER, searchExercises } from '@/data/exercises';
import type { MuscleGroup } from '@/domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
}

export function ExercisePickerSheet({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const results = useMemo(() => {
    const base = searchExercises(query, 200);
    return muscle ? base.filter((e) => e.primary === muscle) : base;
  }, [query, muscle]);

  return (
    <Sheet open={open} onClose={onClose} title="Anadir ejercicio" height="full">
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-3 bg-surface px-4 pt-4 pb-3">
        <div className="relative">
          <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Press de banca, sentadilla..."
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-10 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>
        <div className="scroll-momentum -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={muscle === null} onClick={() => setMuscle(null)}>
            Todos
          </Chip>
          {MUSCLE_ORDER.map((m) => (
            <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
              {MUSCLE_LABEL[m]}
            </Chip>
          ))}
        </div>
      </div>

      <ul className="space-y-1.5">
        {results.map((ex) => (
          <li key={ex.id}>
            <button
              onClick={() => {
                onPick(ex.id);
                onClose();
              }}
              className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{ex.name}</p>
                <p className="text-[12px] text-faint">
                  {MUSCLE_LABEL[ex.primary]} · {ex.equipment}
                </p>
              </div>
              {ex.compound && (
                <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] text-brand">
                  Compuesto
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
