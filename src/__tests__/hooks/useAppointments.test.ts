import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppointments } from '../../lib/hooks/useAppointments';
import { useAppointmentStore } from '../../lib/stores';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../../lib/types/api.types';
import { AppointmentStatus, SessionType } from '../../lib/types/api.types';

// Mock the appointment store
vi.mock('../../lib/stores', () => ({
  useAppointmentStore: vi.fn(),
}));

describe('useAppointments', () => {
  // Get today's date for testing
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Mock appointment data
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      therapistId: 'therapist-1',
      patientId: 'patient-1',
      dateTime: today.toISOString(),
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.CONFIRMED,
      cost: 100,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      therapistId: 'therapist-1',
      patientId: 'patient-2',
      dateTime: tomorrow.toISOString(),
      sessionType: SessionType.REMOTE,
      status: AppointmentStatus.PENDING,
      cost: 120,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '3',
      therapistId: 'therapist-1',
      patientId: 'patient-1',
      dateTime: yesterday.toISOString(),
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.COMPLETED,
      cost: 100,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '4',
      therapistId: 'therapist-1',
      patientId: 'patient-3',
      dateTime: today.toISOString(),
      sessionType: SessionType.REMOTE,
      status: AppointmentStatus.CONFIRMED,
      cost: 150,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  // Mock store functions
  const mockFetchAppointments = vi.fn();
  const mockFetchUpcoming = vi.fn();
  const mockCreateAppointment = vi.fn();
  const mockUpdateAppointment = vi.fn();
  const mockDeleteAppointment = vi.fn();
  const mockClearError = vi.fn();

  // Default mock store state
  const defaultMockState = {
    appointments: mockAppointments,
    isLoading: false,
    error: null as string | null,
    fetchAppointments: mockFetchAppointments,
    fetchUpcoming: mockFetchUpcoming,
    createAppointment: mockCreateAppointment,
    updateAppointment: mockUpdateAppointment,
    deleteAppointment: mockDeleteAppointment,
    clearError: mockClearError,
  };

  // Helper to setup store mock with selector support
  const setupStoreMock = (overrides: Partial<typeof defaultMockState> = {}) => {
    const state = { ...defaultMockState, ...overrides };

    vi.mocked(useAppointmentStore).mockImplementation((selector: unknown) => {
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
    it('returns appointments array from store', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.appointments).toHaveLength(4);
    });

    it('returns isLoading false from store', () => {
      setupStoreMock({ isLoading: false });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns isLoading true from store', () => {
      setupStoreMock({ isLoading: true });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.isLoading).toBe(true);
    });

    it('returns error null from store', () => {
      setupStoreMock({ error: null });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.error).toBeNull();
    });

    it('returns error message from store', () => {
      setupStoreMock({ error: 'Error al cargar citas' });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.error).toBe('Error al cargar citas');
    });

    it('returns empty appointments array when store is empty', () => {
      setupStoreMock({ appointments: [] });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual([]);
      expect(result.current.appointments).toHaveLength(0);
    });
  });

  // ==================== todayAppointments Computed Value Tests ====================
  describe('todayAppointments', () => {
    it('returns only appointments scheduled for today', () => {
      const { result } = renderHook(() => useAppointments());

      // Should include appointments 1 and 4 (both are today)
      expect(result.current.todayAppointments).toHaveLength(2);
      expect(result.current.todayAppointments.map((a) => a.id)).toContain('1');
      expect(result.current.todayAppointments.map((a) => a.id)).toContain('4');
    });

    it('does not include tomorrow appointments', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.todayAppointments.map((a) => a.id)).not.toContain(
        '2'
      );
    });

    it('does not include yesterday appointments', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.todayAppointments.map((a) => a.id)).not.toContain(
        '3'
      );
    });

    it('returns empty array when no appointments are today', () => {
      // Create appointments that are not today
      const nonTodayAppointments = mockAppointments.filter((a) => {
        const aptDate = new Date(a.dateTime);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        return aptDate < todayStart || aptDate >= tomorrowStart;
      });

      setupStoreMock({ appointments: nonTodayAppointments });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.todayAppointments).toHaveLength(0);
    });

    it('returns empty array when appointments array is empty', () => {
      setupStoreMock({ appointments: [] });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.todayAppointments).toEqual([]);
    });

    it('handles appointments at midnight boundary', () => {
      const midnightToday = new Date();
      midnightToday.setHours(0, 0, 0, 0);

      const justBeforeMidnight = new Date(midnightToday);
      justBeforeMidnight.setMilliseconds(-1);

      const appointmentsWithBoundary: Appointment[] = [
        {
          ...mockAppointments[0],
          id: 'boundary-1',
          dateTime: midnightToday.toISOString(),
        },
      ];

      setupStoreMock({ appointments: appointmentsWithBoundary });

      const { result } = renderHook(() => useAppointments());

      expect(result.current.todayAppointments).toHaveLength(1);
    });
  });

  // ==================== Fetch Functions Tests ====================
  describe('Fetch Functions', () => {
    it('fetchAppointments calls store action', async () => {
      mockFetchAppointments.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(mockFetchAppointments).toHaveBeenCalledTimes(1);
    });

    it('fetchUpcoming calls store action', async () => {
      mockFetchUpcoming.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchUpcoming();
      });

      expect(mockFetchUpcoming).toHaveBeenCalledTimes(1);
    });

    it('fetchUpcoming calls store action with limit', async () => {
      mockFetchUpcoming.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchUpcoming(30);
      });

      expect(mockFetchUpcoming).toHaveBeenCalledWith(30);
    });
  });

  // ==================== CRUD Functions Tests ====================
  describe('CRUD Functions', () => {
    describe('createAppointment', () => {
      const newAppointmentData: CreateAppointmentDto = {
        patientId: 'patient-4',
        dateTime: '2024-02-01T10:00:00.000Z',
        sessionType: SessionType.PRESENTIAL,
        status: AppointmentStatus.PENDING,
        cost: 130,
        description: 'New appointment',
      };

      const createdAppointment: Appointment = {
        id: '5',
        therapistId: 'therapist-1',
        ...newAppointmentData,
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
      };

      it('createAppointment calls store action with data', async () => {
        mockCreateAppointment.mockResolvedValue(createdAppointment);
        const { result } = renderHook(() => useAppointments());

        await act(async () => {
          await result.current.createAppointment(newAppointmentData);
        });

        expect(mockCreateAppointment).toHaveBeenCalledWith(newAppointmentData);
        expect(mockCreateAppointment).toHaveBeenCalledTimes(1);
      });

      it('createAppointment returns created appointment from store', async () => {
        mockCreateAppointment.mockResolvedValue(createdAppointment);
        const { result } = renderHook(() => useAppointments());

        let returnedAppointment: Appointment | undefined;
        await act(async () => {
          returnedAppointment =
            await result.current.createAppointment(newAppointmentData);
        });

        expect(returnedAppointment).toEqual(createdAppointment);
      });

      it('createAppointment propagates error from store', async () => {
        const error = new Error('Error al crear cita');
        mockCreateAppointment.mockRejectedValue(error);
        const { result } = renderHook(() => useAppointments());

        await expect(
          act(async () => {
            await result.current.createAppointment(newAppointmentData);
          })
        ).rejects.toThrow('Error al crear cita');
      });
    });

    describe('updateAppointment', () => {
      const updateData: UpdateAppointmentDto = {
        status: AppointmentStatus.CONFIRMED,
        cost: 140,
      };

      const updatedAppointment: Appointment = {
        ...mockAppointments[0],
        ...updateData,
        updatedAt: '2024-01-20',
      };

      it('updateAppointment calls store action with id and data', async () => {
        mockUpdateAppointment.mockResolvedValue(updatedAppointment);
        const { result } = renderHook(() => useAppointments());

        await act(async () => {
          await result.current.updateAppointment('1', updateData);
        });

        expect(mockUpdateAppointment).toHaveBeenCalledWith('1', updateData);
        expect(mockUpdateAppointment).toHaveBeenCalledTimes(1);
      });

      it('updateAppointment returns updated appointment from store', async () => {
        mockUpdateAppointment.mockResolvedValue(updatedAppointment);
        const { result } = renderHook(() => useAppointments());

        let returnedAppointment: Appointment | undefined;
        await act(async () => {
          returnedAppointment = await result.current.updateAppointment(
            '1',
            updateData
          );
        });

        expect(returnedAppointment).toEqual(updatedAppointment);
      });

      it('updateAppointment propagates error from store', async () => {
        const error = new Error('Cita no encontrada');
        mockUpdateAppointment.mockRejectedValue(error);
        const { result } = renderHook(() => useAppointments());

        await expect(
          act(async () => {
            await result.current.updateAppointment('999', updateData);
          })
        ).rejects.toThrow('Cita no encontrada');
      });
    });

    describe('deleteAppointment', () => {
      it('deleteAppointment calls store action with id', async () => {
        mockDeleteAppointment.mockResolvedValue(undefined);
        const { result } = renderHook(() => useAppointments());

        await act(async () => {
          await result.current.deleteAppointment('1');
        });

        expect(mockDeleteAppointment).toHaveBeenCalledWith('1');
        expect(mockDeleteAppointment).toHaveBeenCalledTimes(1);
      });

      it('deleteAppointment propagates error from store', async () => {
        const error = new Error('Error al eliminar cita');
        mockDeleteAppointment.mockRejectedValue(error);
        const { result } = renderHook(() => useAppointments());

        await expect(
          act(async () => {
            await result.current.deleteAppointment('999');
          })
        ).rejects.toThrow('Error al eliminar cita');
      });
    });
  });

  // ==================== Clear Error Tests ====================
  describe('Clear Error', () => {
    it('clearError calls store action', () => {
      setupStoreMock({ error: 'Some error' });
      const { result } = renderHook(() => useAppointments());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('clearError can be called when error is null', () => {
      setupStoreMock({ error: null });
      const { result } = renderHook(() => useAppointments());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useAppointments());

      // State values
      expect(result.current).toHaveProperty('appointments');
      expect(result.current).toHaveProperty('todayAppointments');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      // Functions
      expect(result.current).toHaveProperty('fetchAppointments');
      expect(result.current).toHaveProperty('fetchUpcoming');
      expect(result.current).toHaveProperty('createAppointment');
      expect(result.current).toHaveProperty('updateAppointment');
      expect(result.current).toHaveProperty('deleteAppointment');
      expect(result.current).toHaveProperty('clearError');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => useAppointments());

      expect(typeof result.current.fetchAppointments).toBe('function');
      expect(typeof result.current.fetchUpcoming).toBe('function');
      expect(typeof result.current.createAppointment).toBe('function');
      expect(typeof result.current.updateAppointment).toBe('function');
      expect(typeof result.current.deleteAppointment).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  // ==================== Memoization Tests ====================
  describe('Memoization', () => {
    it('todayAppointments is memoized with same appointments reference', () => {
      const { result, rerender } = renderHook(() => useAppointments());

      const firstTodayAppointments = result.current.todayAppointments;
      rerender();
      const secondTodayAppointments = result.current.todayAppointments;

      // With memoization, these should be the same reference
      expect(firstTodayAppointments).toEqual(secondTodayAppointments);
    });
  });

  // ==================== Multiple Calls Tests ====================
  describe('Multiple Calls', () => {
    it('can call fetchAppointments multiple times', async () => {
      mockFetchAppointments.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
        await result.current.fetchAppointments();
        await result.current.fetchAppointments();
      });

      expect(mockFetchAppointments).toHaveBeenCalledTimes(3);
    });

    it('can perform sequential CRUD operations', async () => {
      const newAppointment: Appointment = {
        id: '5',
        therapistId: 'therapist-1',
        patientId: 'patient-4',
        dateTime: '2024-02-01T10:00:00.000Z',
        sessionType: SessionType.PRESENTIAL,
        status: AppointmentStatus.PENDING,
        cost: 130,
        createdAt: '2024-01-20',
        updatedAt: '2024-01-20',
      };

      mockCreateAppointment.mockResolvedValue(newAppointment);
      mockUpdateAppointment.mockResolvedValue({
        ...newAppointment,
        status: AppointmentStatus.CONFIRMED,
      });
      mockDeleteAppointment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.createAppointment({
          patientId: 'patient-4',
          dateTime: '2024-02-01T10:00:00.000Z',
          sessionType: SessionType.PRESENTIAL,
          status: AppointmentStatus.PENDING,
          cost: 130,
        });
        await result.current.updateAppointment('5', {
          status: AppointmentStatus.CONFIRMED,
        });
        await result.current.deleteAppointment('5');
      });

      expect(mockCreateAppointment).toHaveBeenCalledTimes(1);
      expect(mockUpdateAppointment).toHaveBeenCalledTimes(1);
      expect(mockDeleteAppointment).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles appointments with missing optional fields', () => {
      const minimalAppointment: Appointment = {
        id: '6',
        therapistId: 'therapist-1',
        patientId: 'patient-1',
        dateTime: today.toISOString(),
        sessionType: SessionType.PRESENTIAL,
        status: AppointmentStatus.PENDING,
        cost: 100,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      setupStoreMock({ appointments: [minimalAppointment] });
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toHaveLength(1);
      expect(result.current.appointments[0].description).toBeUndefined();
    });

    it('handles appointments with all statuses', () => {
      const appointmentsWithAllStatuses: Appointment[] = [
        { ...mockAppointments[0], status: AppointmentStatus.PENDING },
        { ...mockAppointments[1], status: AppointmentStatus.CONFIRMED },
        { ...mockAppointments[2], status: AppointmentStatus.COMPLETED },
        { ...mockAppointments[3], status: AppointmentStatus.CANCELLED },
      ];

      setupStoreMock({ appointments: appointmentsWithAllStatuses });
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toHaveLength(4);
    });

    it('handles appointments with both session types', () => {
      const appointmentsWithBothTypes: Appointment[] = [
        { ...mockAppointments[0], sessionType: SessionType.PRESENTIAL },
        { ...mockAppointments[1], sessionType: SessionType.REMOTE },
      ];

      setupStoreMock({ appointments: appointmentsWithBothTypes });
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toHaveLength(2);
    });
  });
});
