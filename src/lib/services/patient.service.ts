import { apiClient } from '../api/client';
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientDetailsResponse,
} from '../types/api.types';

/**
 * Patient Service
 * Maneja todas las operaciones CRUD de pacientes
 */
export class PatientService {
  private readonly basePath = '/patients';

  /**
   * Get all patients for the authenticated therapist
   */
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>(this.basePath);
  }

  /**
   * Get a single patient by ID
   */
  async getById(id: string): Promise<Patient> {
    return apiClient.get<Patient>(`${this.basePath}/${id}`);
  }

  /**
   * Get patient details including next session
   */
  async getDetails(id: string): Promise<PatientDetailsResponse> {
    return apiClient.get<PatientDetailsResponse>(`${this.basePath}/${id}/details`);
  }

  /**
   * Create a new patient
   */
  async create(data: CreatePatientDto): Promise<Patient> {
    return apiClient.post<Patient, CreatePatientDto>(this.basePath, data);
  }

  /**
   * Update an existing patient
   */
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    return apiClient.patch<Patient, UpdatePatientDto>(
      `${this.basePath}/${id}`,
      data
    );
  }

  /**
   * Delete a patient
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Search patients by name or email
   */
  async search(query: string): Promise<Patient[]> {
    const patients = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return patients.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerQuery) ||
        patient.lastName.toLowerCase().includes(lowerQuery) ||
        patient.email?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const patientService = new PatientService();

// Export default
export default patientService;
