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
  REMOTE = 'remote',
  PRESENTIAL = 'presential',
}

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

/**
 * Payment Status - matches backend PaymentStatus enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PAID = 'paid',
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
  // WhatsApp opt-in fields for reminder messages
  whatsappOptIn?: boolean;
  whatsappOptInDate?: string;
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

/**
 * Note entity - matches backend NoteResponse
 * Backend returns patientId, and optionally patient object when expanded
 */
export type Note = {
  id: string;
  text: string; // Decrypted text from backend
  noteDate: string; // ISO date string (YYYY-MM-DD)
  patientId: string; // UUID of the patient
  patient?: {
    id: string;
    firstName?: string;
    lastName?: string;
    active?: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

/**
 * Payment - matches backend PaymentResponse
 */
export type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  dueDate?: string;
  paidDate?: string;
  status: PaymentStatus;
  description?: string;
  sessionId: string;
  patient?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
  };
};

/**
 * Weekly Payment Statistics - matches backend findWeeklyPayments response
 */
export type WeeklyPaymentStats = {
  total: number;
  totalPending: number;
  payments: Payment[];
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
  // WhatsApp opt-in fields for reminder messages
  whatsappOptIn?: boolean;
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
  text: string;
  noteDate: string; // ISO 8601 date string
  patientId: string;
};

export type UpdateNoteDto = {
  text?: string;
  noteDate?: string;
};

/**
 * CreatePaymentDto - matches backend CreatePaymentDto
 */
export type CreatePaymentDto = {
  sessionId: string;
  amount: number;
  paymentDate: string;
  description?: string;
  status?: PaymentStatus;
  paidDate?: string;
};

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

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
