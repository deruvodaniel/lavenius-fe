import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useAppointmentStore,
  selectAppointments,
  selectSelectedAppointment,
  selectIsLoading,
  selectError,
  selectTodayAppointments,
} from '../../lib/stores/appointment.store';
import { appointmentService } from '../../lib/services/appointment.service';
import { ApiClientError } from '../../lib/api/client';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../../lib/types/api.types';
import { AppointmentStatus, SessionType } from '../../lib/types/api.types';

// Mock the appointment service
vi.mock('../../lib/services/appointment.service', () => ({
  appointmentService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByPatientId: vi.fn(),
    getUpcoming: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useAppointmentStore', () => {
  // Mock appointment data
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      therapistId: 'therapist-1',
      patientId: 'patient-1',
      dateTime: '2024-01-15T10:00:00Z',
      description: 'Sesion inicial',
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.CONFIRMED,
      cost: 100,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      therapistId: 'therapist-1',
      patientId: 'patient-2',
      dateTime: '2024-01-15T11:00:00Z',
      description: 'Seguimiento',
      sessionType: SessionType.REMOTE,
      status: AppointmentStatus.COMPLETED,
      cost: 80,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      therapistId: 'therapist-1',
      patientId: 'patient-1',
      dateTime: '2024-01-20T14:00:00Z',
      description: 'Terapia grupal',
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.PENDING,
      cost: 120,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  const initialState = {
    appointments: [],
    selectedAppointment: null,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    useAppointmentStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty appointments array by default', () => {
      const { appointments } = useAppointmentStore.getState();
      expect(appointments).toEqual([]);
    });

    it('should have null selectedAppointment by default', () => {
      const { selectedAppointment } = useAppointmentStore.getState();
      expect(selectedAppointment).toBeNull();
    });

    it('should have isLoading false by default', () => {
      const { isLoading } = useAppointmentStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have null error by default', () => {
      const { error } = useAppointmentStore.getState();
      expect(error).toBeNull();
    });
  });

  // ==================== fetchAppointments Tests ====================
  describe('fetchAppointments', () => {
    it('should call appointmentService.getAll', async () => {
      vi.mocked(appointmentService.getAll).mockResolvedValue(mockAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(appointmentService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading to true during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.getAll).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return mockAppointments;
      });

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('should set isLoading to false after successful request', async () => {
      vi.mocked(appointmentService.getAll).mockResolvedValue(mockAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should populate appointments array on success', async () => {
      vi.mocked(appointmentService.getAll).mockResolvedValue(mockAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(useAppointmentStore.getState().appointments).toEqual(mockAppointments);
      expect(useAppointmentStore.getState().appointments).toHaveLength(3);
    });

    it('should clear error on successful request', async () => {
      // First set an error
      useAppointmentStore.setState({ error: 'Previous error' });
      vi.mocked(appointmentService.getAll).mockResolvedValue(mockAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(useAppointmentStore.getState().error).toBeNull();
    });

    it('should set error on failure with generic error', async () => {
      vi.mocked(appointmentService.getAll).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchAppointments();
        } catch {
          // Expected to throw
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al cargar citas');
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set ApiClientError message on API failure', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error del servidor');
      vi.mocked(appointmentService.getAll).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchAppointments();
        } catch {
          // Expected to throw
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error del servidor');
    });

    it('should throw error on failure', async () => {
      vi.mocked(appointmentService.getAll).mockRejectedValue(new Error('Network error'));

      await expect(useAppointmentStore.getState().fetchAppointments()).rejects.toThrow(
        'Network error'
      );
    });
  });

  // ==================== fetchAppointmentById Tests ====================
  describe('fetchAppointmentById', () => {
    it('should call appointmentService.getById with correct id', async () => {
      vi.mocked(appointmentService.getById).mockResolvedValue(mockAppointments[0]);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointmentById('1');
      });

      expect(appointmentService.getById).toHaveBeenCalledWith('1');
    });

    it('should set selectedAppointment on success', async () => {
      vi.mocked(appointmentService.getById).mockResolvedValue(mockAppointments[0]);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointmentById('1');
      });

      expect(useAppointmentStore.getState().selectedAppointment).toEqual(mockAppointments[0]);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.getById).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return mockAppointments[0];
      });

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointmentById('1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Cita no encontrada');
      vi.mocked(appointmentService.getById).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchAppointmentById('999');
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Cita no encontrada');
    });

    it('should throw error on failure', async () => {
      vi.mocked(appointmentService.getById).mockRejectedValue(new Error('Not found'));

      await expect(useAppointmentStore.getState().fetchAppointmentById('999')).rejects.toThrow(
        'Not found'
      );
    });
  });

  // ==================== fetchByPatientId Tests ====================
  describe('fetchByPatientId', () => {
    const patientAppointments = [mockAppointments[0], mockAppointments[2]]; // patient-1 appointments

    it('should call appointmentService.getByPatientId with correct patientId', async () => {
      vi.mocked(appointmentService.getByPatientId).mockResolvedValue(patientAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchByPatientId('patient-1');
      });

      expect(appointmentService.getByPatientId).toHaveBeenCalledWith('patient-1');
    });

    it('should populate appointments with patient appointments', async () => {
      vi.mocked(appointmentService.getByPatientId).mockResolvedValue(patientAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchByPatientId('patient-1');
      });

      expect(useAppointmentStore.getState().appointments).toEqual(patientAppointments);
      expect(useAppointmentStore.getState().appointments).toHaveLength(2);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.getByPatientId).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return patientAppointments;
      });

      await act(async () => {
        await useAppointmentStore.getState().fetchByPatientId('patient-1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error de servidor');
      vi.mocked(appointmentService.getByPatientId).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchByPatientId('patient-1');
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error de servidor');
    });

    it('should set generic error message when not ApiClientError', async () => {
      vi.mocked(appointmentService.getByPatientId).mockRejectedValue(new Error('Unknown error'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchByPatientId('patient-1');
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al cargar citas del paciente');
    });

    it('should return empty array when patient has no appointments', async () => {
      vi.mocked(appointmentService.getByPatientId).mockResolvedValue([]);

      await act(async () => {
        await useAppointmentStore.getState().fetchByPatientId('patient-999');
      });

      expect(useAppointmentStore.getState().appointments).toEqual([]);
    });
  });

  // ==================== fetchUpcoming Tests ====================
  describe('fetchUpcoming', () => {
    const upcomingAppointments = [mockAppointments[0], mockAppointments[2]];

    it('should call appointmentService.getUpcoming without limit', async () => {
      vi.mocked(appointmentService.getUpcoming).mockResolvedValue(upcomingAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchUpcoming();
      });

      expect(appointmentService.getUpcoming).toHaveBeenCalledWith(undefined);
    });

    it('should call appointmentService.getUpcoming with limit', async () => {
      vi.mocked(appointmentService.getUpcoming).mockResolvedValue([mockAppointments[0]]);

      await act(async () => {
        await useAppointmentStore.getState().fetchUpcoming(5);
      });

      expect(appointmentService.getUpcoming).toHaveBeenCalledWith(5);
    });

    it('should populate appointments with upcoming appointments', async () => {
      vi.mocked(appointmentService.getUpcoming).mockResolvedValue(upcomingAppointments);

      await act(async () => {
        await useAppointmentStore.getState().fetchUpcoming();
      });

      expect(useAppointmentStore.getState().appointments).toEqual(upcomingAppointments);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.getUpcoming).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return upcomingAppointments;
      });

      await act(async () => {
        await useAppointmentStore.getState().fetchUpcoming();
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(500, 'ServerError', 'Error al obtener citas');
      vi.mocked(appointmentService.getUpcoming).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchUpcoming();
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al obtener citas');
    });

    it('should set generic error message when not ApiClientError', async () => {
      vi.mocked(appointmentService.getUpcoming).mockRejectedValue(new Error('Unknown'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().fetchUpcoming();
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al cargar próximas citas');
    });
  });

  // ==================== createAppointment Tests ====================
  describe('createAppointment', () => {
    const newAppointmentData: CreateAppointmentDto = {
      patientId: 'patient-3',
      dateTime: '2024-01-25T15:00:00Z',
      description: 'Nueva consulta',
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.PENDING,
      cost: 150,
    };

    const createdAppointment: Appointment = {
      id: '4',
      therapistId: 'therapist-1',
      patientId: 'patient-3',
      dateTime: '2024-01-25T15:00:00Z',
      description: 'Nueva consulta',
      sessionType: SessionType.PRESENTIAL,
      status: AppointmentStatus.PENDING,
      cost: 150,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
    };

    it('should call appointmentService.create with correct data', async () => {
      vi.mocked(appointmentService.create).mockResolvedValue(createdAppointment);

      await act(async () => {
        await useAppointmentStore.getState().createAppointment(newAppointmentData);
      });

      expect(appointmentService.create).toHaveBeenCalledWith(newAppointmentData);
    });

    it('should return created appointment', async () => {
      vi.mocked(appointmentService.create).mockResolvedValue(createdAppointment);

      let result: Appointment | undefined;
      await act(async () => {
        result = await useAppointmentStore.getState().createAppointment(newAppointmentData);
      });

      expect(result).toEqual(createdAppointment);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.create).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return createdAppointment;
      });

      await act(async () => {
        await useAppointmentStore.getState().createAppointment(newAppointmentData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should not add appointment to list (lets caller refetch)', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.create).mockResolvedValue(createdAppointment);

      await act(async () => {
        await useAppointmentStore.getState().createAppointment(newAppointmentData);
      });

      // Store does not optimistically update - expects caller to refetch
      expect(useAppointmentStore.getState().appointments).toHaveLength(3);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(400, 'BadRequest', 'Datos invalidos');
      vi.mocked(appointmentService.create).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().createAppointment(newAppointmentData);
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Datos invalidos');
    });

    it('should set generic error message when not ApiClientError', async () => {
      vi.mocked(appointmentService.create).mockRejectedValue(new Error('Create failed'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().createAppointment(newAppointmentData);
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al crear cita');
    });

    it('should throw error on failure', async () => {
      vi.mocked(appointmentService.create).mockRejectedValue(new Error('Create failed'));

      await expect(
        useAppointmentStore.getState().createAppointment(newAppointmentData)
      ).rejects.toThrow('Create failed');
    });
  });

  // ==================== updateAppointment Tests ====================
  describe('updateAppointment', () => {
    const updateData: UpdateAppointmentDto = {
      description: 'Descripcion actualizada',
      status: AppointmentStatus.CONFIRMED,
    };

    const updatedAppointment: Appointment = {
      ...mockAppointments[0],
      description: 'Descripcion actualizada',
      status: AppointmentStatus.CONFIRMED,
      updatedAt: '2024-01-10T00:00:00Z',
    };

    it('should call appointmentService.update with correct id and data', async () => {
      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      expect(appointmentService.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should update appointment in appointments list', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      const { appointments } = useAppointmentStore.getState();
      const appointment = appointments.find((a) => a.id === '1');
      expect(appointment?.description).toBe('Descripcion actualizada');
      expect(appointment?.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should update selectedAppointment if it matches updated appointment', async () => {
      useAppointmentStore.setState({
        appointments: mockAppointments,
        selectedAppointment: mockAppointments[0],
      });
      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      expect(useAppointmentStore.getState().selectedAppointment).toEqual(updatedAppointment);
    });

    it('should not update selectedAppointment if it does not match', async () => {
      useAppointmentStore.setState({
        appointments: mockAppointments,
        selectedAppointment: mockAppointments[1], // Different appointment
      });
      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      expect(useAppointmentStore.getState().selectedAppointment).toEqual(mockAppointments[1]);
    });

    it('should return updated appointment', async () => {
      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      let result: Appointment | undefined;
      await act(async () => {
        result = await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      expect(result).toEqual(updatedAppointment);
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.update).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return updatedAppointment;
      });

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', updateData);
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Cita no encontrada');
      vi.mocked(appointmentService.update).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().updateAppointment('999', updateData);
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Cita no encontrada');
    });

    it('should set generic error message when not ApiClientError', async () => {
      vi.mocked(appointmentService.update).mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().updateAppointment('1', updateData);
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al actualizar cita');
    });

    it('should throw error on failure', async () => {
      vi.mocked(appointmentService.update).mockRejectedValue(new Error('Update failed'));

      await expect(
        useAppointmentStore.getState().updateAppointment('1', updateData)
      ).rejects.toThrow('Update failed');
    });
  });

  // ==================== Status Update Tests ====================
  describe('Status Updates', () => {
    it('should mark appointment as completed', async () => {
      const completedAppointment: Appointment = {
        ...mockAppointments[0],
        status: AppointmentStatus.COMPLETED,
        updatedAt: '2024-01-10T00:00:00Z',
      };

      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.update).mockResolvedValue(completedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', {
          status: AppointmentStatus.COMPLETED,
        });
      });

      const appointment = useAppointmentStore.getState().appointments.find((a) => a.id === '1');
      expect(appointment?.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('should mark appointment as cancelled', async () => {
      const cancelledAppointment: Appointment = {
        ...mockAppointments[0],
        status: AppointmentStatus.CANCELLED,
        updatedAt: '2024-01-10T00:00:00Z',
      };

      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.update).mockResolvedValue(cancelledAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', {
          status: AppointmentStatus.CANCELLED,
        });
      });

      const appointment = useAppointmentStore.getState().appointments.find((a) => a.id === '1');
      expect(appointment?.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should reschedule appointment (update dateTime)', async () => {
      const newDateTime = '2024-02-01T16:00:00Z';
      const rescheduledAppointment: Appointment = {
        ...mockAppointments[0],
        dateTime: newDateTime,
        updatedAt: '2024-01-10T00:00:00Z',
      };

      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.update).mockResolvedValue(rescheduledAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', {
          dateTime: newDateTime,
        });
      });

      const appointment = useAppointmentStore.getState().appointments.find((a) => a.id === '1');
      expect(appointment?.dateTime).toBe(newDateTime);
    });
  });

  // ==================== deleteAppointment Tests ====================
  describe('deleteAppointment', () => {
    it('should call appointmentService.delete with correct id', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1');
      });

      expect(appointmentService.delete).toHaveBeenCalledWith('1');
    });

    it('should remove appointment from appointments list', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1');
      });

      const { appointments } = useAppointmentStore.getState();
      expect(appointments.find((a) => a.id === '1')).toBeUndefined();
      expect(appointments).toHaveLength(2);
    });

    it('should clear selectedAppointment if deleted appointment was selected', async () => {
      useAppointmentStore.setState({
        appointments: mockAppointments,
        selectedAppointment: mockAppointments[0],
      });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1');
      });

      expect(useAppointmentStore.getState().selectedAppointment).toBeNull();
    });

    it('should not clear selectedAppointment if different appointment was deleted', async () => {
      useAppointmentStore.setState({
        appointments: mockAppointments,
        selectedAppointment: mockAppointments[1], // Appointment 2 is selected
      });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1'); // Delete appointment 1
      });

      expect(useAppointmentStore.getState().selectedAppointment?.id).toBe('2');
    });

    it('should set isLoading during request', async () => {
      let loadingDuringRequest = false;

      vi.mocked(appointmentService.delete).mockImplementation(async () => {
        loadingDuringRequest = useAppointmentStore.getState().isLoading;
        return undefined;
      });

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1');
      });

      expect(loadingDuringRequest).toBe(true);
      expect(useAppointmentStore.getState().isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const apiError = new ApiClientError(404, 'NotFound', 'Cita no encontrada');
      vi.mocked(appointmentService.delete).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAppointmentStore.getState().deleteAppointment('999');
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Cita no encontrada');
    });

    it('should set generic error message when not ApiClientError', async () => {
      vi.mocked(appointmentService.delete).mockRejectedValue(new Error('Delete failed'));

      await act(async () => {
        try {
          await useAppointmentStore.getState().deleteAppointment('1');
        } catch {
          // Expected
        }
      });

      expect(useAppointmentStore.getState().error).toBe('Error al eliminar cita');
    });

    it('should throw error on failure', async () => {
      vi.mocked(appointmentService.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(useAppointmentStore.getState().deleteAppointment('1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  // ==================== setSelectedAppointment Tests ====================
  describe('setSelectedAppointment', () => {
    it('should set selectedAppointment to provided appointment', () => {
      useAppointmentStore.getState().setSelectedAppointment(mockAppointments[0]);

      expect(useAppointmentStore.getState().selectedAppointment).toEqual(mockAppointments[0]);
    });

    it('should set selectedAppointment to null when clearing', () => {
      useAppointmentStore.setState({ selectedAppointment: mockAppointments[0] });

      useAppointmentStore.getState().setSelectedAppointment(null);

      expect(useAppointmentStore.getState().selectedAppointment).toBeNull();
    });

    it('should update selectedAppointment when changing selection', () => {
      useAppointmentStore.setState({ selectedAppointment: mockAppointments[0] });

      useAppointmentStore.getState().setSelectedAppointment(mockAppointments[1]);

      expect(useAppointmentStore.getState().selectedAppointment).toEqual(mockAppointments[1]);
    });
  });

  // ==================== clearError Tests ====================
  describe('clearError', () => {
    it('should clear error when set', () => {
      useAppointmentStore.setState({ error: 'Some error' });

      useAppointmentStore.getState().clearError();

      expect(useAppointmentStore.getState().error).toBeNull();
    });

    it('should have no effect when error is already null', () => {
      useAppointmentStore.setState({ error: null });

      useAppointmentStore.getState().clearError();

      expect(useAppointmentStore.getState().error).toBeNull();
    });
  });

  // ==================== Selectors Tests ====================
  describe('Selectors', () => {
    beforeEach(() => {
      useAppointmentStore.setState({
        appointments: mockAppointments,
        selectedAppointment: mockAppointments[0],
        isLoading: true,
        error: 'Test error',
      });
    });

    it('selectAppointments returns appointments array', () => {
      const state = useAppointmentStore.getState();
      expect(selectAppointments(state)).toEqual(mockAppointments);
    });

    it('selectSelectedAppointment returns selected appointment', () => {
      const state = useAppointmentStore.getState();
      expect(selectSelectedAppointment(state)).toEqual(mockAppointments[0]);
    });

    it('selectIsLoading returns loading state', () => {
      const state = useAppointmentStore.getState();
      expect(selectIsLoading(state)).toBe(true);
    });

    it('selectError returns error message', () => {
      const state = useAppointmentStore.getState();
      expect(selectError(state)).toBe('Test error');
    });
  });

  // ==================== selectTodayAppointments Tests ====================
  describe('selectTodayAppointments', () => {
    it('should return appointments for today', () => {
      const now = new Date();
      const todayMorning = new Date(now);
      todayMorning.setHours(10, 0, 0, 0);
      const todayAfternoon = new Date(now);
      todayAfternoon.setHours(14, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const appointmentsWithToday: Appointment[] = [
        {
          ...mockAppointments[0],
          id: 'today-1',
          dateTime: todayMorning.toISOString(),
        },
        {
          ...mockAppointments[1],
          id: 'today-2',
          dateTime: todayAfternoon.toISOString(),
        },
        {
          ...mockAppointments[2],
          id: 'tomorrow-1',
          dateTime: tomorrow.toISOString(),
        },
      ];

      useAppointmentStore.setState({ appointments: appointmentsWithToday });

      const state = useAppointmentStore.getState();
      const todayAppointments = selectTodayAppointments(state);

      expect(todayAppointments).toHaveLength(2);
      expect(todayAppointments.map((a) => a.id)).toContain('today-1');
      expect(todayAppointments.map((a) => a.id)).toContain('today-2');
      expect(todayAppointments.map((a) => a.id)).not.toContain('tomorrow-1');
    });

    it('should return empty array when no appointments today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointmentsNotToday: Appointment[] = [
        {
          ...mockAppointments[0],
          dateTime: yesterday.toISOString(),
        },
        {
          ...mockAppointments[1],
          dateTime: tomorrow.toISOString(),
        },
      ];

      useAppointmentStore.setState({ appointments: appointmentsNotToday });

      const state = useAppointmentStore.getState();
      const todayAppointments = selectTodayAppointments(state);

      expect(todayAppointments).toHaveLength(0);
    });

    it('should return empty array when appointments list is empty', () => {
      useAppointmentStore.setState({ appointments: [] });

      const state = useAppointmentStore.getState();
      const todayAppointments = selectTodayAppointments(state);

      expect(todayAppointments).toEqual([]);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty appointments list gracefully', async () => {
      vi.mocked(appointmentService.getAll).mockResolvedValue([]);

      await act(async () => {
        await useAppointmentStore.getState().fetchAppointments();
      });

      expect(useAppointmentStore.getState().appointments).toEqual([]);
    });

    it('should handle concurrent fetch requests', async () => {
      vi.mocked(appointmentService.getAll)
        .mockResolvedValueOnce(mockAppointments)
        .mockResolvedValueOnce([mockAppointments[0]]);

      await act(async () => {
        await Promise.all([
          useAppointmentStore.getState().fetchAppointments(),
          useAppointmentStore.getState().fetchAppointments(),
        ]);
      });

      // Both requests should complete
      expect(appointmentService.getAll).toHaveBeenCalledTimes(2);
    });

    it('should handle update of non-existent appointment in list', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });

      const nonExistentAppointment: Appointment = {
        ...mockAppointments[0],
        id: '999',
        description: 'Unknown',
      };

      vi.mocked(appointmentService.update).mockResolvedValue(nonExistentAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('999', { description: 'Unknown' });
      });

      // Should not add new appointment, just attempt update
      expect(useAppointmentStore.getState().appointments).toHaveLength(3);
      // The non-existent appointment should not be in the list
      expect(
        useAppointmentStore.getState().appointments.find((a) => a.id === '999')
      ).toBeUndefined();
    });

    it('should handle delete of non-existent appointment from list', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('999');
      });

      // List should remain unchanged
      expect(useAppointmentStore.getState().appointments).toHaveLength(3);
    });

    it('should preserve other appointments when updating one', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });

      const updatedAppointment: Appointment = {
        ...mockAppointments[0],
        description: 'Updated description',
      };

      vi.mocked(appointmentService.update).mockResolvedValue(updatedAppointment);

      await act(async () => {
        await useAppointmentStore.getState().updateAppointment('1', {
          description: 'Updated description',
        });
      });

      const { appointments } = useAppointmentStore.getState();
      expect(appointments).toHaveLength(3);
      expect(appointments.find((a) => a.id === '2')).toEqual(mockAppointments[1]);
      expect(appointments.find((a) => a.id === '3')).toEqual(mockAppointments[2]);
    });

    it('should preserve other appointments when deleting one', async () => {
      useAppointmentStore.setState({ appointments: mockAppointments });
      vi.mocked(appointmentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await useAppointmentStore.getState().deleteAppointment('1');
      });

      const { appointments } = useAppointmentStore.getState();
      expect(appointments).toHaveLength(2);
      expect(appointments.find((a) => a.id === '2')).toEqual(mockAppointments[1]);
      expect(appointments.find((a) => a.id === '3')).toEqual(mockAppointments[2]);
    });
  });
});
