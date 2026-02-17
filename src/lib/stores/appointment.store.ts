import { create } from 'zustand';
import { appointmentService } from '../services/appointment.service';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../types/api.types';
import { ApiClientError } from '../api/client';

/**
 * Appointment Store State
 */
interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Appointment Store Actions
 */
interface AppointmentActions {
  fetchAppointments: () => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  fetchByPatientId: (patientId: string) => Promise<void>;
  fetchUpcoming: (limit?: number) => Promise<void>;
  createAppointment: (data: CreateAppointmentDto) => Promise<Appointment>;
  updateAppointment: (id: string, data: UpdateAppointmentDto) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  clearError: () => void;
}

/**
 * Appointment Store Type
 */
type AppointmentStore = AppointmentState & AppointmentActions;

/**
 * Initial State
 */
const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,
};

/**
 * Appointment Store
 * Maneja el estado de citas global
 */
export const useAppointmentStore = create<AppointmentStore>((set, _get) => ({
  ...initialState,

  /**
   * Fetch all appointments
   */
  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const appointments = await appointmentService.getAll();
      set({ appointments, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar citas';
      
      console.error('[AppointmentStore] Error fetching appointments:', error);
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch single appointment by ID
   */
  fetchAppointmentById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const appointment = await appointmentService.getById(id);
      set({ selectedAppointment: appointment, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar cita';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch appointments by patient ID
   */
  fetchByPatientId: async (patientId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const appointments = await appointmentService.getByPatientId(patientId);
      set({ appointments, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar citas del paciente';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch upcoming appointments
   */
  fetchUpcoming: async (limit?: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const appointments = await appointmentService.getUpcoming(limit);
      set({ appointments, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar próximas citas';
      
      console.error('[AppointmentStore] Error fetching upcoming:', error);
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Create new appointment
   */
  createAppointment: async (data: CreateAppointmentDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const appointment = await appointmentService.create(data);
      // Don't update optimistically - let the caller refetch to get fresh data from backend
      set({ isLoading: false });
      return appointment;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al crear cita';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Update existing appointment
   */
  updateAppointment: async (id: string, data: UpdateAppointmentDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedAppointment = await appointmentService.update(id, data);
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? updatedAppointment : a
        ),
        selectedAppointment:
          state.selectedAppointment?.id === id
            ? updatedAppointment
            : state.selectedAppointment,
        isLoading: false,
      }));
      return updatedAppointment;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al actualizar cita';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete appointment
   */
  deleteAppointment: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await appointmentService.delete(id);
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
        selectedAppointment:
          state.selectedAppointment?.id === id ? null : state.selectedAppointment,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al eliminar cita';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Set selected appointment
   */
  setSelectedAppointment: (appointment: Appointment | null) => {
    set({ selectedAppointment: appointment });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Selectors
 */
export const selectAppointments = (state: AppointmentStore) => state.appointments;
export const selectSelectedAppointment = (state: AppointmentStore) => state.selectedAppointment;
export const selectIsLoading = (state: AppointmentStore) => state.isLoading;
export const selectError = (state: AppointmentStore) => state.error;

/**
 * Computed selectors
 */
export const selectTodayAppointments = (state: AppointmentStore) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return state.appointments.filter((apt) => {
    const aptDate = new Date(apt.dateTime);
    return aptDate >= today && aptDate < tomorrow;
  });
};
