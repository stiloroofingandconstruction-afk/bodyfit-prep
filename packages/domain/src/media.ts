/**
 * Validacion de la configuracion de video.
 *
 * La app NUNCA inventa URLs ni incrusta videos de terceros por su cuenta. Todo
 * lo que se reproduce lo ha pegado el usuario, y aqui se comprueba que al menos
 * tiene forma de URL valida y protocolo seguro.
 */
import type { ExerciseMedia } from './types';

export interface MediaIssue {
  field: keyof ExerciseMedia;
  message: string;
  severity: 'error' | 'aviso';
}

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
    /youtube-nocookie\.com\/embed\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = value.match(p);
    if (m) return m[1];
  }
  return null;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    // http:// no vale: la app se sirve por https y el navegador bloquearia el recurso
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

const VIDEO_EXT = /\.(mp4|m4v|webm|mov)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|avif|gif)(\?|#|$)/i;

/** Comprueba la configuracion antes de guardarla. */
export function validateMedia(media: ExerciseMedia): MediaIssue[] {
  const issues: MediaIssue[] = [];

  const checkUrl = (
    field: keyof ExerciseMedia,
    value: string | undefined,
    label: string,
    ext: RegExp,
    extLabel: string,
  ) => {
    if (!value) return;
    if (!isHttpsUrl(value)) {
      issues.push({
        field,
        message: `${label}: debe ser una URL completa que empiece por https://`,
        severity: 'error',
      });
      return;
    }
    if (!ext.test(value)) {
      issues.push({
        field,
        message: `${label}: la URL no termina en ${extLabel}. Comprueba que apunta al archivo y no a una pagina.`,
        severity: 'aviso',
      });
    }
  };

  checkUrl('videoUrl', media.videoUrl, 'Video MP4', VIDEO_EXT, '.mp4');
  checkUrl('videoWebmUrl', media.videoWebmUrl, 'Video WebM', /\.webm(\?|#|$)/i, '.webm');
  checkUrl('videoPoster', media.videoPoster, 'Poster', IMAGE_EXT, 'una extension de imagen');
  checkUrl('imageUrl', media.imageUrl, 'Imagen', IMAGE_EXT, 'una extension de imagen');

  if (media.youtubeId && !/^[\w-]{11}$/.test(media.youtubeId)) {
    issues.push({
      field: 'youtubeId',
      message: 'El id de YouTube debe tener 11 caracteres. Pega el enlace completo y lo extraemos.',
      severity: 'error',
    });
  }

  if (media.durationSeconds != null && (media.durationSeconds <= 0 || media.durationSeconds > 3600)) {
    issues.push({
      field: 'durationSeconds',
      message: 'La duracion debe estar entre 1 segundo y 60 minutos.',
      severity: 'error',
    });
  }

  if (media.reviewedAt && !/^\d{4}-\d{2}-\d{2}$/.test(media.reviewedAt)) {
    issues.push({ field: 'reviewedAt', message: 'Fecha no valida.', severity: 'error' });
  }

  if (hasPlayable(media) && !media.source) {
    issues.push({
      field: 'source',
      message: 'Sin fuente declarada. Anota de donde sale el video y con que permiso lo usas.',
      severity: 'aviso',
    });
  }

  if (hasPlayable(media) && !media.verified) {
    issues.push({
      field: 'verified',
      message: 'Sin verificar. Se mostrara un aviso al reproducirlo.',
      severity: 'aviso',
    });
  }

  return issues;
}

export function hasPlayable(media: ExerciseMedia | undefined): boolean {
  return !!(media?.videoUrl || media?.videoWebmUrl || media?.youtubeId);
}

export function hasErrors(issues: MediaIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ─────────────────────────────── importacion y exportacion ────────────── */

export interface MediaBundle {
  app: 'BodyFit Prep';
  kind: 'exercise-media';
  version: 1;
  exportedAt: string;
  media: Record<string, ExerciseMedia>;
}

export function exportMedia(
  media: Record<string, ExerciseMedia>,
  exportedAt: string,
): string {
  const bundle: MediaBundle = {
    app: 'BodyFit Prep',
    kind: 'exercise-media',
    version: 1,
    exportedAt,
    media,
  };
  return JSON.stringify(bundle, null, 2);
}

export interface ImportResult {
  media: Record<string, ExerciseMedia>;
  imported: number;
  skipped: { id: string; reason: string }[];
}

/**
 * Importa una configuracion de videos.
 * Descarta las entradas con errores en vez de guardarlas rotas.
 */
export function importMedia(json: string, knownIds: ReadonlySet<string>): ImportResult {
  const parsed = JSON.parse(json) as Partial<MediaBundle>;
  const source = parsed?.media ?? (parsed as unknown as Record<string, ExerciseMedia>);
  if (!source || typeof source !== 'object') {
    throw new Error('El archivo no contiene una configuracion de videos');
  }

  const media: Record<string, ExerciseMedia> = {};
  const skipped: { id: string; reason: string }[] = [];

  for (const [id, value] of Object.entries(source)) {
    if (!knownIds.has(id)) {
      skipped.push({ id, reason: 'ejercicio desconocido' });
      continue;
    }
    if (!value || typeof value !== 'object') {
      skipped.push({ id, reason: 'formato invalido' });
      continue;
    }
    const issues = validateMedia(value as ExerciseMedia);
    if (hasErrors(issues)) {
      skipped.push({ id, reason: issues.find((i) => i.severity === 'error')!.message });
      continue;
    }
    media[id] = value as ExerciseMedia;
  }

  return { media, imported: Object.keys(media).length, skipped };
}
