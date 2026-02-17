import { apiClient } from '../api/client';
import type {
  Payment,
  CreatePaymentDto,
} from '../types/api.types';

/**
 * Payment filter options for server-side filtering
 */
export interface PaymentFilters {
  from?: string;  // ISO date string (YYYY-MM-DD)
  to?: string;    // ISO date string (YYYY-MM-DD)
  search?: string; // Search by patient name
}

/**
 * Payment response with totals from backend
 */
export interface PaymentResponse {
  payments: Payment[];
  totals: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    totalCount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

/**
 * Payment Service
 * 
 * Uses /payments endpoint with optional filters:
 * - from/to: Filter by date range (affects list and totals)
 * - search: Filter by patient name (only affects list, not totals)
 */
class PaymentService {
  private readonly basePath = '/payments';

  /**
   * Get all payments for the therapist with optional filters
   * 
   * @param filters - Optional filters
   * @param filters.from - Start date (YYYY-MM-DD), defaults to current week start
   * @param filters.to - End date (YYYY-MM-DD), defaults to current week end
   * @param filters.search - Filter by patient name (only affects list)
   */
  async getAll(filters?: PaymentFilters): Promise<Payment[]> {
    const params = new URLSearchParams();
    
    if (filters?.from) {
      params.append('from', filters.from);
    }
    if (filters?.to) {
      params.append('to', filters.to);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    return apiClient.get<Payment[]>(url);
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

    if (data.status) {
      payload.status = data.status;
    }

    if (data.paidDate) {
      payload.paidDate = data.paidDate;
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
