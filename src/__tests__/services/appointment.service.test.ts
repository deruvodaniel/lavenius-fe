import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentService } from '../../lib/services/appointment.service';
import { apiClient } from '../../lib/api/client';
import type { Appointment, CreateAppointmentDto } from '../../lib/types/api.types';

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
    sessionType: 'INDIVIDUAL',
    status: 'SCHEDULED',
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
        sessionType: 'INDIVIDUAL',
        status: 'SCHEDULED',
        cost: 100,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockAppointment);

      const result = await appointmentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/appointments', createData);
      expect(result).toEqual(mockAppointment);
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
});
