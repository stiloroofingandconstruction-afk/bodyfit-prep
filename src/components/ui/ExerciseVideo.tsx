import { useState } from 'react';
import { AlertTriangle, BadgeCheck, Film, Play, WifiOff } from 'lucide-react';
import { fmtDuration } from '@/domain/media';
import { cx } from '@/lib/utils';
import type { ExerciseMedia } from '@/domain/types';

interface Props {
  media?: ExerciseMedia;
  /** Nombre del ejercicio: se usa en el texto alternativo. */
  title: string;
  className?: string;
}

/**
 * Reproductor de video del ejercicio.
 *
 * Principios:
 *  - NUNCA descarga nada hasta que el usuario pulsa reproducir (`preload="none"`
 *    y el iframe de YouTube no se monta hasta ese momento). El arranque de la
 *    app no se ve afectado.
 *  - Soporta MP4 y WebM propios, o un id de YouTube configurado por el usuario.
 *  - Sin video configurado muestra un marcador profesional, no un hueco roto.
 *  - Offline: si no hay conexion y el video es remoto, lo dice en vez de fallar.
 */
export function ExerciseVideo({ media, title, className }: Props) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasFile = !!(media?.videoUrl || media?.videoWebmUrl);
  const hasYouTube = !!media?.youtubeId;
  const hasVideo = hasFile || hasYouTube;
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;

  /* Sin video: marcador con la imagen si la hay */
  if (!hasVideo || failed) {
    return (
      <div
        className={cx(
          'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface2',
          className,
        )}
      >
        {media?.imageUrl ? (
          <img src={media.imageUrl} alt={title} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="px-6 text-center">
            <Film size={26} className="mx-auto mb-2 text-faint" />
            <p className="text-[13px] font-medium text-muted">
              {failed ? 'No se pudo cargar el video' : 'Sin video configurado'}
            </p>
            <p className="mt-1 text-[11px] text-faint">
              Puedes anadir el tuyo desde Ajustes → Videos de ejercicios
            </p>
          </div>
        )}
      </div>
    );
  }

  /* Video remoto sin conexion */
  if (!online && hasYouTube && !hasFile) {
    return (
      <div
        className={cx(
          'flex aspect-video w-full items-center justify-center rounded-2xl border border-line bg-surface2',
          className,
        )}
      >
        <div className="px-6 text-center">
          <WifiOff size={24} className="mx-auto mb-2 text-faint" />
          <p className="text-[13px] text-muted">Sin conexion</p>
          <p className="mt-1 text-[11px] text-faint">La guia escrita sigue disponible</p>
        </div>
      </div>
    );
  }

  /* Antes de pulsar: solo el poster. Cero bytes de video descargados. */
  if (!playing) {
    return (
      <div className={className}>
        <button
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir video de ${title}`}
          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface2"
        >
          {media?.videoPoster ? (
            <img
              src={media.videoPoster}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-70"
              loading="lazy"
            />
          ) : null}
          <span className="pressable relative flex size-16 items-center justify-center rounded-full bg-brand text-base shadow-lg">
            <Play size={26} className="ml-1" fill="currentColor" />
          </span>

          <span className="absolute bottom-2 left-3 flex items-center gap-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] text-white backdrop-blur">
            {media?.verified && <BadgeCheck size={11} className="text-brand" />}
            {hasFile ? 'Video propio' : 'YouTube'}
            {media?.durationSeconds != null && ` · ${fmtDuration(media.durationSeconds)}`}
          </span>
        </button>

        <MediaMeta media={media} />
      </div>
    );
  }

  /*
   * Reproduciendo. Sin `autoPlay`: el usuario ya pulso una vez, y dispararlo
   * solo provoca reproducciones accidentales con sonido en el movil.
   */
  if (hasFile) {
    return (
      <div className={className}>
        <video
          controls
          playsInline
          preload="metadata"
          poster={media?.videoPoster}
          onError={() => setFailed(true)}
          aria-label={`Video de ${title}`}
          className="aspect-video w-full rounded-2xl border border-line bg-black"
        >
          {media?.videoWebmUrl && <source src={media.videoWebmUrl} type="video/webm" />}
          {media?.videoUrl && <source src={media.videoUrl} type="video/mp4" />}
          Tu navegador no puede reproducir este video.
        </video>
        <MediaMeta media={media} />
      </div>
    );
  }

  return (
    <div className={className}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${media!.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
        title={`Video de ${title}`}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-full rounded-2xl border border-line bg-black"
      />
      <MediaMeta media={media} />
    </div>
  );
}

/**
 * Pie del video: fuente, licencia, fecha de revision y estado de verificacion.
 * Si el usuario no marco el video como verificado, se avisa de forma explicita.
 */
function MediaMeta({ media }: { media?: ExerciseMedia }) {
  if (!media) return null;
  const playable = media.videoUrl || media.videoWebmUrl || media.youtubeId;
  if (!playable) return null;

  const bits = [
    media.source && `Fuente: ${media.source}`,
    media.license && `Licencia: ${media.license}`,
    media.reviewedAt && `Revisado: ${media.reviewedAt}`,
  ].filter(Boolean);

  return (
    <div className="mt-1.5 space-y-1.5">
      {bits.length > 0 && <p className="px-1 text-[11px] text-faint">{bits.join(' · ')}</p>}
      {!media.verified && (
        <p className="flex items-start gap-1.5 rounded-lg border border-carbs/25 bg-carbs/8 px-2 py-1.5 text-[11px] text-carbs">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          Video sin verificar. Confirma que tienes permiso o licencia para usarlo y marcalo como
          verificado en Ajustes → Videos.
        </p>
      )}
    </div>
  );
}
