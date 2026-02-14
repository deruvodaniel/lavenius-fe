import { SessionStatus } from '../types/session';

/**
 * Constantes relacionadas con estados de sesión
 * Centralizadas para mantener consistencia visual en toda la aplicación
 */

/**
 * Colores hexadecimales para los estados de sesión
 * Usados en el calendario FullCalendar
 */
export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  [SessionStatus.PENDING]: '#f59e0b',      // Orange/Amber 500
  [SessionStatus.CONFIRMED]: '#3b82f6',    // Blue 500
  [SessionStatus.COMPLETED]: '#10b981',    // Green 500
  [SessionStatus.CANCELLED]: '#ef4444',    // Red 500
} as const;

/**
 * Clases CSS de Tailwind para badges de estado de sesión
 * Usados en listas y componentes de UI
 */
export const SESSION_STATUS_BADGE_CLASSES: Record<SessionStatus, string> = {
  [SessionStatus.PENDING]: 'bg-orange-100 text-orange-700',
  [SessionStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
  [SessionStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [SessionStatus.CANCELLED]: 'bg-red-100 text-red-700',
} as const;

/**
 * Textos legibles para los estados de sesión
 */
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  [SessionStatus.PENDING]: 'Agendada',
  [SessionStatus.CONFIRMED]: 'Confirmada',
  [SessionStatus.COMPLETED]: 'Completada',
  [SessionStatus.CANCELLED]: 'Cancelada',
} as const;
