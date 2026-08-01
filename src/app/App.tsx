import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { BackupReminder } from './BackupReminder';
import { Toaster } from '@/components/ui/Misc';
import { useHydrated } from '@/store/selectors';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import { logError } from '@/services/errorLog';

// Cada pantalla es su propio chunk: el arranque solo carga el Dashboard.
const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'));
const Nutrition = lazy(() => import('@/features/nutrition/NutritionPage'));
const Training = lazy(() => import('@/features/training/TrainingPage'));
const ActiveWorkout = lazy(() => import('@/features/training/ActiveWorkoutPage'));
const Body = lazy(() => import('@/features/body/BodyPage'));
const Checkin = lazy(() => import('@/features/checkin/CheckinPage'));
const History = lazy(() => import('@/features/history/HistoryPage'));
const Settings = lazy(() => import('@/features/settings/SettingsPage'));
const Onboarding = lazy(() => import('@/features/onboarding/OnboardingPage'));

// Suite de competencia
const Competition = lazy(() => import('@/features/competition/CompetitionPage'));
const PeakWeek = lazy(() => import('@/features/competition/PeakWeekPage'));
const ShowDay = lazy(() => import('@/features/competition/ShowDayPage'));
const PostShow = lazy(() => import('@/features/competition/PostShowPage'));
const DailyLog = lazy(() => import('@/features/daily/DailyLogPage'));
const Cardio = lazy(() => import('@/features/cardio/CardioPage'));
const Posing = lazy(() => import('@/features/posing/PosingPage'));
const Photos = lazy(() => import('@/features/photos/PhotosPage'));
const ExerciseLibrary = lazy(() => import('@/features/exercises/ExerciseLibraryPage'));
const ExerciseDetail = lazy(() => import('@/features/exercises/ExerciseDetailPage'));
const Reports = lazy(() => import('@/features/reports/ReportsPage'));
const VideoSettings = lazy(() => import('@/features/settings/VideoSettingsPage'));
const RemindersPage = lazy(() => import('@/features/reminders/RemindersPage'));
const DataBackup = lazy(() => import('@/features/settings/DataBackupPage'));
const Diagnostics = lazy(() => import('@/features/settings/DiagnosticsPage'));
const DeviceTest = lazy(() => import('@/features/settings/DeviceTestPage'));

export function App() {
  const hydrated = useHydrated();
  const onboarded = useProfileStore((s) => s.profile.onboarded);
  const locale = useSettingsStore((s) => s.locale);
  const devMode = useSettingsStore((s) => s.devMode);

  useGlobalErrorLogging();

  if (!hydrated) return <Splash />;

  return (
    <ErrorBoundary label="raiz">
      {/*
        `key={locale}` remonta el arbol al cambiar de idioma. `t()` lee un modulo,
        no un contexto, asi que sin esto las pantallas ya dibujadas conservarian
        el idioma anterior hasta que algo las volviera a renderizar.
      */}
      <Suspense key={locale} fallback={<Splash />}>
        {!onboarded ? (
          <Onboarding />
        ) : (
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/nutricion" element={<Nutrition />} />
              <Route path="/entrenamiento" element={<Training />} />
              <Route path="/cuerpo" element={<Body />} />
              <Route path="/checkin" element={<Checkin />} />
              <Route path="/historial" element={<History />} />
              <Route path="/fotos" element={<Photos />} />
              <Route path="/ajustes" element={<Settings />} />

              {/* competencia */}
              <Route path="/competencia" element={<Competition />} />
              <Route path="/competencia/peak-week" element={<PeakWeek />} />
              <Route path="/competencia/dia-del-show" element={<ShowDay />} />
              <Route path="/competencia/post-show" element={<PostShow />} />
              <Route path="/diario" element={<DailyLog />} />
              <Route path="/cardio" element={<Cardio />} />
              <Route path="/posing" element={<Posing />} />

              {/* ejercicios */}
              <Route path="/ejercicios" element={<ExerciseLibrary />} />
              <Route path="/ejercicios/:id" element={<ExerciseDetail />} />

              {/* herramientas */}
              <Route path="/informes" element={<Reports />} />
              <Route path="/ajustes/recordatorios" element={<RemindersPage />} />
              <Route path="/ajustes/datos" element={<DataBackup />} />

              {/*
                Herramientas de mantenimiento. No son funciones del producto:
                sin el modo desarrollador activo la ruta ni siquiera existe,
                asi que un enlace viejo o un marcador acaban en Ajustes en vez
                de en una pantalla de diagnostico.
              */}
              {devMode ? (
                <>
                  <Route path="/ajustes/videos" element={<VideoSettings />} />
                  <Route path="/ajustes/diagnostico" element={<Diagnostics />} />
                  <Route path="/ajustes/diagnostico/iphone" element={<DeviceTest />} />
                </>
              ) : (
                <Route path="/ajustes/*" element={<Navigate to="/ajustes" replace />} />
              )}
            </Route>

            {/* La sesion en curso ocupa toda la pantalla: sin barra de pestanas */}
            <Route path="/entrenamiento/activo" element={<ActiveWorkout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Suspense>
      <BackupReminder />
      <Toaster />
    </ErrorBoundary>
  );
}

/**
 * Anota los fallos que no pasan por React: promesas rechazadas sin capturar y
 * errores sueltos. Sin esto, un fallo dentro de una operacion asincrona
 * desaparece de la consola y el usuario se queda sin nada que ensenar.
 */
function useGlobalErrorLogging(): void {
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => logError('promesa', e.reason);
    const onError = (e: ErrorEvent) => logError('ventana', e.error ?? e.message);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base">
      <div className="size-12 animate-[pulse-ring_1.4s_ease-in-out_infinite] rounded-2xl bg-brand" />
      <p className="text-[13px] tracking-widest text-faint uppercase">BodyFit Prep</p>
    </div>
  );
}
