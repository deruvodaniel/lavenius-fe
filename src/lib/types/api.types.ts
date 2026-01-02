/**
 * API Response Types
 * Tipos de respuestas del backend
 */

// ==================== Common Types ====================

export type ApiError = {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ==================== Enums ====================

export enum SessionType {
  INDIVIDUAL = 'INDIVIDUAL',
  COUPLE = 'COUPLE',
  FAMILY = 'FAMILY',
  GROUP = 'GROUP',
}

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum NoteType {
  SESSION = 'SESSION',
  GENERAL = 'GENERAL',
  TREATMENT_PLAN = 'TREATMENT_PLAN',
  PROGRESS = 'PROGRESS',
}

// ==================== Entity Types ====================

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
};

export type Patient = {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternativePhone?: string;
  birthDate?: string;
  age?: number;
  address?: string;
  healthInsurance?: string;
  sessionType?: SessionType;
  frequency?: string;
  diagnosis?: string;
  currentTreatment?: string;
  observations?: string;
  notes?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  isMedicated?: boolean;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  therapistId: string;
  patientId: string;
  sessionId?: string;
  dateTime: string;
  description?: string;
  sessionType: SessionType;
  status: AppointmentStatus;
  cost: number;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
};

export type Session = {
  id: string;
  therapistId: string;
  patientId: string;
  appointmentId?: string;
  sessionDate: string;
  duration?: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  therapistId: string;
  patientId: string;
  sessionId?: string;
  content: string;
  noteType: NoteType;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  therapistId: string;
  patientId: string;
  sessionId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  id: string;
  therapistId: string;
  // Agregar campos específicos de settings según necesidad
  createdAt: string;
  updatedAt: string;
};

// ==================== DTO Types ====================

export type LoginDto = {
  email: string;
  password: string;
  passphrase: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  passphrase: string;
  firstName: string;
  lastName: string;
  phone?: string;
  licenseNumber?: string;
};

export type ChangePassphraseDto = {
  currentPassphrase: string;
  newPassphrase: string;
};

export type CreatePatientDto = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternativePhone?: string;
  birthDate?: string;
  age?: number;
  address?: string;
  healthInsurance?: string;
  sessionType?: SessionType;
  frequency?: string;
  diagnosis?: string;
  currentTreatment?: string;
  observations?: string;
  notes?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  isMedicated?: boolean;
  status?: PatientStatus;
};

export type UpdatePatientDto = Partial<CreatePatientDto>;

export type CreateAppointmentDto = {
  patientId: string;
  dateTime: string;
  description?: string;
  sessionType: SessionType;
  status: AppointmentStatus;
  cost: number;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;

export type CreateNoteDto = {
  patientId: string;
  sessionId?: string;
  content: string;
  noteType: NoteType;
};

export type UpdateNoteDto = Partial<Omit<CreateNoteDto, 'patientId'>>;

export type CreatePaymentDto = {
  patientId: string;
  sessionId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
};

export type UpdatePaymentDto = Partial<Omit<CreatePaymentDto, 'patientId'>>;

// ==================== Auth Response Types ====================

export type AuthResponse = {
  access_token: string;
  user: User;
  userKey: string; // Base64 encoded encryption key
};

export type PatientDetailsResponse = {
  patient: Patient;
  nextSession?: Appointment;
};
