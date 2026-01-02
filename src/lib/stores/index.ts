/**
 * Store Index
 * Export all stores with namespace to avoid naming conflicts
 */

// Auth Store
export { useAuthStore } from './auth.store';
export type { AuthStore } from './auth.store';

// Patient Store
export { usePatientStore } from './patient.store';
export type { PatientStore } from './patient.store';

// Appointment Store
export { useAppointmentStore } from './appointment.store';
export type { AppointmentStore } from './appointment.store';
