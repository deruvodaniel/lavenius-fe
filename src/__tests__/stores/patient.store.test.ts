import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  usePatientStore,
  selectPatients,
  selectSelectedPatient,
  selectIsLoading,
  selectError,
  selectActivePatients,
  selectInactivePatients,
} from '../../lib/stores/patient.store';
import { patientService } from '../../lib/services/patient.service';
import { ApiClientError } from '../../lib/api/client';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '../../lib/types/api.types';
import { PatientStatus } from '../../lib/types/api.types';

// Mock the patient service
vi.mock('../../lib/services/patient.service', () => ({
  patientService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
  },
}));

describe('usePatientStore', () => {
  // Mock patient data
  const mockPatients: Patient[] = [
    {
      id: '1',
      therapistId: 'therapist-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      status: PatientStatus.ACTIVE,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      therapistId: 'therapist-1',
      firstName: 'María',
      lastName: 'García',
      email: 'maria@test.com',
      status: PatientStatus.ACTIVE,
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
    {
      id: '3',
      therapistId: 'therapist-1',
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos@test.com',
      status: PatientStatus.INACTIVE,
      createdAt: '2024-01-03',
      updatedAt: '2024-01-03',
    },
  ];

  const initialState = {
    patients: [],
    selectedPatient: null,
    isLoading: false,
    error: null,
    currentFilters: null,
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    usePatientStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty patients array by default', () => {
      const { patients } = usePatientStore.getState();
      expect(patients).toEqual([]);
    });

    it('should have null selectedPatient by default', () => {
      const { selectedPatient } = usePatientStore.getState();
      expect(selectedPatient).toBeNull();
    });

    it('should have isLoading false by default', () => {
      const { isLoading } = usePatientStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have null error by default', () => {
      const { error } = usePatientStore.getState();
      expect(error).toBeNull();
    });

    it('should have null currentFilters by default', () => {
      const { currentFilters } = usePatientStore.getState();
      expect(currentFilters).toBeNull();
    });
  });

  // ==================== fetchPatients Tests ====================
  describe('fetchPatients', () => {
    it('should call patientService.getAll', async () => {
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients);

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(patientService.getAll).toHaveBeenCalledTimes(1);
      expect(patientService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(patientService.getAll).mockImplementation(async () => {
        loadingDuringRequest = usePatientStore.getState().isLoading;
        return mockPatients;
      });

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('should set isLoading to false after successful request', async () => {
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients);

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(usePatientStore.getState().isLoading).toBe(false);
    });

    it('should populate patients array on success', async () => {
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients);

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(usePatientStore.getState().patients).toEqual(mockPatients);
      expect(usePatientStore.getState().patients).toHaveLength(3);
    });

    it('should clear error on successful request', async () => {
      // First set an error
      usePatientStore.setState({ error: 'Previous error' });
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients);

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(usePatientStore.getState().error).toBeNull();
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Error al cargar pacientes';
      vi.mocked(patientService.getAll).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePatientStore.getState().fetchPatients();
        } catch {
          // Expected to throw
        }
      });

      expect(usePatientStore.getState().error).toBe(errorMessage);
      expect(usePatientStore.getState().isLoading).toBe(false);
    });

    it('should set ApiClientError message on API failure', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error del servidor');
      vi.mocked(patientService.getAll).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().fetchPatients();
        } catch {
          // Expected to throw
        }
      });

      expect(usePatientStore.getState().error).toBe('Error del servidor');
    });

    it('should pass filters to patientService.getAll', async () => {
      const filters = { name: 'Juan', sessionType: 'remote' as const };
      vi.mocked(patientService.getAll).mockResolvedValue([mockPatients[0]]);

      await act(async () => {
        await usePatientStore.getState().fetchPatients(filters);
      });

      expect(patientService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should store currentFilters when provided', async () => {
      const filters = { name: 'Juan' };
      vi.mocked(patientService.getAll).mockResolvedValue([mockPatients[0]]);

      await act(async () => {
        await usePatientStore.getState().fetchPatients(filters);
      });

      expect(usePatientStore.getState().currentFilters).toEqual(filters);
    });

    it('should throw error on failure', async () => {
      vi.mocked(patientService.getAll).mockRejectedValue(new Error('Network error'));

      await expect(usePatientStore.getState().fetchPatients()).rejects.toThrow('Network error');
    });
  });

  // ==================== fetchPatientById Tests ====================
  describe('fetchPatientById', () => {
    it('should call patientService.getById with correct id', async () => {
      vi.mocked(patientService.getById).mockResolvedValue(mockPatients[0]);

      await act(async () => {
        await usePatientStore.getState().fetchPatientById('1');
      });

      expect(patientService.getById).toHaveBeenCalledWith('1');
    });

    it('should set selectedPatient on success', async () => {
      vi.mocked(patientService.getById).mockResolvedValue(mockPatients[0]);

      await act(async () => {
        await usePatientStore.getState().fetchPatientById('1');
      });

      expect(usePatientStore.getState().selectedPatient).toEqual(mockPatients[0]);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(patientService.getById).mockImplementation(async () => {
        loadingDuringRequest = usePatientStore.getState().isLoading;
        return mockPatients[0];
      });

      await act(async () => {
        await usePatientStore.getState().fetchPatientById('1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(usePatientStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Paciente no encontrado');
      vi.mocked(patientService.getById).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().fetchPatientById('999');
        } catch {
          // Expected
        }
      });

      expect(usePatientStore.getState().error).toBe('Paciente no encontrado');
    });
  });

  // ==================== createPatient Tests ====================
  describe('createPatient', () => {
    const newPatientData: CreatePatientDto = {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana@test.com',
      status: PatientStatus.ACTIVE,
    };

    const createdPatient: Patient = {
      id: '4',
      therapistId: 'therapist-1',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana@test.com',
      status: PatientStatus.ACTIVE,
      createdAt: '2024-01-04',
      updatedAt: '2024-01-04',
    };

    it('should call patientService.create with correct data', async () => {
      vi.mocked(patientService.create).mockResolvedValue(createdPatient);

      await act(async () => {
        await usePatientStore.getState().createPatient(newPatientData);
      });

      expect(patientService.create).toHaveBeenCalledWith(newPatientData);
    });

    it('should add new patient to patients list', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.create).mockResolvedValue(createdPatient);

      await act(async () => {
        await usePatientStore.getState().createPatient(newPatientData);
      });

      const { patients } = usePatientStore.getState();
      expect(patients).toHaveLength(4);
      expect(patients[3]).toEqual(createdPatient);
    });

    it('should return created patient', async () => {
      vi.mocked(patientService.create).mockResolvedValue(createdPatient);

      let result: Patient | undefined;
      await act(async () => {
        result = await usePatientStore.getState().createPatient(newPatientData);
      });

      expect(result).toEqual(createdPatient);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(patientService.create).mockImplementation(async () => {
        loadingDuringRequest = usePatientStore.getState().isLoading;
        return createdPatient;
      });

      await act(async () => {
        await usePatientStore.getState().createPatient(newPatientData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(usePatientStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(400, 'BadRequest', 'Datos inválidos');
      vi.mocked(patientService.create).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().createPatient(newPatientData);
        } catch {
          // Expected
        }
      });

      expect(usePatientStore.getState().error).toBe('Datos inválidos');
    });

    it('should throw error on failure', async () => {
      vi.mocked(patientService.create).mockRejectedValue(new Error('Create failed'));

      await expect(
        usePatientStore.getState().createPatient(newPatientData)
      ).rejects.toThrow('Create failed');
    });
  });

  // ==================== updatePatient Tests ====================
  describe('updatePatient', () => {
    const updateData: UpdatePatientDto = {
      firstName: 'Juan Carlos',
      email: 'juancarlos@test.com',
    };

    const updatedPatient: Patient = {
      ...mockPatients[0],
      firstName: 'Juan Carlos',
      email: 'juancarlos@test.com',
      updatedAt: '2024-01-10',
    };

    it('should call patientService.update with correct id and data', async () => {
      vi.mocked(patientService.update).mockResolvedValue(updatedPatient);

      await act(async () => {
        await usePatientStore.getState().updatePatient('1', updateData);
      });

      expect(patientService.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should update patient in patients list', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.update).mockResolvedValue(updatedPatient);

      await act(async () => {
        await usePatientStore.getState().updatePatient('1', updateData);
      });

      const { patients } = usePatientStore.getState();
      const patient = patients.find((p) => p.id === '1');
      expect(patient?.firstName).toBe('Juan Carlos');
      expect(patient?.email).toBe('juancarlos@test.com');
    });

    it('should update selectedPatient if it matches updated patient', async () => {
      usePatientStore.setState({
        patients: mockPatients,
        selectedPatient: mockPatients[0],
      });
      vi.mocked(patientService.update).mockResolvedValue(updatedPatient);

      await act(async () => {
        await usePatientStore.getState().updatePatient('1', updateData);
      });

      expect(usePatientStore.getState().selectedPatient).toEqual(updatedPatient);
    });

    it('should not update selectedPatient if it does not match', async () => {
      usePatientStore.setState({
        patients: mockPatients,
        selectedPatient: mockPatients[1], // Different patient
      });
      vi.mocked(patientService.update).mockResolvedValue(updatedPatient);

      await act(async () => {
        await usePatientStore.getState().updatePatient('1', updateData);
      });

      expect(usePatientStore.getState().selectedPatient).toEqual(mockPatients[1]);
    });

    it('should return updated patient', async () => {
      vi.mocked(patientService.update).mockResolvedValue(updatedPatient);

      let result: Patient | undefined;
      await act(async () => {
        result = await usePatientStore.getState().updatePatient('1', updateData);
      });

      expect(result).toEqual(updatedPatient);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Paciente no encontrado');
      vi.mocked(patientService.update).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().updatePatient('999', updateData);
        } catch {
          // Expected
        }
      });

      expect(usePatientStore.getState().error).toBe('Paciente no encontrado');
    });
  });

  // ==================== deletePatient Tests ====================
  describe('deletePatient', () => {
    it('should call patientService.delete with correct id', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.delete).mockResolvedValue(undefined);
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients.slice(1));

      await act(async () => {
        await usePatientStore.getState().deletePatient('1');
      });

      expect(patientService.delete).toHaveBeenCalledWith('1');
    });

    it('should remove patient from patients list', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.delete).mockResolvedValue(undefined);
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients.slice(1));

      await act(async () => {
        await usePatientStore.getState().deletePatient('1');
      });

      // After fetchPatients is called
      const { patients } = usePatientStore.getState();
      expect(patients.find((p) => p.id === '1')).toBeUndefined();
    });

    it('should clear selectedPatient if deleted patient was selected', async () => {
      usePatientStore.setState({
        patients: mockPatients,
        selectedPatient: mockPatients[0],
      });
      vi.mocked(patientService.delete).mockResolvedValue(undefined);
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients.slice(1));

      await act(async () => {
        await usePatientStore.getState().deletePatient('1');
      });

      // selectedPatient should be set to null when deleted patient was selected
      // Note: fetchPatients is called after delete which resets state
      expect(usePatientStore.getState().selectedPatient).toBeNull();
    });

    it('should not clear selectedPatient if different patient was deleted', async () => {
      usePatientStore.setState({
        patients: mockPatients,
        selectedPatient: mockPatients[1], // María is selected
      });
      vi.mocked(patientService.delete).mockResolvedValue(undefined);
      vi.mocked(patientService.getAll).mockResolvedValue([mockPatients[1], mockPatients[2]]);

      await act(async () => {
        await usePatientStore.getState().deletePatient('1'); // Delete Juan
      });

      // María should still be selected
      expect(usePatientStore.getState().selectedPatient?.id).toBe('2');
    });

    it('should call fetchPatients after successful delete', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.delete).mockResolvedValue(undefined);
      vi.mocked(patientService.getAll).mockResolvedValue(mockPatients.slice(1));

      await act(async () => {
        await usePatientStore.getState().deletePatient('1');
      });

      expect(patientService.getAll).toHaveBeenCalled();
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Paciente no encontrado');
      vi.mocked(patientService.delete).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().deletePatient('999');
        } catch {
          // Expected
        }
      });

      expect(usePatientStore.getState().error).toBe('Paciente no encontrado');
    });
  });

  // ==================== setSelectedPatient Tests ====================
  describe('setSelectedPatient', () => {
    it('should set selectedPatient to provided patient', () => {
      usePatientStore.getState().setSelectedPatient(mockPatients[0]);

      expect(usePatientStore.getState().selectedPatient).toEqual(mockPatients[0]);
    });

    it('should set selectedPatient to null when clearing', () => {
      usePatientStore.setState({ selectedPatient: mockPatients[0] });

      usePatientStore.getState().setSelectedPatient(null);

      expect(usePatientStore.getState().selectedPatient).toBeNull();
    });

    it('should update selectedPatient when changing selection', () => {
      usePatientStore.setState({ selectedPatient: mockPatients[0] });

      usePatientStore.getState().setSelectedPatient(mockPatients[1]);

      expect(usePatientStore.getState().selectedPatient).toEqual(mockPatients[1]);
    });
  });

  // ==================== clearError Tests ====================
  describe('clearError', () => {
    it('should clear error when set', () => {
      usePatientStore.setState({ error: 'Some error' });

      usePatientStore.getState().clearError();

      expect(usePatientStore.getState().error).toBeNull();
    });

    it('should have no effect when error is already null', () => {
      usePatientStore.setState({ error: null });

      usePatientStore.getState().clearError();

      expect(usePatientStore.getState().error).toBeNull();
    });
  });

  // ==================== searchPatients Tests ====================
  describe('searchPatients', () => {
    it('should call patientService.search with query', async () => {
      vi.mocked(patientService.search).mockResolvedValue([mockPatients[0]]);

      await act(async () => {
        await usePatientStore.getState().searchPatients('Juan');
      });

      expect(patientService.search).toHaveBeenCalledWith('Juan');
    });

    it('should return search results', async () => {
      const searchResults = [mockPatients[0]];
      vi.mocked(patientService.search).mockResolvedValue(searchResults);

      let result: Patient[] = [];
      await act(async () => {
        result = await usePatientStore.getState().searchPatients('Juan');
      });

      expect(result).toEqual(searchResults);
    });

    it('should set isLoading during search', async () => {
      let loadingDuringSearch = false;

      vi.mocked(patientService.search).mockImplementation(async () => {
        loadingDuringSearch = usePatientStore.getState().isLoading;
        return [mockPatients[0]];
      });

      await act(async () => {
        await usePatientStore.getState().searchPatients('Juan');
      });

      expect(loadingDuringSearch).toBe(true);
      expect(usePatientStore.getState().isLoading).toBe(false);
    });

    it('should not modify patients array', async () => {
      usePatientStore.setState({ patients: mockPatients });
      vi.mocked(patientService.search).mockResolvedValue([mockPatients[0]]);

      await act(async () => {
        await usePatientStore.getState().searchPatients('Juan');
      });

      // Patients array should remain unchanged
      expect(usePatientStore.getState().patients).toEqual(mockPatients);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error de búsqueda');
      vi.mocked(patientService.search).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await usePatientStore.getState().searchPatients('test');
        } catch {
          // Expected
        }
      });

      expect(usePatientStore.getState().error).toBe('Error de búsqueda');
    });

    it('should return empty array for no results', async () => {
      vi.mocked(patientService.search).mockResolvedValue([]);

      let result: Patient[] = [];
      await act(async () => {
        result = await usePatientStore.getState().searchPatients('nonexistent');
      });

      expect(result).toEqual([]);
    });
  });

  // ==================== Selectors Tests ====================
  describe('Selectors', () => {
    beforeEach(() => {
      usePatientStore.setState({
        patients: mockPatients,
        selectedPatient: mockPatients[0],
        isLoading: true,
        error: 'Test error',
      });
    });

    it('selectPatients returns patients array', () => {
      const state = usePatientStore.getState();
      expect(selectPatients(state)).toEqual(mockPatients);
    });

    it('selectSelectedPatient returns selected patient', () => {
      const state = usePatientStore.getState();
      expect(selectSelectedPatient(state)).toEqual(mockPatients[0]);
    });

    it('selectIsLoading returns loading state', () => {
      const state = usePatientStore.getState();
      expect(selectIsLoading(state)).toBe(true);
    });

    it('selectError returns error message', () => {
      const state = usePatientStore.getState();
      expect(selectError(state)).toBe('Test error');
    });

    it('selectActivePatients returns only active patients', () => {
      const state = usePatientStore.getState();
      const activePatients = selectActivePatients(state);

      expect(activePatients).toHaveLength(2);
      expect(activePatients.every((p: Patient) => p.status === PatientStatus.ACTIVE)).toBe(true);
    });

    it('selectInactivePatients returns only inactive patients', () => {
      const state = usePatientStore.getState();
      const inactivePatients = selectInactivePatients(state);

      expect(inactivePatients).toHaveLength(1);
      expect(inactivePatients[0].status).toBe(PatientStatus.INACTIVE);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty patients list gracefully', async () => {
      vi.mocked(patientService.getAll).mockResolvedValue([]);

      await act(async () => {
        await usePatientStore.getState().fetchPatients();
      });

      expect(usePatientStore.getState().patients).toEqual([]);
    });

    it('should handle concurrent fetch requests', async () => {
      vi.mocked(patientService.getAll)
        .mockResolvedValueOnce(mockPatients)
        .mockResolvedValueOnce([mockPatients[0]]);

      await act(async () => {
        await Promise.all([
          usePatientStore.getState().fetchPatients(),
          usePatientStore.getState().fetchPatients(),
        ]);
      });

      // The last request should win
      expect(patientService.getAll).toHaveBeenCalledTimes(2);
    });

    it('should handle update of non-existent patient in list', async () => {
      usePatientStore.setState({ patients: mockPatients });

      const nonExistentPatient: Patient = {
        ...mockPatients[0],
        id: '999',
        firstName: 'Unknown',
      };

      vi.mocked(patientService.update).mockResolvedValue(nonExistentPatient);

      await act(async () => {
        await usePatientStore.getState().updatePatient('999', { firstName: 'Unknown' });
      });

      // Should not add new patient, just update if found
      expect(usePatientStore.getState().patients).toHaveLength(3);
    });
  });
});
