/**
 * Utilidades para formateo de fechas y horas
 * Centralizadas para mantener consistencia en toda la aplicación
 */

/**
 * Formatea una fecha completa con día de la semana, fecha y hora
 * @example "miércoles, 15 de enero de 2026, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea solo la hora
 * @example "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea solo la fecha sin hora
 * @example "miércoles, 15 de enero"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formatea fecha corta
 * @example "15/01/2026"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR');
}

/**
 * Calcula y formatea la duración entre dos fechas
 * @example "60 minutos"
 */
export function formatDuration(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMin = Math.round(durationMs / 60000);
  return `${durationMin} minutos`;
}

/**
 * Obtiene una fecha formateada en formato ISO para el input type="date"
 * @example "2026-01-15"
 */
export function formatISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
