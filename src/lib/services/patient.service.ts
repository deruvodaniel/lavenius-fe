import { apiClient } from '../api/client';
import { decryptField, encryptField } from '../e2e/crypto';
import { getE2EKeyState } from '../e2e/keyManager';
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientDetailsResponse,
  SessionType,
} from '../types/api.types';

/**
 * Patient filter options for server-side filtering
 */
export interface PatientFilters {
  name?: string;
  sessionType?: 'remote' | 'presential';
  frequency?: 'semanal' | 'quincenal' | 'mensual' | 'otra';
  hasSessionThisWeek?: boolean;
}

type PatientApiResponse = Omit<Patient, 'lastName' | 'age' | 'healthInsurance' | 'sessionType' | 'frequency' | 'diagnosis' | 'currentTreatment' | 'observations' | 'alternativePhone' | 'riskLevel' | 'isMedicated'> & {
  lastName?: string;
  age?: number | string;
  healthInsurance?: string;
  sessionType?: SessionType;
  frequency?: string;
  diagnosis?: string;
  currentTreatment?: string;
  observations?: string;
  alternativePhone?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  isMedicated?: boolean | string;
  encryptedLastName?: string;
  lastNameIv?: string;
  encryptedAge?: string;
  ageIv?: string;
  encryptedHealthInsurance?: string;
  healthInsuranceIv?: string;
  encryptedSessionType?: string;
  sessionTypeIv?: string;
  encryptedFrequency?: string;
  frequencyIv?: string;
  encryptedDiagnosis?: string;
  diagnosisIv?: string;
  encryptedCurrentTreatment?: string;
  currentTreatmentIv?: string;
  encryptedObservations?: string;
  observationsIv?: string;
  encryptedAlternativePhone?: string;
  alternativePhoneIv?: string;
  encryptedRiskLevel?: string;
  riskLevelIv?: string;
  encryptedIsMedicated?: string;
  isMedicatedIv?: string;
};

function requireE2EUserKey(): Uint8Array {
  const userKey = getE2EKeyState().userKey;
  if (!userKey) {
    throw new Error('E2E key is locked');
  }
  return userKey;
}

function sanitizeString(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalNumber(value?: string | number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBoolean(value?: string | boolean): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * Patient Service
 * Maneja todas las operaciones CRUD de pacientes
 */
export class PatientService {
  private readonly basePath = '/patients';

  private async decryptFieldSafe(
    encryptedValue: string | undefined,
    iv: string | undefined,
    fallbackValue?: string
  ): Promise<string | undefined> {
    if (encryptedValue && iv) {
      try {
        return await decryptField(encryptedValue, iv, requireE2EUserKey());
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to decrypt patient field', error);
        }
      }
    }

    return fallbackValue;
  }

  private async toEncryptedPayload(data: CreatePatientDto | UpdatePatientDto): Promise<Record<string, unknown>> {
    const userKey = requireE2EUserKey();
    const payload: Record<string, unknown> = {};

    if ('firstName' in data && data.firstName !== undefined) payload.firstName = sanitizeString(data.firstName);
    if ('phone' in data) payload.phone = sanitizeString(data.phone);
    if ('email' in data) payload.email = sanitizeString(data.email);
    if ('whatsappOptIn' in data) payload.whatsappOptIn = data.whatsappOptIn;

    const addEncryptedField = async (plaintextValue: string | undefined, encryptedKey: string, ivKey: string) => {
      if (plaintextValue === undefined) return;
      const encrypted = await encryptField(plaintextValue, userKey);
      payload[encryptedKey] = encrypted.ciphertext;
      payload[ivKey] = encrypted.iv;
    };

    await addEncryptedField(
      'lastName' in data ? sanitizeString(data.lastName) : undefined,
      'encryptedLastName',
      'lastNameIv'
    );
    await addEncryptedField(
      'age' in data && data.age !== undefined ? String(data.age) : undefined,
      'encryptedAge',
      'ageIv'
    );
    await addEncryptedField(
      'healthInsurance' in data ? sanitizeString(data.healthInsurance) : undefined,
      'encryptedHealthInsurance',
      'healthInsuranceIv'
    );
    await addEncryptedField(
      'sessionType' in data && data.sessionType ? String(data.sessionType) : undefined,
      'encryptedSessionType',
      'sessionTypeIv'
    );
    await addEncryptedField(
      'frequency' in data ? sanitizeString(data.frequency) : undefined,
      'encryptedFrequency',
      'frequencyIv'
    );
    await addEncryptedField(
      'diagnosis' in data ? sanitizeString(data.diagnosis) : undefined,
      'encryptedDiagnosis',
      'diagnosisIv'
    );
    await addEncryptedField(
      'currentTreatment' in data ? sanitizeString(data.currentTreatment) : undefined,
      'encryptedCurrentTreatment',
      'currentTreatmentIv'
    );
    await addEncryptedField(
      'observations' in data ? sanitizeString(data.observations) : undefined,
      'encryptedObservations',
      'observationsIv'
    );
    await addEncryptedField(
      'alternativePhone' in data ? sanitizeString(data.alternativePhone) : undefined,
      'encryptedAlternativePhone',
      'alternativePhoneIv'
    );
    await addEncryptedField(
      'riskLevel' in data && data.riskLevel ? String(data.riskLevel) : undefined,
      'encryptedRiskLevel',
      'riskLevelIv'
    );
    await addEncryptedField(
      'isMedicated' in data && data.isMedicated !== undefined ? String(data.isMedicated) : undefined,
      'encryptedIsMedicated',
      'isMedicatedIv'
    );

    return payload;
  }

  private async mapPatient(apiPatient: PatientApiResponse): Promise<Patient> {
    const lastName = await this.decryptFieldSafe(
      apiPatient.encryptedLastName,
      apiPatient.lastNameIv,
      apiPatient.lastName
    );

    const age = parseOptionalNumber(
      await this.decryptFieldSafe(apiPatient.encryptedAge, apiPatient.ageIv, typeof apiPatient.age === 'string' ? apiPatient.age : undefined)
    ) ?? parseOptionalNumber(apiPatient.age);

    const healthInsurance = await this.decryptFieldSafe(
      apiPatient.encryptedHealthInsurance,
      apiPatient.healthInsuranceIv,
      apiPatient.healthInsurance
    );

    const sessionType = await this.decryptFieldSafe(
      apiPatient.encryptedSessionType,
      apiPatient.sessionTypeIv,
      apiPatient.sessionType
    ) as SessionType | undefined;

    const frequency = await this.decryptFieldSafe(
      apiPatient.encryptedFrequency,
      apiPatient.frequencyIv,
      apiPatient.frequency
    );

    const diagnosis = await this.decryptFieldSafe(
      apiPatient.encryptedDiagnosis,
      apiPatient.diagnosisIv,
      apiPatient.diagnosis
    );

    const currentTreatment = await this.decryptFieldSafe(
      apiPatient.encryptedCurrentTreatment,
      apiPatient.currentTreatmentIv,
      apiPatient.currentTreatment
    );

    const observations = await this.decryptFieldSafe(
      apiPatient.encryptedObservations,
      apiPatient.observationsIv,
      apiPatient.observations
    );

    const alternativePhone = await this.decryptFieldSafe(
      apiPatient.encryptedAlternativePhone,
      apiPatient.alternativePhoneIv,
      apiPatient.alternativePhone
    );

    const riskLevel = await this.decryptFieldSafe(
      apiPatient.encryptedRiskLevel,
      apiPatient.riskLevelIv,
      apiPatient.riskLevel
    ) as Patient['riskLevel'];

    const isMedicatedDecrypted = await this.decryptFieldSafe(
      apiPatient.encryptedIsMedicated,
      apiPatient.isMedicatedIv,
      typeof apiPatient.isMedicated === 'string' ? apiPatient.isMedicated : undefined
    );
    const isMedicated = parseOptionalBoolean(isMedicatedDecrypted) ?? parseOptionalBoolean(apiPatient.isMedicated);

    return {
      ...apiPatient,
      lastName: lastName ?? '',
      age,
      healthInsurance,
      sessionType,
      frequency,
      diagnosis,
      currentTreatment,
      observations,
      alternativePhone,
      riskLevel,
      isMedicated,
    };
  }

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
    
    const response = await apiClient.get<PatientApiResponse[]>(url);
    if (!Array.isArray(response)) return [];
    return Promise.all(response.map((patient) => this.mapPatient(patient)));
  }

  /**
   * Get a single patient by ID
   */
  async getById(id: string): Promise<Patient> {
    const response = await apiClient.get<PatientApiResponse>(`${this.basePath}/${id}`);
    return this.mapPatient(response);
  }

  /**
   * Get patient details including next session
   */
  async getDetails(id: string): Promise<PatientDetailsResponse> {
    const response = await apiClient.get<{ patient: PatientApiResponse; nextSession?: PatientDetailsResponse['nextSession'] }>(`${this.basePath}/${id}/details`);
    return {
      patient: await this.mapPatient(response.patient),
      nextSession: response.nextSession,
    };
  }

  /**
   * Create a new patient
   */
  async create(data: CreatePatientDto): Promise<Patient> {
    const payload = await this.toEncryptedPayload(data);
    const response = await apiClient.post<PatientApiResponse, Record<string, unknown>>(this.basePath, payload);
    return this.mapPatient(response);
  }

  /**
   * Update an existing patient
   */
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const payload = await this.toEncryptedPayload(data);
    const response = await apiClient.patch<PatientApiResponse, Record<string, unknown>>(
      `${this.basePath}/${id}`,
      payload
    );
    return this.mapPatient(response);
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
