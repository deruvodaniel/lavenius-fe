import { apiClient } from '../api/client';
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientDetailsResponse,
} from '../types/api.types';

/**
 * Patient filter options for server-side filtering
 */
export interface PatientFilters {
  name?: string;
  sessionType?: 'remote' | 'presential';
  frequency?: 'semanal' | 'quincenal' | 'mensual';
  hasSessionThisWeek?: boolean;
}

/**
 * Patient Service
 * Maneja todas las operaciones CRUD de pacientes
 */
export class PatientService {
  private readonly basePath = '/patients';

  /**
   * Get all patients for the authenticated therapist
   * Supports optional server-side filters
   */
  async getAll(filters?: PatientFilters): Promise<Patient[]> {
    const params = new URLSearchParams();
    
    if (filters?.name) {
      params.append('name', filters.name);
    }
    if (filters?.sessionType) {
      params.append('sessionType', filters.sessionType);
    }
    if (filters?.frequency) {
      params.append('frequency', filters.frequency);
    }
    if (filters?.hasSessionThisWeek !== undefined) {
      params.append('hasSessionThisWeek', String(filters.hasSessionThisWeek));
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    return apiClient.get<Patient[]>(url);
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
