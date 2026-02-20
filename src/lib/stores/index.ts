/**
 * Store Index
 * Export all stores with namespace to avoid naming conflicts
 */

// Auth Store
export { useAuthStore } from './auth.store';

// Patient Store
export { usePatientStore } from './patient.store';

// Appointment Store
export { useAppointmentStore } from './appointment.store';

// Setting Store
export { useSettingStore, settingSelectors } from './setting.store';

// UI Store
export { 
  useUIStore,
  useDrawer,
  useViewPreferences,
  useSidebar,
  useLoading,
  useIsAnyLoading,
} from './ui.store';
export type { 
  DrawerType,
  AgendaViewMode,
  PacientesViewMode,
  CalendarViewMode,
} from './ui.store';