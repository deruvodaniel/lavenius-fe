import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentService } from '../../lib/services/appointment.service';
import { apiClient } from '../../lib/api/client';
import type { Appointment, CreateAppointmentDto } from '../../lib/types/api.types';
import { SessionType, AppointmentStatus } from '../../lib/types/api.types';

vi.mock('../../lib/api/client');

describe('AppointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointment: Appointment = {
    id: '1',
    therapistId: 'therapist-1',
    patientId: 'patient-1',
    dateTime: '2024-01-15T10:00:00Z',
    sessionType: SessionType.PRESENTIAL,
    status: AppointmentStatus.PENDING,
    cost: 100,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getAll', () => {
    it('should fetch all appointments', async () => {
      const mockAppointments = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/appointments');
      expect(result).toEqual(mockAppointments);
    });
  });

  describe('getByPatientId', () => {
    it('should fetch appointments for a specific patient', async () => {
      const mockAppointments = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getByPatientId('patient-1');

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe('patient-1');
    });
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      const createData: CreateAppointmentDto = {
        patientId: 'patient-1',
        dateTime: '2024-01-15T10:00:00Z',
        sessionType: SessionType.PRESENTIAL,
        status: AppointmentStatus.PENDING,
        cost: 100,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockAppointment);

      const result = await appointmentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/appointments', createData);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('getById', () => {
    it('should fetch a single appointment by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockAppointment);

      const result = await appointmentService.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/appointments/1');
      expect(result).toEqual(mockAppointment);
    });

    it('should throw error when appointment not found', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Appointment not found'));

      await expect(appointmentService.getById('invalid-id')).rejects.toThrow('Appointment not found');
    });
  });

  describe('update', () => {
    it('should update an existing appointment', async () => {
      const updateData = {
        cost: 150,
        status: AppointmentStatus.CONFIRMED,
      };
      const updatedAppointment = { ...mockAppointment, ...updateData };
      vi.mocked(apiClient.patch).mockResolvedValue(updatedAppointment);

      const result = await appointmentService.update('1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/appointments/1', updateData);
      expect(result).toEqual(updatedAppointment);
    });

    it('should throw error when update fails', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Update failed'));

      await expect(appointmentService.update('1', { cost: 150 })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete an appointment', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await appointmentService.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/appointments/1');
    });

    it('should throw error when delete fails', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(appointmentService.delete('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getByDateRange', () => {
    it('should filter appointments within date range', async () => {
      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-20');

      const mockAppointments = [
        { ...mockAppointment, id: '1', dateTime: '2024-01-05T10:00:00Z' }, // before range
        { ...mockAppointment, id: '2', dateTime: '2024-01-15T10:00:00Z' }, // within range
        { ...mockAppointment, id: '3', dateTime: '2024-01-18T14:00:00Z' }, // within range
        { ...mockAppointment, id: '4', dateTime: '2024-01-25T10:00:00Z' }, // after range
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getByDateRange(startDate, endDate);

      expect(apiClient.get).toHaveBeenCalledWith('/appointments');
      expect(result).toHaveLength(2);
      expect(result.map(a => a.id)).toEqual(['2', '3']);
    });

    it('should return empty array when no appointments in range', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      const mockAppointments = [
        { ...mockAppointment, id: '1', dateTime: '2024-01-15T10:00:00Z' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getByDateRange(startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('should include appointments on boundary dates', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const mockAppointments = [
        { ...mockAppointment, id: '1', dateTime: '2024-01-15T10:00:00Z' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getUpcoming', () => {
    it('should fetch upcoming appointments sorted by date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockAppointments = [
        { ...mockAppointment, id: '1', dateTime: futureDate.toISOString() },
        { ...mockAppointment, id: '2', dateTime: pastDate.toISOString() },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getUpcoming();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should limit upcoming appointments when limit is provided', async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 1);
      
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 2);

      const mockAppointments = [
        { ...mockAppointment, id: '1', dateTime: futureDate1.toISOString() },
        { ...mockAppointment, id: '2', dateTime: futureDate2.toISOString() },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAppointments);

      const result = await appointmentService.getUpcoming(1);

      expect(result).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should propagate error when getAll fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(appointmentService.getAll()).rejects.toThrow('Network error');
    });

    it('should propagate error when create fails', async () => {
      const createData = {
        patientId: 'patient-1',
        dateTime: '2024-01-15T10:00:00Z',
        sessionType: SessionType.PRESENTIAL,
        status: AppointmentStatus.PENDING,
        cost: 100,
      };
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Validation error'));

      await expect(appointmentService.create(createData)).rejects.toThrow('Validation error');
    });

    it('should propagate error when getByPatientId fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));

      await expect(appointmentService.getByPatientId('patient-1')).rejects.toThrow('Server error');
    });

    it('should propagate error when getByDateRange fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));

      await expect(
        appointmentService.getByDateRange(new Date(), new Date())
      ).rejects.toThrow('Server error');
    });

    it('should propagate error when getUpcoming fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));

      await expect(appointmentService.getUpcoming()).rejects.toThrow('Server error');
    });
  });
});
