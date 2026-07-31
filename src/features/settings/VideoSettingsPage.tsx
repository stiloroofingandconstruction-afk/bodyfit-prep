import { useMemo, useState } from 'react';
import { Film, Search, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { ExerciseVideo } from '@/components/ui/ExerciseVideo';
import { EXERCISE_BY_ID, searchExercises } from '@/data/exercises';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import type { ExerciseMedia } from '@/domain/types';

/** Extrae el id de un enlace de YouTube en cualquiera de sus formatos. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = value.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function VideoSettingsPage() {
  const exerciseMedia = useSettingsStore((s) => s.exerciseMedia);
  const setExerciseMedia = useSettingsStore((s) => s.setExerciseMedia);
  const clearExerciseMedia = useSettingsStore((s) => s.clearExerciseMedia);

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const configured = useMemo(
    () =>
      Object.entries(exerciseMedia)
        .map(([id, media]) => ({ exercise: EXERCISE_BY_ID.get(id), media, id }))
        .filter((x) => x.exercise),
    [exerciseMedia],
  );

  const results = useMemo(
    () => (query.trim() ? searchExercises(query, 12) : []),
    [query],
  );

  return (
    <>
      <PageHeader title="Videos de ejercicios" subtitle="Configura tus propios videos" back />

      <Page>
        <Card className="border-line/70">
          <div className="flex gap-2.5">
            <Film size={15} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <p className="text-[13px] text-muted">
                La app no incrusta videos de terceros por su cuenta: los enlaces ajenos desaparecen y
                el contenido puede tener copyright. Aqui puedes asociar tus propios videos (MP4 o
                WebM alojados por ti) o un enlace de YouTube que tu elijas.
              </p>
              <p className="mt-2 text-[12px] text-faint">
                Los ejercicios sin video muestran la guia escrita completa, que es el contenido
                principal de la pantalla de tecnica.
              </p>
            </div>
          </div>
        </Card>

        {/* ─────────────────────────── buscador */}
        <div className="mt-4">
          <SectionTitle>Anadir video a un ejercicio</SectionTitle>
          <div className="relative">
            <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ejercicio"
              className="h-12 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-10 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
            />
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setEditing(ex.id);
                    setQuery('');
                  }}
                  className="pressable w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[14px]"
                >
                  {ex.name}
                  {exerciseMedia[ex.id] && (
                    <span className="ml-2 text-[11px] text-brand">· ya configurado</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─────────────────────────── configurados */}
        <div className="mt-5">
          <SectionTitle>Videos configurados ({configured.length})</SectionTitle>
          {configured.length === 0 ? (
            <EmptyState
              icon={<Film size={22} />}
              title="Sin videos propios"
              description="Busca un ejercicio arriba y asocia tu video. Se guarda solo en este dispositivo."
            />
          ) : (
            <div className="space-y-1.5">
              {configured.map(({ exercise, media, id }) => (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{exercise!.name}</p>
                    <p className="truncate text-[12px] text-faint">
                      {media.youtubeId
                        ? `YouTube · ${media.youtubeId}`
                        : media.videoUrl ?? media.videoWebmUrl ?? 'Sin fuente'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(id)}
                    className="pressable rounded-lg bg-surface2 px-2.5 py-1.5 text-[12px] text-brand"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      clearExerciseMedia(id);
                      toast('Video eliminado', 'info');
                    }}
                    className="pressable flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-faint"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page>

      {editing && (
        <MediaSheet
          exerciseId={editing}
          initial={exerciseMedia[editing]}
          onClose={() => setEditing(null)}
          onSave={(media) => {
            setExerciseMedia(editing, media);
            toast('Video guardado');
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function MediaSheet({
  exerciseId,
  initial,
  onClose,
  onSave,
}: {
  exerciseId: string;
  initial?: ExerciseMedia;
  onClose: () => void;
  onSave: (media: ExerciseMedia) => void;
}) {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  const [youtube, setYoutube] = useState(initial?.youtubeId ?? '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [webmUrl, setWebmUrl] = useState(initial?.videoWebmUrl ?? '');
  const [poster, setPoster] = useState(initial?.videoPoster ?? '');
  const [image, setImage] = useState(initial?.imageUrl ?? '');

  const ytId = parseYouTubeId(youtube);
  const media: ExerciseMedia = {
    ...(ytId ? { youtubeId: ytId } : {}),
    ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
    ...(webmUrl.trim() ? { videoWebmUrl: webmUrl.trim() } : {}),
    ...(poster.trim() ? { videoPoster: poster.trim() } : {}),
    ...(image.trim() ? { imageUrl: image.trim() } : {}),
  };
  const valid = Object.keys(media).length > 0;

  return (
    <Sheet
      open
      onClose={onClose}
      title={exercise?.name ?? 'Video'}
      height="full"
      footer={
        <Button variant="primary" size="lg" block disabled={!valid} onClick={() => onSave(media)}>
          Guardar video
        </Button>
      }
    >
      <div className="space-y-4">
        <ExerciseVideo media={media} title={exercise?.name ?? ''} />

        <div>
          <Label hint={ytId ? `id: ${ytId}` : 'enlace o id'}>YouTube</Label>
          <Input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtu.be/..."
          />
          {youtube.trim() && !ytId && (
            <p className="mt-1 text-[12px] text-carbs">No reconocemos ese enlace de YouTube</p>
          )}
        </div>

        <div>
          <Label hint="alojado por ti">Video MP4</Label>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://tu-servidor/press-banca.mp4"
          />
        </div>

        <div>
          <Label hint="opcional">Video WebM</Label>
          <Input
            value={webmUrl}
            onChange={(e) => setWebmUrl(e.target.value)}
            placeholder="https://tu-servidor/press-banca.webm"
          />
        </div>

        <div>
          <Label hint="imagen de portada">Poster</Label>
          <Input
            value={poster}
            onChange={(e) => setPoster(e.target.value)}
            placeholder="https://tu-servidor/poster.jpg"
          />
        </div>

        <div>
          <Label hint="si no hay video">Imagen ilustrativa</Label>
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://tu-servidor/imagen.jpg"
          />
        </div>

        <p className="rounded-2xl border border-line bg-surface2 p-3 text-[12px] text-faint">
          Los videos propios solo se descargan cuando pulsas reproducir. Sin conexion, la guia
          escrita sigue disponible completa.
        </p>
      </div>
    </Sheet>
  );
}
