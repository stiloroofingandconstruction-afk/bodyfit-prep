import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { ExerciseTechnique } from './ExerciseTechnique';
import { EXERCISES, EXERCISE_BY_ID } from '@/data/exercises';

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const exercise = id ? EXERCISE_BY_ID.get(id) : undefined;

  /** Navegacion entre ejercicios del mismo grupo muscular. */
  const siblings = useMemo(() => {
    if (!exercise) return { prev: undefined, next: undefined };
    const list = EXERCISES.filter((e) => e.primary === exercise.primary);
    const i = list.findIndex((e) => e.id === exercise.id);
    return { prev: list[i - 1], next: list[i + 1] };
  }, [exercise]);

  if (!exercise) {
    return (
      <>
        <PageHeader title="Ejercicio" back />
        <Page>
          <EmptyState
            title="Ejercicio no encontrado"
            description="Puede que el enlace sea antiguo."
            action={
              <Button variant="primary" onClick={() => navigate('/ejercicios')}>
                Ver biblioteca
              </Button>
            }
          />
        </Page>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tecnica" subtitle={exercise.name} back />
      <Page>
        <ExerciseTechnique
          exercise={exercise}
          onPrev={siblings.prev ? () => navigate(`/ejercicios/${siblings.prev!.id}`) : undefined}
          onNext={siblings.next ? () => navigate(`/ejercicios/${siblings.next!.id}`) : undefined}
          prevLabel={siblings.prev?.name}
          nextLabel={siblings.next?.name}
          onSelect={(nextId) => navigate(`/ejercicios/${nextId}`)}
        />
      </Page>
    </>
  );
}
