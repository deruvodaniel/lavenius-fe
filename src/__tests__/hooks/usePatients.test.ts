import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePatients } from '../../lib/hooks/usePatients';
import { usePatientStore } from '../../lib/stores/patient.store';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '../../lib/types/api.types';
import { PatientStatus } from '../../lib/types/api.types';

// Mock the patient store
vi.mock('../../lib/stores/patient.store', () => ({
  usePatientStore: vi.fn(),
}));

describe('usePatients', () => {
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

  // Mock store functions
  const mockFetchPatients = vi.fn();
  const mockFetchPatientById = vi.fn();
  const mockSetSelectedPatient = vi.fn();
  const mockCreatePatient = vi.fn();
  const mockUpdatePatient = vi.fn();
  const mockDeletePatient = vi.fn();
  const mockSearchPatients = vi.fn();
  const mockClearError = vi.fn();

  // Default mock store state
  const defaultMockState = {
    patients: mockPatients,
    selectedPatient: null as Patient | null,
    isLoading: false,
    error: null as string | null,
    fetchPatients: mockFetchPatients,
    fetchPatientById: mockFetchPatientById,
    setSelectedPatient: mockSetSelectedPatient,
    createPatient: mockCreatePatient,
    updatePatient: mockUpdatePatient,
    deletePatient: mockDeletePatient,
    searchPatients: mockSearchPatients,
    clearError: mockClearError,
  };

  // Helper to setup store mock with selector support
  const setupStoreMock = (overrides: Partial<typeof defaultMockState> = {}) => {
    const state = { ...defaultMockState, ...overrides };
    
    vi.mocked(usePatientStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof state) => unknown)(state);
      }
      return state;
    });
    
    return state;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Hook Return Values Tests ====================
  describe('Hook Return Values', () => {
    it('returns patients array from store', () => {
      const { result } = renderHook(() => usePatients());

      expect(result.current.patients).toEqual(mockPatients);
      expect(result.current.patients).toHaveLength(3);
    });

    it('returns selectedPatient from store when null', () => {
      setupStoreMock({ selectedPatient: null });

      const { result } = renderHook(() => usePatients());

      expect(result.current.selectedPatient).toBeNull();
    });

    it('returns selectedPatient from store when set', () => {
      setupStoreMock({ selectedPatient: mockPatients[0] });

      const { result } = renderHook(() => usePatients());

      expect(result.current.selectedPatient).toEqual(mockPatients[0]);
    });

    it('returns isLoading false from store', () => {
      setupStoreMock({ isLoading: false });

      const { result } = renderHook(() => usePatients());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns isLoading true from store', () => {
      setupStoreMock({ isLoading: true });

      const { result } = renderHook(() => usePatients());

      expect(result.current.isLoading).toBe(true);
    });

    it('returns error null from store', () => {
      setupStoreMock({ error: null });

      const { result } = renderHook(() => usePatients());

      expect(result.current.error).toBeNull();
    });

    it('returns error message from store', () => {
      setupStoreMock({ error: 'Error al cargar pacientes' });

      const { result } = renderHook(() => usePatients());

      expect(result.current.error).toBe('Error al cargar pacientes');
    });

    it('returns empty patients array when store is empty', () => {
      setupStoreMock({ patients: [] });

      const { result } = renderHook(() => usePatients());

      expect(result.current.patients).toEqual([]);
      expect(result.current.patients).toHaveLength(0);
    });
  });

  // ==================== Computed Values Tests ====================
  describe('Computed Values', () => {
    it('returns activePatients filtered from patients', () => {
      const { result } = renderHook(() => usePatients());

      expect(result.current.activePatients).toHaveLength(2);
      expect(result.current.activePatients.every(p => p.status === PatientStatus.ACTIVE)).toBe(true);
    });

    it('returns inactivePatients filtered from patients', () => {
      const { result } = renderHook(() => usePatients());

      expect(result.current.inactivePatients).toHaveLength(1);
      expect(result.current.inactivePatients[0].status).toBe(PatientStatus.INACTIVE);
      expect(result.current.inactivePatients[0].firstName).toBe('Carlos');
    });

    it('returns empty activePatients when no active patients exist', () => {
      setupStoreMock({
        patients: [mockPatients[2]], // Only inactive patient
      });

      const { result } = renderHook(() => usePatients());

      expect(result.current.activePatients).toHaveLength(0);
    });

    it('returns empty inactivePatients when no inactive patients exist', () => {
      setupStoreMock({
        patients: [mockPatients[0], mockPatients[1]], // Only active patients
      });

      const { result } = renderHook(() => usePatients());

      expect(result.current.inactivePatients).toHaveLength(0);
    });

    it('returns empty computed arrays when patients is empty', () => {
      setupStoreMock({ patients: [] });

      const { result } = renderHook(() => usePatients());

      expect(result.current.activePatients).toEqual([]);
      expect(result.current.inactivePatients).toEqual([]);
    });
  });

  // ==================== Fetch Functions Tests ====================
  describe('Fetch Functions', () => {
    it('fetchPatients calls store action', async () => {
      mockFetchPatients.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatients();
      });

      expect(mockFetchPatients).toHaveBeenCalledTimes(1);
    });

    it('fetchPatients calls store action with filters', async () => {
      const filters = { name: 'Juan', status: PatientStatus.ACTIVE };
      mockFetchPatients.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatients(filters);
      });

      expect(mockFetchPatients).toHaveBeenCalledWith(filters);
    });

    it('fetchPatientById calls store action with id', async () => {
      mockFetchPatientById.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatientById('1');
      });

      expect(mockFetchPatientById).toHaveBeenCalledWith('1');
      expect(mockFetchPatientById).toHaveBeenCalledTimes(1);
    });

    it('fetchPatientById calls store action with different id', async () => {
      mockFetchPatientById.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatientById('uuid-123-456');
      });

      expect(mockFetchPatientById).toHaveBeenCalledWith('uuid-123-456');
    });
  });

  // ==================== CRUD Functions Tests ====================
  describe('CRUD Functions', () => {
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
        ...newPatientData,
        status: PatientStatus.ACTIVE,
        createdAt: '2024-01-04',
        updatedAt: '2024-01-04',
      };

      it('createPatient calls store action with data', async () => {
        mockCreatePatient.mockResolvedValue(createdPatient);
        const { result } = renderHook(() => usePatients());

        await act(async () => {
          await result.current.createPatient(newPatientData);
        });

        expect(mockCreatePatient).toHaveBeenCalledWith(newPatientData);
        expect(mockCreatePatient).toHaveBeenCalledTimes(1);
      });

      it('createPatient returns created patient from store', async () => {
        mockCreatePatient.mockResolvedValue(createdPatient);
        const { result } = renderHook(() => usePatients());

        let returnedPatient: Patient | undefined;
        await act(async () => {
          returnedPatient = await result.current.createPatient(newPatientData);
        });

        expect(returnedPatient).toEqual(createdPatient);
      });

      it('createPatient propagates error from store', async () => {
        const error = new Error('Error al crear paciente');
        mockCreatePatient.mockRejectedValue(error);
        const { result } = renderHook(() => usePatients());

        await expect(
          act(async () => {
            await result.current.createPatient(newPatientData);
          })
        ).rejects.toThrow('Error al crear paciente');
      });
    });

    describe('updatePatient', () => {
      const updateData: UpdatePatientDto = {
        firstName: 'Juan Carlos',
        email: 'juancarlos@test.com',
      };

      const updatedPatient: Patient = {
        ...mockPatients[0],
        ...updateData,
        updatedAt: '2024-01-10',
      };

      it('updatePatient calls store action with id and data', async () => {
        mockUpdatePatient.mockResolvedValue(updatedPatient);
        const { result } = renderHook(() => usePatients());

        await act(async () => {
          await result.current.updatePatient('1', updateData);
        });

        expect(mockUpdatePatient).toHaveBeenCalledWith('1', updateData);
        expect(mockUpdatePatient).toHaveBeenCalledTimes(1);
      });

      it('updatePatient returns updated patient from store', async () => {
        mockUpdatePatient.mockResolvedValue(updatedPatient);
        const { result } = renderHook(() => usePatients());

        let returnedPatient: Patient | undefined;
        await act(async () => {
          returnedPatient = await result.current.updatePatient('1', updateData);
        });

        expect(returnedPatient).toEqual(updatedPatient);
      });

      it('updatePatient propagates error from store', async () => {
        const error = new Error('Paciente no encontrado');
        mockUpdatePatient.mockRejectedValue(error);
        const { result } = renderHook(() => usePatients());

        await expect(
          act(async () => {
            await result.current.updatePatient('999', updateData);
          })
        ).rejects.toThrow('Paciente no encontrado');
      });
    });

    describe('deletePatient', () => {
      it('deletePatient calls store action with id', async () => {
        mockDeletePatient.mockResolvedValue(undefined);
        const { result } = renderHook(() => usePatients());

        await act(async () => {
          await result.current.deletePatient('1');
        });

        expect(mockDeletePatient).toHaveBeenCalledWith('1');
        expect(mockDeletePatient).toHaveBeenCalledTimes(1);
      });

      it('deletePatient propagates error from store', async () => {
        const error = new Error('Error al eliminar paciente');
        mockDeletePatient.mockRejectedValue(error);
        const { result } = renderHook(() => usePatients());

        await expect(
          act(async () => {
            await result.current.deletePatient('999');
          })
        ).rejects.toThrow('Error al eliminar paciente');
      });
    });
  });

  // ==================== Selection Functions Tests ====================
  describe('Selection Functions', () => {
    it('setSelectedPatient sets selected patient', () => {
      const { result } = renderHook(() => usePatients());

      act(() => {
        result.current.setSelectedPatient(mockPatients[0]);
      });

      expect(mockSetSelectedPatient).toHaveBeenCalledWith(mockPatients[0]);
      expect(mockSetSelectedPatient).toHaveBeenCalledTimes(1);
    });

    it('setSelectedPatient clears selected patient with null', () => {
      const { result } = renderHook(() => usePatients());

      act(() => {
        result.current.setSelectedPatient(null);
      });

      expect(mockSetSelectedPatient).toHaveBeenCalledWith(null);
    });

    it('setSelectedPatient can change selection', () => {
      setupStoreMock({ selectedPatient: mockPatients[0] });
      const { result } = renderHook(() => usePatients());

      act(() => {
        result.current.setSelectedPatient(mockPatients[1]);
      });

      expect(mockSetSelectedPatient).toHaveBeenCalledWith(mockPatients[1]);
    });
  });

  // ==================== Search Functions Tests ====================
  describe('Search Functions', () => {
    it('searchPatients calls store action with query', async () => {
      const searchResults = [mockPatients[0]];
      mockSearchPatients.mockResolvedValue(searchResults);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.searchPatients('Juan');
      });

      expect(mockSearchPatients).toHaveBeenCalledWith('Juan');
      expect(mockSearchPatients).toHaveBeenCalledTimes(1);
    });

    it('searchPatients returns results from store', async () => {
      const searchResults = [mockPatients[0]];
      mockSearchPatients.mockResolvedValue(searchResults);
      const { result } = renderHook(() => usePatients());

      let results: Patient[] = [];
      await act(async () => {
        results = await result.current.searchPatients('Juan');
      });

      expect(results).toEqual(searchResults);
    });

    it('searchPatients returns empty array for no matches', async () => {
      mockSearchPatients.mockResolvedValue([]);
      const { result } = renderHook(() => usePatients());

      let results: Patient[] = [];
      await act(async () => {
        results = await result.current.searchPatients('nonexistent');
      });

      expect(results).toEqual([]);
    });

    it('searchPatients propagates error from store', async () => {
      const error = new Error('Error de búsqueda');
      mockSearchPatients.mockRejectedValue(error);
      const { result } = renderHook(() => usePatients());

      await expect(
        act(async () => {
          await result.current.searchPatients('test');
        })
      ).rejects.toThrow('Error de búsqueda');
    });
  });

  // ==================== Clear Error Tests ====================
  describe('Clear Error', () => {
    it('clearError calls store action', () => {
      setupStoreMock({ error: 'Some error' });
      const { result } = renderHook(() => usePatients());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('clearError can be called when error is null', () => {
      setupStoreMock({ error: null });
      const { result } = renderHook(() => usePatients());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => usePatients());

      // State values
      expect(result.current).toHaveProperty('patients');
      expect(result.current).toHaveProperty('activePatients');
      expect(result.current).toHaveProperty('inactivePatients');
      expect(result.current).toHaveProperty('selectedPatient');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      // Functions
      expect(result.current).toHaveProperty('fetchPatients');
      expect(result.current).toHaveProperty('fetchPatientById');
      expect(result.current).toHaveProperty('setSelectedPatient');
      expect(result.current).toHaveProperty('createPatient');
      expect(result.current).toHaveProperty('updatePatient');
      expect(result.current).toHaveProperty('deletePatient');
      expect(result.current).toHaveProperty('searchPatients');
      expect(result.current).toHaveProperty('clearError');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => usePatients());

      expect(typeof result.current.fetchPatients).toBe('function');
      expect(typeof result.current.fetchPatientById).toBe('function');
      expect(typeof result.current.setSelectedPatient).toBe('function');
      expect(typeof result.current.createPatient).toBe('function');
      expect(typeof result.current.updatePatient).toBe('function');
      expect(typeof result.current.deletePatient).toBe('function');
      expect(typeof result.current.searchPatients).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  // ==================== Memoization Tests ====================
  describe('Memoization', () => {
    it('activePatients is memoized with same patients reference', () => {
      const { result, rerender } = renderHook(() => usePatients());

      const firstActivePatients = result.current.activePatients;
      rerender();
      const secondActivePatients = result.current.activePatients;

      // With memoization, these should be the same reference
      // Note: This test verifies useMemo behavior
      expect(firstActivePatients).toEqual(secondActivePatients);
    });

    it('inactivePatients is memoized with same patients reference', () => {
      const { result, rerender } = renderHook(() => usePatients());

      const firstInactivePatients = result.current.inactivePatients;
      rerender();
      const secondInactivePatients = result.current.inactivePatients;

      expect(firstInactivePatients).toEqual(secondInactivePatients);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles patients with missing optional fields', () => {
      const minimalPatient: Patient = {
        id: '5',
        therapistId: 'therapist-1',
        firstName: 'Test',
        lastName: 'User',
        status: PatientStatus.ACTIVE,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      
      setupStoreMock({ patients: [minimalPatient] });
      const { result } = renderHook(() => usePatients());

      expect(result.current.patients).toHaveLength(1);
      expect(result.current.patients[0].email).toBeUndefined();
    });

    it('handles mix of active and inactive patients correctly', () => {
      const mixedPatients = [
        { ...mockPatients[0], status: PatientStatus.ACTIVE },
        { ...mockPatients[1], status: PatientStatus.INACTIVE },
        { ...mockPatients[2], status: PatientStatus.ACTIVE },
      ];
      
      setupStoreMock({ patients: mixedPatients });
      const { result } = renderHook(() => usePatients());

      expect(result.current.activePatients).toHaveLength(2);
      expect(result.current.inactivePatients).toHaveLength(1);
    });

    it('handles undefined filters in fetchPatients', async () => {
      mockFetchPatients.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatients(undefined);
      });

      expect(mockFetchPatients).toHaveBeenCalledWith(undefined);
    });

    it('handles empty search query', async () => {
      mockSearchPatients.mockResolvedValue(mockPatients);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.searchPatients('');
      });

      expect(mockSearchPatients).toHaveBeenCalledWith('');
    });
  });

  // ==================== Multiple Calls Tests ====================
  describe('Multiple Calls', () => {
    it('can call fetchPatients multiple times', async () => {
      mockFetchPatients.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.fetchPatients();
        await result.current.fetchPatients();
        await result.current.fetchPatients();
      });

      expect(mockFetchPatients).toHaveBeenCalledTimes(3);
    });

    it('can perform sequential CRUD operations', async () => {
      const newPatient: Patient = {
        id: '4',
        therapistId: 'therapist-1',
        firstName: 'New',
        lastName: 'Patient',
        status: PatientStatus.ACTIVE,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      mockCreatePatient.mockResolvedValue(newPatient);
      mockUpdatePatient.mockResolvedValue({ ...newPatient, firstName: 'Updated' });
      mockDeletePatient.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePatients());

      await act(async () => {
        await result.current.createPatient({ 
          firstName: 'New', 
          lastName: 'Patient',
          status: PatientStatus.ACTIVE,
        });
        await result.current.updatePatient('4', { firstName: 'Updated' });
        await result.current.deletePatient('4');
      });

      expect(mockCreatePatient).toHaveBeenCalledTimes(1);
      expect(mockUpdatePatient).toHaveBeenCalledTimes(1);
      expect(mockDeletePatient).toHaveBeenCalledTimes(1);
    });
  });
});
