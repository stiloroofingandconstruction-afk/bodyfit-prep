import { useEffect, useMemo, useState } from 'react';
import { Camera, Columns2, Lock, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Chip, EmptyState } from '@/components/ui/Misc';
import { Label, Select } from '@/components/ui/Field';
import { ProgressTabs } from '@/features/body/ProgressTabs';
import { ANGLE_LABEL, type PhotoAngle, type ProgressPhoto } from '@/domain/prepTypes';
import { compressImage, photoURL, putPhoto } from '@/services/blobStore';
import { shortDate, today } from '@/lib/date';
import { cx, uid } from '@/lib/utils';
import { usePhotoStore } from '@/store/photoStore';
import { useActivePrep, useCountdown, useCurrentWeight, usePhotos } from '@/store/selectors';
import { toast } from '@/store/uiStore';

const ANGLES = Object.keys(ANGLE_LABEL) as PhotoAngle[];

/** Cachea las URLs de objeto y las revoca al desmontar. */
function usePhotoURLs(photos: ProgressPhoto[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const map = new Map<string, string>();
      for (const p of photos) {
        const url = await photoURL(p.blobId);
        if (url) {
          created.push(url);
          map.set(p.id, url);
        }
      }
      if (!cancelled) setUrls(map);
    })();
    return () => {
      cancelled = true;
      created.forEach(URL.revokeObjectURL);
    };
  }, [photos]);

  return urls;
}

export default function PhotosPage() {
  const photos = usePhotos();
  const addPhoto = usePhotoStore((s) => s.addPhoto);
  const removePhoto = usePhotoStore((s) => s.removePhoto);
  const weight = useCurrentWeight();
  const prep = useActivePrep();
  const cd = useCountdown();

  const [angle, setAngle] = useState<PhotoAngle | null>(null);
  const [comparing, setComparing] = useState(false);

  const filtered = useMemo(
    () => (angle ? photos.filter((p) => p.angle === angle) : photos),
    [photos, angle],
  );
  const urls = usePhotoURLs(filtered);

  const onPick = async (file: File | undefined, targetAngle: PhotoAngle) => {
    if (!file) return;
    const blob = await compressImage(file);
    const blobId = uid('photo');
    await putPhoto(blobId, blob);
    addPhoto({
      date: today(),
      angle: targetAngle,
      blobId,
      weight,
      ...(prep && cd ? { prepWeek: Math.max(0, cd.weeksOut) } : {}),
    });
    toast(`Foto de ${ANGLE_LABEL[targetAngle].toLowerCase()} guardada`);
  };

  return (
    <>
      <PageHeader title="Fotos de progreso" subtitle={`${photos.length} fotos guardadas`} back />

      <Page>
        <ProgressTabs />

        <Card className="border-line/70">
          <div className="flex gap-2.5">
            <Lock size={15} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[12px] text-muted">
              Las fotos se guardan cifradas por el navegador en este dispositivo (IndexedDB) y no se
              suben a ningun servidor. Solo salen de aqui si tu las exportas.
            </p>
          </div>
        </Card>

        {/* ─────────────────────────────────────── captura por angulo */}
        <div className="mt-4">
          <SectionTitle>Anadir foto de hoy</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {ANGLES.map((a) => (
              <label
                key={a}
                className="pressable flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed border-line bg-surface px-3 py-3 text-[14px] text-muted"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPick(e.target.files?.[0], a)}
                />
                <Plus size={15} className="shrink-0 text-brand" />
                <span className="truncate">{ANGLE_LABEL[a]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="scroll-momentum -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={angle === null} onClick={() => setAngle(null)}>
              Todos
            </Chip>
            {ANGLES.map((a) => (
              <Chip key={a} active={angle === a} onClick={() => setAngle(angle === a ? null : a)}>
                {ANGLE_LABEL[a]}
              </Chip>
            ))}
          </div>
        </div>

        {photos.length >= 2 && (
          <Button variant="secondary" block className="mt-3" onClick={() => setComparing(true)}>
            <Columns2 size={16} />
            Comparar lado a lado
          </Button>
        )}

        {/* ─────────────────────────────────────── galeria */}
        <div className="mt-5">
          <SectionTitle>Galeria</SectionTitle>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Camera size={22} />}
              title="Sin fotos"
              description="Misma luz, misma pose, mismo momento del dia. Las fotos ven lo que la bascula no."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((p) => (
                <div key={p.id} className="relative">
                  {urls.get(p.id) ? (
                    <img
                      src={urls.get(p.id)}
                      alt={`${ANGLE_LABEL[p.angle]} ${p.date}`}
                      className="aspect-[3/4] w-full rounded-xl border border-line object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-surface2" />
                  )}
                  <span className="absolute inset-x-1 bottom-1 truncate rounded-md bg-black/60 px-1 py-0.5 text-center text-[9px] backdrop-blur">
                    {shortDate(p.date)}
                    {p.prepWeek != null && ` · S-${p.prepWeek}`}
                  </span>
                  <button
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
                    aria-label="Eliminar foto"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page>

      {comparing && <CompareSheet photos={photos} onClose={() => setComparing(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── comparacion */

function CompareSheet({ photos, onClose }: { photos: ProgressPhoto[]; onClose: () => void }) {
  const [angle, setAngle] = useState<PhotoAngle>(photos[0]?.angle ?? 'frente');

  const ofAngle = useMemo(
    () => photos.filter((p) => p.angle === angle).sort((a, b) => a.date.localeCompare(b.date)),
    [photos, angle],
  );

  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  useEffect(() => {
    setLeftId(ofAngle[0]?.id ?? '');
    setRightId(ofAngle[ofAngle.length - 1]?.id ?? '');
  }, [ofAngle]);

  const selected = useMemo(
    () => ofAngle.filter((p) => p.id === leftId || p.id === rightId),
    [ofAngle, leftId, rightId],
  );
  const urls = usePhotoURLs(selected);

  const left = ofAngle.find((p) => p.id === leftId);
  const right = ofAngle.find((p) => p.id === rightId);
  const [slider, setSlider] = useState(50);

  return (
    <Sheet open onClose={onClose} title="Comparar progreso" height="full">
      <div className="mb-3 flex flex-wrap gap-2">
        {ANGLES.map((a) => (
          <Chip key={a} active={angle === a} onClick={() => setAngle(a)}>
            {ANGLE_LABEL[a]}
          </Chip>
        ))}
      </div>

      {ofAngle.length < 2 ? (
        <EmptyState
          title="Necesitas dos fotos"
          description={`Solo hay ${ofAngle.length} foto de ${ANGLE_LABEL[angle].toLowerCase()}. Anade otra para comparar.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Antes</Label>
              <Select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
                {ofAngle.map((p) => (
                  <option key={p.id} value={p.id}>
                    {shortDate(p.date)}
                    {p.weight ? ` · ${p.weight.toFixed(1)} kg` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Ahora</Label>
              <Select value={rightId} onChange={(e) => setRightId(e.target.value)}>
                {ofAngle.map((p) => (
                  <option key={p.id} value={p.id}>
                    {shortDate(p.date)}
                    {p.weight ? ` · ${p.weight.toFixed(1)} kg` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Lado a lado */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Framed photo={left} url={left ? urls.get(left.id) : undefined} label="Antes" />
            <Framed photo={right} url={right ? urls.get(right.id) : undefined} label="Ahora" />
          </div>

          {/* Superposicion con control deslizante */}
          <div className="mt-5">
            <SectionTitle>Superposicion</SectionTitle>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-surface2">
              {left && urls.get(left.id) && (
                <img src={urls.get(left.id)} alt="Antes" className="absolute inset-0 size-full object-cover" />
              )}
              {right && urls.get(right.id) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
                >
                  <img src={urls.get(right.id)} alt="Ahora" className="size-full object-cover" />
                </div>
              )}
              <div
                className="absolute inset-y-0 w-0.5 bg-brand"
                style={{ left: `${slider}%` }}
                aria-hidden
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              aria-label="Control de comparacion"
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
              style={{
                background: `linear-gradient(to right, var(--color-line) ${slider}%, var(--color-brand) ${slider}%)`,
              }}
            />
            <p className="mt-2 text-center text-[11px] text-faint">
              Arrastra para desvelar la foto reciente. El encuadre solo coincide si tomaste ambas en
              la misma posicion.
            </p>
          </div>

          {left && right && (
            <Card className="mt-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">Diferencia de peso</span>
                <span className="tabular font-semibold">
                  {left.weight != null && right.weight != null
                    ? `${(right.weight - left.weight > 0 ? '+' : '')}${(right.weight - left.weight).toFixed(1)} kg`
                    : '—'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-muted">Dias transcurridos</span>
                <span className="tabular font-semibold">
                  {Math.round(
                    (new Date(right.date).getTime() - new Date(left.date).getTime()) / 86400000,
                  )}
                </span>
              </div>
            </Card>
          )}
        </>
      )}
    </Sheet>
  );
}

function Framed({
  photo,
  url,
  label,
}: {
  photo?: ProgressPhoto;
  url?: string;
  label: string;
}) {
  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-surface2">
        {url ? (
          <img src={url} alt={label} className="size-full object-cover" />
        ) : (
          <div className="size-full animate-pulse bg-surface2" />
        )}
        <span className={cx('absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] backdrop-blur')}>
          {label}
        </span>
      </div>
      <p className="mt-1 text-center text-[11px] text-faint">
        {photo ? shortDate(photo.date) : '—'}
        {photo?.weight != null && ` · ${photo.weight.toFixed(1)} kg`}
      </p>
    </div>
  );
}
