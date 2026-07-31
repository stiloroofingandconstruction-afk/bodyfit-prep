import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { ExerciseTechnique } from './ExerciseTechnique';
import { EXERCISE_BY_ID } from '@/data/exercises';

interface Props {
  /** Ejercicio a mostrar. */
  exerciseId: string | null;
  onClose: () => void;
  /** Ids en el orden de la sesion, para navegar sin salir del entrenamiento. */
  sequence?: { id: string; name: string }[];
}

/**
 * Guia de tecnica en hoja inferior.
 *
 * Se abre desde el entrenamiento activo con "Ver tecnica": el entrenamiento
 * sigue montado detras, asi que no se pierde ninguna serie registrada.
 */
export function TechniqueSheet({ exerciseId, onClose, sequence = [] }: Props) {
  const [override, setOverride] = useState<string | null>(null);
  const currentId = override ?? exerciseId;
  const exercise = currentId ? EXERCISE_BY_ID.get(currentId) : undefined;

  if (!exerciseId || !exercise) return null;

  const index = sequence.findIndex((s) => s.id === currentId);
  const prev = index > 0 ? sequence[index - 1] : undefined;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : undefined;

  const close = () => {
    setOverride(null);
    onClose();
  };

  return (
    <Sheet open onClose={close} title="Tecnica" height="full">
      <ExerciseTechnique
        exercise={exercise}
        onPrev={prev ? () => setOverride(prev.id) : undefined}
        onNext={next ? () => setOverride(next.id) : undefined}
        prevLabel={prev?.name}
        nextLabel={next?.name}
        onSelect={(id) => setOverride(id)}
      />
    </Sheet>
  );
}
