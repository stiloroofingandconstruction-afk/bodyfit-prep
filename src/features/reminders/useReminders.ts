import { useEffect, useMemo, useState } from 'react';
import { alive } from '@/store/persist';
import { useSettingsStore } from '@/store/settingsStore';
import type { Reminder } from '@bodyfit/domain/prepTypes';

/**
 * Recordatorios internos.
 *
 * Devuelve los recordatorios cuya hora ya paso hoy y que siguen activos. Es una
 * implementacion deliberadamente simple y sin permisos: funciona siempre, sin
 * depender de que el navegador conceda notificaciones.
 *
 * ARQUITECTURA FUTURA — notificaciones push
 * Cuando se active, el flujo sera:
 *   1. `Notification.requestPermission()` desde un gesto del usuario.
 *   2. `registration.pushManager.subscribe()` con la clave VAPID publica.
 *   3. Guardar la suscripcion en el backend (Supabase) junto al `userId`.
 *   4. Un job programado envia el push a la hora del recordatorio.
 * Nada de eso cambia este hook: solo se anadira una capa por encima.
 */
export function usePendingReminders(): Reminder[] {
  const reminders = useSettingsStore((s) => s.reminders);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Un minuto es resolucion de sobra para un recordatorio
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const weekday = now.getDay();

    return alive(reminders).filter((r) => {
      if (!r.enabled) return false;
      if (r.days.length > 0 && !r.days.includes(weekday)) return false;
      const [h, m] = r.time.split(':').map(Number);
      const target = (h ?? 0) * 60 + (m ?? 0);
      // Vigente durante las 3 horas siguientes a su hora
      return minutes >= target && minutes - target <= 180;
    });
  }, [reminders, now]);
}

/** Soporte de notificaciones del navegador. Aun no se solicita permiso. */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}
