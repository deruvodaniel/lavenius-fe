import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patientService } from '../../lib/services/patient.service';
import type { PatientFilters } from '../../lib/services/patient.service';
import { apiClient } from '../../lib/api/client';
import type { Patient, CreatePatientDto, PatientDetailsResponse, Appointment } from '../../lib/types/api.types';
import { PatientStatus, AppointmentStatus, SessionType } from '../../lib/types/api.types';

vi.mock('../../lib/api/client');

describe('PatientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPatient: Patient = {
    id: '1',
    therapistId: 'therapist-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: PatientStatus.ACTIVE,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getAll', () => {
    it('should fetch all patients without filters', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const result = await patientService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/patients');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with name filter', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { name: 'John' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?name=John');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with sessionType filter (remote)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { sessionType: 'remote' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?sessionType=remote');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with sessionType filter (presential)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { sessionType: 'presential' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?sessionType=presential');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with frequency filter (semanal)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { frequency: 'semanal' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?frequency=semanal');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with frequency filter (quincenal)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { frequency: 'quincenal' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?frequency=quincenal');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with frequency filter (mensual)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { frequency: 'mensual' };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?frequency=mensual');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with hasSessionThisWeek filter (true)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { hasSessionThisWeek: true };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?hasSessionThisWeek=true');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with hasSessionThisWeek filter (false)', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = { hasSessionThisWeek: false };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/patients?hasSessionThisWeek=false');
      expect(result).toEqual(mockPatients);
    });

    it('should fetch patients with combined filters', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const filters: PatientFilters = {
        name: 'John',
        sessionType: 'remote',
        frequency: 'semanal',
        hasSessionThisWeek: true,
      };
      const result = await patientService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/patients?name=John&sessionType=remote&frequency=semanal&hasSessionThisWeek=true'
      );
      expect(result).toEqual(mockPatients);
    });

    it('should handle API error when fetching patients with filters', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const filters: PatientFilters = { name: 'John' };
      
      await expect(patientService.getAll(filters)).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/patients?name=John');
    });
  });

  describe('getById', () => {
    it('should fetch a single patient by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPatient);

      const result = await patientService.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/patients/1');
      expect(result).toEqual(mockPatient);
    });
  });

  describe('getDetails', () => {
    const mockAppointment: Appointment = {
      id: 'appointment-1',
      therapistId: 'therapist-1',
      patientId: '1',
      dateTime: '2024-01-15T10:00:00.000Z',
      status: AppointmentStatus.CONFIRMED,
      sessionType: SessionType.PRESENTIAL,
      cost: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('should fetch patient details by ID', async () => {
      const mockDetailsResponse: PatientDetailsResponse = {
        patient: mockPatient,
        nextSession: mockAppointment,
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockDetailsResponse);

      const result = await patientService.getDetails('1');

      expect(apiClient.get).toHaveBeenCalledWith('/patients/1/details');
      expect(result).toEqual(mockDetailsResponse);
    });

    it('should fetch patient details without next session', async () => {
      const mockDetailsResponse: PatientDetailsResponse = {
        patient: mockPatient,
        nextSession: undefined,
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockDetailsResponse);

      const result = await patientService.getDetails('1');

      expect(apiClient.get).toHaveBeenCalledWith('/patients/1/details');
      expect(result).toEqual(mockDetailsResponse);
      expect(result.nextSession).toBeUndefined();
    });

    it('should handle API error when fetching patient details', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Patient not found'));

      await expect(patientService.getDetails('non-existent')).rejects.toThrow('Patient not found');
      expect(apiClient.get).toHaveBeenCalledWith('/patients/non-existent/details');
    });
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const createData: CreatePatientDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        status: PatientStatus.ACTIVE,
      };

      const newPatient: Patient = {
        ...mockPatient,
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      vi.mocked(apiClient.post).mockResolvedValue(newPatient);

      const result = await patientService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/patients', createData);
      expect(result).toEqual(newPatient);
    });
  });

  describe('update', () => {
    it('should update an existing patient', async () => {
      const updateData = { firstName: 'Johnny' };
      const updatedPatient = { ...mockPatient, firstName: 'Johnny' };

      vi.mocked(apiClient.patch).mockResolvedValue(updatedPatient);

      const result = await patientService.update('1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/patients/1', updateData);
      expect(result).toEqual(updatedPatient);
    });
  });

  describe('delete', () => {
    it('should delete a patient', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await patientService.delete('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/patients/1');
    });
  });

  describe('search', () => {
    it('should search patients by name', async () => {
      const mockPatients = [
        mockPatient,
        { ...mockPatient, id: '2', firstName: 'Jane', email: 'jane@example.com' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const result = await patientService.search('john');

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
    });

    it('should search patients by email', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const result = await patientService.search('john@example');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john@example.com');
    });
  });
});
