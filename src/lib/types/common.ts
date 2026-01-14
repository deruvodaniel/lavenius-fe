/**
 * Common types shared across the application
 */

export interface TherapistInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName?: string;
  age?: number;
  email?: string;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: string;
  description?: string;
}
