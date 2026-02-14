import { apiClient } from '../api/client';
import type {
  Payment,
  CreatePaymentDto,
  WeeklyPaymentStats,
} from '../types/api.types';

/**
 * Payment Service
 * 
 * Single endpoint strategy: /payments/weekly provides all needed data
 * - Weekly stats (totals)
 * - Payments array with patient info
 * 
 * This avoids multiple API calls and ensures data consistency
 */
class PaymentService {
  private readonly basePath = '/payments';

  /**
   * Get weekly payment data (stats + payments list)
   * This is the primary data source for the payments feature
   */
  async getWeeklyStats(): Promise<WeeklyPaymentStats> {
    return apiClient.get<WeeklyPaymentStats>(`${this.basePath}/weekly`);
  }

  /**
   * Create a new payment record
   */
  async create(data: CreatePaymentDto): Promise<Payment> {
    const payload: Record<string, unknown> = {
      sessionId: data.sessionId,
      amount: data.amount,
      // Backend expects ISO datetime format
      paymentDate: data.paymentDate.includes('T') 
        ? data.paymentDate 
        : `${data.paymentDate}T12:00:00.000Z`,
    };
    
    if (data.description) {
      payload.description = data.description;
    }
    
    return apiClient.post<Payment>(this.basePath, payload);
  }

  /**
   * Mark a payment as paid
   */
  async markAsPaid(id: string): Promise<Payment> {
    return apiClient.patch<Payment, Record<string, never>>(
      `${this.basePath}/${id}/pay`,
      {}
    );
  }

  /**
   * Delete a payment record
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const paymentService = new PaymentService();
