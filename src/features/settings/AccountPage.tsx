import { useCallback, useEffect, useState } from 'react';
import { CloudOff, LogOut, Mail, RefreshCw, ShieldCheck, TriangleAlert, Upload } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import {
  applyAdapterSelection,
  currentSession,
  initSync,
  setSyncFlag,
  subscribeToSync,
  syncFlag,
  syncStatus,
} from '@/services/sync';
import { syncNow } from '@/services/sync/scheduler';
import {
  captureRedirectSession,
  maskEmail,
  sendMagicLink,
  signOut,
  verifyOtp,
} from '@/services/sync/auth';
import { adoptLocalData, summarizeLocalData, type AdoptionSummary } from '@/services/sync/adoption';
import { createBackup } from '@/services/backup';
import { download } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { fmtDateTime } from '@/lib/date';
import { toast } from '@/store/uiStore';

/**
 * Cuenta y sincronizacion.
 *
 * La aplicacion funciona entera sin cuenta y esta pantalla no insiste en lo
 * contrario: "Seguir sin cuenta" no es un boton escondido, es el estado normal.
 * Una cuenta sirve para usar la aplicacion en dos dispositivos, y quien solo usa
 * uno no la necesita para nada.
 */
export default function AccountPage() {
  const [session, setSession] = useState(() => captureRedirectSession() ?? currentSession());
  const [status, setStatus] = useState(() => syncStatus());
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdoptionSummary | null>(null);

  const refresh = useCallback(() => setStatus(syncStatus()), []);

  useEffect(() => {
    applyAdapterSelection();
    void initSync().then(refresh);
    return subscribeToSync(refresh);
  }, [refresh]);

  /* ── entrar ── */

  const pedirEnlace = async () => {
    if (!email.includes('@')) return toast('Escribe un correo valido', 'error');
    setBusy('enlace');
    try {
      await sendMagicLink(email.trim());
      setSent(true);
      toast('Te hemos enviado un enlace y un codigo');
    } catch (err) {
      toast(String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const comprobarCodigo = async () => {
    setBusy('codigo');
    try {
      const next = await verifyOtp(email.trim(), code.trim());
      setSession(next);
      setSent(false);
      setCode('');
      toast('Sesion iniciada');
      /*
       * Iniciar sesion NO adopta los datos automaticamente. Se ensena el
       * resumen y decide la persona: subir ocho meses de historial a una cuenta
       * es una decision suya, no un efecto secundario de entrar.
       */
      setSummary(summarizeLocalData());
    } catch (err) {
      toast(String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  /* ── salir ── */

  const salir = () => {
    signOut();
    setSession(null);
    setSummary(null);
    refresh();
    // No se borra nada local: la persona conserva su historial entero.
    toast('Sesion cerrada. Tus datos siguen en este dispositivo.');
  };

  /* ── migrar ── */

  const migrar = async () => {
    setBusy('migrar');
    try {
      /*
       * Copia de seguridad ANTES de tocar nada. No es opcional ni configurable:
       * es la red que hace que un fallo aqui sea recuperable.
       */
      const copia = await createBackup();
      download(copia.filename, copia.json);
      const result = await adoptLocalData();
      setSummary(null);
      toast(`${result.queued} registros en cola para subir`);
      void syncNow().then(refresh);
    } catch (err) {
      toast(String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const sincronizando = syncFlag() !== 'disabled';

  return (
    <>
      <PageHeader back title="Cuenta y sincronizacion" subtitle="Usar BodyFit en dos dispositivos" />

      <Page>
        {/* ═══════════════════════════════════════════════════════ estado ══ */}
        <Card>
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                session ? 'bg-brand/15 text-brand' : 'bg-surface2 text-faint'
              }`}
            >
              {session ? <ShieldCheck size={20} /> : <CloudOff size={20} />}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              {session ? (
                <>
                  <p className="font-medium">{maskEmail(session.email)}</p>
                  <p className="mt-1 text-xs text-faint">
                    {sincronizando ? 'Sincronizando' : 'Sincronizacion en pausa'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Sin cuenta</p>
                  <p className="mt-1 text-xs text-faint">
                    Todo funciona igual. Tus datos viven en este dispositivo y en las copias
                    que descargas.
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════ entrar ══ */}
        {!session && (
          <>
            <SectionTitle>Entrar</SectionTitle>
            <Card>
              <p className="mb-3 text-xs text-faint">
                Sin contrasena. Te enviamos un correo para entrar.
              </p>
              <Label>Correo</Label>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />

              {sent && (
                <div className="mt-3">
                  {/*
                    Sin `maxLength` y sin decir cuantos digitos son.
                    La longitud del codigo la decide el servidor —Supabase la
                    tiene configurable— y el nuestro manda ocho, no seis. Un
                    campo que promete seis y recorta a seis habria hecho
                    imposible entrar, y el mensaje de error habria culpado al
                    codigo en vez de al campo.
                  */}
                  <Label>Codigo del correo</Label>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="El codigo del correo"
                  />
                  <p className="mt-2 text-xs text-faint">
                    Si tienes BodyFit instalada en el telefono, usa el codigo: el enlace del
                    correo abre Safari y la sesion acabaria fuera de la aplicacion. Si el
                    correo solo trae enlace y no codigo, abrelo desde el navegador.
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button onClick={() => void pedirEnlace()} disabled={busy !== null}>
                  <Mail size={16} /> {sent ? 'Reenviar' : 'Enviar enlace'}
                </Button>
                {sent && (
                  <Button variant="secondary" onClick={() => void comprobarCodigo()} disabled={busy !== null}>
                    Entrar con el codigo
                  </Button>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════ migrar lo local ══ */}
        {session && summary && summary.totalEntities > 0 && (
          <>
            <SectionTitle>Subir lo que ya tienes</SectionTitle>
            <Card>
              {summary.conflictOfOwner ? (
                <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Estos datos son de otra cuenta</p>
                    <p className="mt-1">
                      No se fusionan. Mezclar los datos de dos personas no se puede deshacer
                      despues. Descarga una copia y empieza limpio, o vuelve a entrar con la
                      cuenta anterior.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-faint">
                    Este dispositivo tiene <b>{summary.totalEntities} registros</b> sin subir.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs">
                    {summary.byCollection.map(({ collection, entities }) => (
                      <li key={collection} className="flex justify-between">
                        <span className="text-faint">{collection}</span>
                        <span className="font-mono">{entities}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-lg bg-surface2 p-2 text-xs text-faint">
                    Antes de subir nada se descarga una copia de seguridad completa. No se
                    borra nada de este dispositivo, y repetirlo no duplica registros.
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => void migrar()} disabled={busy !== null}>
                      <Upload size={16} />
                      {busy === 'migrar' ? 'Subiendo...' : 'Descargar copia y subir'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </>
        )}

        {/* ═════════════════════════════════════════════ sincronizacion ══ */}
        {session && (
          <>
            <SectionTitle>Sincronizacion</SectionTitle>
            <Card>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-faint">Dispositivo</dt>
                <dd className="truncate text-right font-mono">{status.deviceId.slice(0, 13)}</dd>
                <dt className="text-faint">Ultima vez</dt>
                <dd className="text-right">
                  {status.lastSyncAt
                    ? fmtDateTime(new Date(status.lastSyncAt).toISOString())
                    : 'nunca'}
                </dd>
                <dt className="text-faint">Pendientes</dt>
                <dd className="text-right font-mono">
                  {status.outbox.pending + status.outbox.failed}
                </dd>
              </dl>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => void syncNow().then(refresh)}>
                  <RefreshCw size={16} /> Sincronizar ahora
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSyncFlag(sincronizando ? 'disabled' : 'internal');
                    applyAdapterSelection();
                    refresh();
                  }}
                >
                  {sincronizando ? 'Pausar' : 'Reanudar'}
                </Button>
              </div>
            </Card>

            {/*
              Guion de la prueba fisica. Vive aqui y no en el diagnostico
              porque es lo que se abre con el movil en la mano, no cuando algo
              falla.
            */}
            <Card>
              <Link
                to="/ajustes/cuenta/dos-dispositivos"
                className="pressable flex items-center justify-between rounded-xl px-1 py-1 text-sm"
              >
                <span>
                  <span className="font-medium">Prueba de dos dispositivos</span>
                  <span className="block text-xs text-faint">
                    33 pasos guiados. Nada se marca solo.
                  </span>
                </span>
                <span className="text-faint">›</span>
              </Link>
            </Card>

            <Card>
              <Button variant="ghost" onClick={salir}>
                <LogOut size={16} /> Cerrar sesion
              </Button>
              <p className="mt-2 text-xs text-faint">
                Cerrar sesion no borra nada de este dispositivo.
              </p>
            </Card>
          </>
        )}
      </Page>
    </>
  );
}
