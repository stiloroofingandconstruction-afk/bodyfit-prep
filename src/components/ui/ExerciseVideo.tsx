import { useState } from 'react';
import { Film, Play, WifiOff } from 'lucide-react';
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
      <button
        onClick={() => setPlaying(true)}
        aria-label={`Reproducir video de ${title}`}
        className={cx(
          'group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface2',
          className,
        )}
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
        <span className="absolute bottom-2 left-3 text-[11px] text-muted">
          {hasFile ? 'Video propio' : 'YouTube'}
        </span>
      </button>
    );
  }

  /* Reproduciendo */
  if (hasFile) {
    return (
      <video
        controls
        autoPlay
        playsInline
        preload="none"
        poster={media?.videoPoster}
        onError={() => setFailed(true)}
        aria-label={`Video de ${title}`}
        className={cx('aspect-video w-full rounded-2xl border border-line bg-black', className)}
      >
        {media?.videoWebmUrl && <source src={media.videoWebmUrl} type="video/webm" />}
        {media?.videoUrl && <source src={media.videoUrl} type="video/mp4" />}
        Tu navegador no puede reproducir este video.
      </video>
    );
  }

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${media!.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
      title={`Video de ${title}`}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
      className={cx('aspect-video w-full rounded-2xl border border-line bg-black', className)}
    />
  );
}
