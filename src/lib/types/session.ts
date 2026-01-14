import type { PatientInfo, TherapistInfo, PaymentInfo } from './common';

/**
 * Session Status
 * Estados posibles de una sesión de terapia
 */
export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Session Type
 * Tipo de sesión (presencial o remota)
 */
export enum SessionType {
  PRESENTIAL = 'presential',
  REMOTE = 'remote'
}

/**
 * Session Response
 * Estructura de respuesta del backend para una sesión
 */
export interface SessionResponse {
  id: string;
  scheduledFrom: string;  // ISO 8601 date string
  scheduledTo: string;    // ISO 8601 date string
  status: SessionStatus;
  sessionSummary?: string;
  actualDuration?: number; // Duration in minutes
  externalEventId?: string; // Google Calendar event ID
  cost?: number;
  sessionType: SessionType;
  meetLink?: string; // Only for remote sessions
  createdAt: string;
  updatedAt: string;
  therapist?: TherapistInfo;
  patient?: PatientInfo;
  payments?: PaymentInfo[];
}

/**
 * Create Session DTO
 * Estructura para crear una nueva sesión
 */
export interface CreateSessionDto {
  scheduledFrom: string;   // ISO 8601 date string
  scheduledTo: string;     // ISO 8601 date string
  patientId: string;
  attendeeEmail: string;   // Required for calendar invites
  status?: SessionStatus;
  sessionSummary?: string;
  type: SessionType;
  cost?: number;
}

/**
 * Update Session DTO
 * Estructura para actualizar una sesión existente
 */
export interface UpdateSessionDto {
  scheduledFrom?: string;
  scheduledTo?: string;
  status?: SessionStatus;
  sessionSummary?: string;
  cost?: number;
  type?: SessionType;
}

/**
 * Session con información extendida para la UI
 * Incluye datos computados y formateos para la interfaz
 */
export interface SessionUI extends SessionResponse {
  // Computed properties para la UI
  patientName?: string;
  duration?: number; // en minutos
  isPast?: boolean;
  isToday?: boolean;
  formattedDate?: string;
  formattedTime?: string;
}
