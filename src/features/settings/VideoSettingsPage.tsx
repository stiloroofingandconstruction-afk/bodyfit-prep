import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, Download, Film, Search, Trash2, Upload } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Label } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { ExerciseVideo } from '@/components/ui/ExerciseVideo';
import { EXERCISE_BY_ID, searchExercises } from '@/data/exercises';
import {
  exportMedia,
  hasErrors,
  importMedia,
  parseYouTubeId,
  validateMedia,
} from '@/domain/media';
import { today } from '@/lib/date';
import { cx, download } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import type { ExerciseMedia } from '@/domain/types';

export { parseYouTubeId };

export default function VideoSettingsPage() {
  const exerciseMedia = useSettingsStore((s) => s.exerciseMedia);
  const setExerciseMedia = useSettingsStore((s) => s.setExerciseMedia);
  const clearExerciseMedia = useSettingsStore((s) => s.clearExerciseMedia);
  const update = useSettingsStore((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const configured = useMemo(
    () =>
      Object.entries(exerciseMedia)
        .map(([id, media]) => ({ exercise: EXERCISE_BY_ID.get(id), media, id }))
        .filter((x) => x.exercise),
    [exerciseMedia],
  );

  const results = useMemo(() => (query.trim() ? searchExercises(query, 12) : []), [query]);
  const unverified = configured.filter((c) => !c.media.verified).length;

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
                el contenido puede estar protegido por derechos de autor. Aqui puedes asociar tus
                propios videos (MP4 o WebM alojados por ti) o un enlace de YouTube que tu elijas.
              </p>
              <p className="mt-2 text-[12px] text-faint">
                Anota siempre la fuente y con que permiso lo usas. Los ejercicios sin video muestran
                la guia escrita completa, que es el contenido principal de la pantalla de tecnica.
              </p>
            </div>
          </div>
        </Card>

        {unverified > 0 && (
          <Card className="mt-3 border-carbs/30 bg-carbs/8">
            <p className="flex gap-2 text-[13px] text-carbs">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {unverified} {unverified === 1 ? 'video sin verificar' : 'videos sin verificar'}. Se
              muestran con aviso hasta que confirmes fuente y permiso.
            </p>
          </Card>
        )}

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
                    <p className="flex items-center gap-1.5 truncate text-[15px] font-medium">
                      {media.verified && <BadgeCheck size={14} className="shrink-0 text-brand" />}
                      {exercise!.name}
                    </p>
                    <p className="truncate text-[12px] text-faint">
                      {media.youtubeId
                        ? `YouTube · ${media.youtubeId}`
                        : (media.videoUrl ?? media.videoWebmUrl ?? 'Sin fuente reproducible')}
                    </p>
                    {media.source && (
                      <p className="truncate text-[11px] text-faint">Fuente: {media.source}</p>
                    )}
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

        {/* ─────────────────────────── importar / exportar */}
        <div className="mt-5">
          <SectionTitle>Copia de la configuracion</SectionTitle>
          <Card>
            <p className="text-[13px] text-muted">
              Exporta tu configuracion de videos para pasarla a otro dispositivo o guardarla como
              respaldo. Al importar, las entradas con URL invalida se descartan en lugar de
              guardarse rotas.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                disabled={configured.length === 0}
                onClick={() => {
                  download(
                    `bodyfit-videos-${today()}.json`,
                    exportMedia(exerciseMedia, new Date().toISOString()),
                  );
                  toast('Configuracion exportada');
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
                  const result = importMedia(
                    await file.text(),
                    new Set(EXERCISE_BY_ID.keys()),
                  );
                  update({ exerciseMedia: { ...exerciseMedia, ...result.media } });
                  toast(
                    result.skipped.length
                      ? `${result.imported} importados, ${result.skipped.length} descartados`
                      : `${result.imported} videos importados`,
                    result.skipped.length ? 'warn' : 'ok',
                  );
                } catch {
                  toast('El archivo no es una configuracion valida', 'error');
                }
                e.target.value = '';
              }}
            />
          </Card>
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

/* ────────────────────────────────────────────────────── editor de media */

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
  const [duration, setDuration] = useState(initial?.durationSeconds?.toString() ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [license, setLicense] = useState(initial?.license ?? '');
  const [reviewedAt, setReviewedAt] = useState(initial?.reviewedAt ?? today());
  const [verified, setVerified] = useState(initial?.verified ?? false);

  const ytId = parseYouTubeId(youtube);

  const media: ExerciseMedia = {
    ...(ytId ? { youtubeId: ytId } : {}),
    ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
    ...(webmUrl.trim() ? { videoWebmUrl: webmUrl.trim() } : {}),
    ...(poster.trim() ? { videoPoster: poster.trim() } : {}),
    ...(image.trim() ? { imageUrl: image.trim() } : {}),
    ...(Number(duration) > 0 ? { durationSeconds: Number(duration) } : {}),
    ...(source.trim() ? { source: source.trim() } : {}),
    ...(license.trim() ? { license: license.trim() } : {}),
    ...(reviewedAt ? { reviewedAt } : {}),
    ...(verified ? { verified: true } : {}),
  };

  const issues = validateMedia(media);
  const blocked = hasErrors(issues);
  const empty = Object.keys(media).length === 0;

  return (
    <Sheet
      open
      onClose={onClose}
      title={exercise?.name ?? 'Video'}
      height="full"
      footer={
        <Button
          variant="primary"
          size="lg"
          block
          disabled={empty || blocked}
          onClick={() => onSave(media)}
        >
          {blocked ? 'Corrige los errores para guardar' : 'Guardar video'}
        </Button>
      }
    >
      <div className="space-y-4">
        <ExerciseVideo media={media} title={exercise?.name ?? ''} />

        {issues.length > 0 && (
          <div className="space-y-1.5">
            {issues.map((i, idx) => (
              <p
                key={idx}
                className={cx(
                  'flex items-start gap-1.5 rounded-xl border px-2.5 py-2 text-[12px]',
                  i.severity === 'error'
                    ? 'border-rose/30 bg-rose/8 text-rose'
                    : 'border-carbs/30 bg-carbs/8 text-carbs',
                )}
              >
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {i.message}
              </p>
            ))}
          </div>
        )}

        <div>
          <Label hint={ytId ? `id: ${ytId}` : 'enlace o id'}>YouTube</Label>
          <Input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtu.be/..."
          />
        </div>

        <div>
          <Label hint="alojado por ti, https">Video MP4</Label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label hint="imagen de portada">Poster</Label>
            <Input
              value={poster}
              onChange={(e) => setPoster(e.target.value)}
              placeholder="https://.../poster.jpg"
            />
          </div>
          <div>
            <Label hint="segundos">Duracion</Label>
            <Input
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
              suffix="s"
            />
          </div>
        </div>

        <div>
          <Label hint="si no hay video">Imagen ilustrativa</Label>
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://.../imagen.jpg"
          />
        </div>

        <div className="rounded-2xl border border-line bg-surface2 p-3">
          <p className="mb-3 text-[11px] font-semibold tracking-wider text-faint uppercase">
            Procedencia y permiso
          </p>
          <div className="space-y-3">
            <div>
              <Label hint="autor o canal">Fuente</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Grabado por mi / Canal de mi coach"
              />
            </div>
            <div>
              <Label hint="o permiso concedido">Licencia</Label>
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="Propio / CC BY / Permiso del autor"
              />
            </div>
            <div>
              <Label>Fecha de revision</Label>
              <Input
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
              />
            </div>

            <button
              onClick={() => setVerified((v) => !v)}
              className={cx(
                'pressable flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left',
                verified ? 'border-brand/30 bg-brand/12' : 'border-line bg-surface',
              )}
            >
              <BadgeCheck
                size={16}
                className={cx('mt-0.5 shrink-0', verified ? 'text-brand' : 'text-faint')}
              />
              <span className={cx('text-[13px]', verified ? 'text-brand' : 'text-muted')}>
                {verified
                  ? 'Verificado: has confirmado la fuente y el permiso'
                  : 'Marcar como verificado: confirmo que reviso la fuente y tengo permiso o licencia para usar este video'}
              </span>
            </button>
          </div>
        </div>

        <p className="rounded-2xl border border-line bg-surface2 p-3 text-[12px] text-faint">
          Los videos solo se descargan cuando pulsas reproducir, no se reproducen solos y no se
          precachean para uso sin conexion: ocuparian demasiado espacio. Sin conexion, la guia
          escrita sigue disponible completa.
        </p>
      </div>
    </Sheet>
  );
}
