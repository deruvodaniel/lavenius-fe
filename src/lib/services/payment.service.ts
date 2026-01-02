import { apiClient } from '../api/client';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentStatus,
  PaymentMethod,
} from '../types/api.types';

/**
 * Payment Service
 * Maneja todas las operaciones CRUD de pagos
 */
export class PaymentService {
  private readonly basePath = '/payments';

  /**
   * Get all payments for the authenticated therapist
   */
  async getAll(): Promise<Payment[]> {
    return apiClient.get<Payment[]>(this.basePath);
  }

  /**
   * Get payments by patient ID
   */
  async getByPatientId(patientId: string): Promise<Payment[]> {
    const payments = await this.getAll();
    return payments.filter((payment) => payment.patientId === patientId);
  }

  /**
   * Get payments by status
   */
  async getByStatus(status: PaymentStatus): Promise<Payment[]> {
    const payments = await this.getAll();
    return payments.filter((payment) => payment.status === status);
  }

  /**
   * Get payments by method
   */
  async getByMethod(method: PaymentMethod): Promise<Payment[]> {
    const payments = await this.getAll();
    return payments.filter((payment) => payment.paymentMethod === method);
  }

  /**
   * Get payments by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    const payments = await this.getAll();
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }

  /**
   * Get a single payment by ID
   */
  async getById(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`${this.basePath}/${id}`);
  }

  /**
   * Create a new payment
   */
  async create(data: CreatePaymentDto): Promise<Payment> {
    return apiClient.post<Payment, CreatePaymentDto>(this.basePath, data);
  }

  /**
   * Update an existing payment
   */
  async update(id: string, data: UpdatePaymentDto): Promise<Payment> {
    return apiClient.patch<Payment, UpdatePaymentDto>(
      `${this.basePath}/${id}`,
      data
    );
  }

  /**
   * Delete a payment
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Calculate total revenue for a date range
   */
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const payments = startDate && endDate
      ? await this.getByDateRange(startDate, endDate)
      : await this.getAll();

    return payments
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  /**
   * Get pending payments total
   */
  async getPendingTotal(): Promise<number> {
    const pending = await this.getByStatus('PENDING');
    return pending.reduce((total, payment) => total + payment.amount, 0);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export default
export default paymentService;
