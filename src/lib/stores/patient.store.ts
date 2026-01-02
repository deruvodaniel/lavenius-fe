import { create } from 'zustand';
import { patientService } from '../services/patient.service';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '../types/api.types';
import { ApiClientError } from '../api/client';

/**
 * Patient Store State
 */
interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Patient Store Actions
 */
interface PatientActions {
  fetchPatients: () => Promise<void>;
  fetchPatientById: (id: string) => Promise<void>;
  createPatient: (data: CreatePatientDto) => Promise<Patient>;
  updatePatient: (id: string, data: UpdatePatientDto) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  setSelectedPatient: (patient: Patient | null) => void;
  clearError: () => void;
  searchPatients: (query: string) => Promise<Patient[]>;
}

/**
 * Patient Store Type
 */
type PatientStore = PatientState & PatientActions;

/**
 * Initial State
 */
const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  isLoading: false,
  error: null,
};

/**
 * Patient Store
 * Maneja el estado de pacientes global
 */
export const usePatientStore = create<PatientStore>((set, get) => ({
  ...initialState,

  /**
   * Fetch all patients
   */
  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const patients = await patientService.getAll();
      set({ patients, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar pacientes';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch single patient by ID
   */
  fetchPatientById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const patient = await patientService.getById(id);
      set({ selectedPatient: patient, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al cargar paciente';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Create new patient
   */
  createPatient: async (data: CreatePatientDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const patient = await patientService.create(data);
      set((state) => ({
        patients: [...state.patients, patient],
        isLoading: false,
      }));
      return patient;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al crear paciente';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Update existing patient
   */
  updatePatient: async (id: string, data: UpdatePatientDto) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedPatient = await patientService.update(id, data);
      set((state) => ({
        patients: state.patients.map((p) =>
          p.id === id ? updatedPatient : p
        ),
        selectedPatient:
          state.selectedPatient?.id === id
            ? updatedPatient
            : state.selectedPatient,
        isLoading: false,
      }));
      return updatedPatient;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al actualizar paciente';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete patient
   */
  deletePatient: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await patientService.delete(id);
      set((state) => ({
        patients: state.patients.filter((p) => p.id !== id),
        selectedPatient:
          state.selectedPatient?.id === id ? null : state.selectedPatient,
      }));
      await get().fetchPatients();
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al eliminar paciente';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Set selected patient
   */
  setSelectedPatient: (patient: Patient | null) => {
    set({ selectedPatient: patient });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Search patients by query
   */
  searchPatients: async (query: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const results = await patientService.search(query);
      set({ isLoading: false });
      return results;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Error al buscar pacientes';
      
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
}));

/**
 * Selectors
 */
export const selectPatients = (state: PatientStore) => state.patients;
export const selectSelectedPatient = (state: PatientStore) => state.selectedPatient;
export const selectIsLoading = (state: PatientStore) => state.isLoading;
export const selectError = (state: PatientStore) => state.error;

/**
 * Computed selectors
 */
export const selectActivePatients = (state: PatientStore) =>
  state.patients.filter((p) => p.status === 'ACTIVE');

export const selectInactivePatients = (state: PatientStore) =>
  state.patients.filter((p) => p.status === 'INACTIVE');
