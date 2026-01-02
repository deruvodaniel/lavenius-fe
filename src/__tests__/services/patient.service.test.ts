import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patientService } from '../../lib/services/patient.service';
import { apiClient } from '../../lib/api/client';
import type { Patient, CreatePatientDto } from '../../lib/types/api.types';

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
    status: 'ACTIVE',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getAll', () => {
    it('should fetch all patients', async () => {
      const mockPatients = [mockPatient];
      vi.mocked(apiClient.get).mockResolvedValue(mockPatients);

      const result = await patientService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/patients');
      expect(result).toEqual(mockPatients);
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

  describe('create', () => {
    it('should create a new patient', async () => {
      const createData: CreatePatientDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        status: 'ACTIVE',
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
