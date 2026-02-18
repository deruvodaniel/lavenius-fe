import { apiClient } from '../api/client';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../types/api.types';

/**
 * Payment filter options for server-side filtering
 */
export interface PaymentFilters {
  from?: string;  // ISO date string (YYYY-MM-DD)
  to?: string;    // ISO date string (YYYY-MM-DD)
  search?: string; // Search by patient name
  page?: number;   // Page number (1-indexed)
  limit?: number;  // Items per page
}

/**
 * Pagination info from backend
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Totals calculated from payments
 */
export interface PaymentTotals {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

/**
 * Backend response structure for /payments endpoint
 * Returns: { payments: { data: Payment[], pagination: {...} }, total, totalPaid, totalPending, totalOverdue }
 */
export interface BackendPaymentResponse {
  payments: {
    data: Payment[];
    pagination: PaginationInfo;
  };
  total: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

/**
 * Normalized response from getAll - includes payments, pagination and totals
 */
export interface NormalizedPaymentResponse {
  payments: Payment[];
  pagination: PaginationInfo;
  totals: PaymentTotals;
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
   * @param filters.page - Page number (1-indexed)
   * @param filters.limit - Items per page
   * @returns Normalized response with payments, pagination and totals
   */
  async getAll(filters?: PaymentFilters): Promise<NormalizedPaymentResponse> {
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
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    const response = await apiClient.get<BackendPaymentResponse>(url);
    
    // Normalize the response - backend returns { payments: { data, pagination }, total, ... }
    const paymentsData = response.payments?.data || [];
    const paginationData = response.payments?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
    
    return {
      payments: paymentsData,
      pagination: paginationData,
      totals: {
        totalAmount: response.total || 0,
        paidAmount: response.totalPaid || 0,
        pendingAmount: response.totalPending || 0,
        overdueAmount: response.totalOverdue || 0,
        // Calculate counts from pagination
        totalCount: paginationData.total || 0,
        paidCount: 0, // Backend doesn't provide counts, will calculate from payments if needed
        pendingCount: 0,
        overdueCount: 0,
      },
    };
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
   * Update an existing payment
   * NOTE: Backend endpoint not yet implemented - will throw error
   * TODO: Remove this error once backend implements PATCH /payments/:id
   */
  async update(id: string, data: UpdatePaymentDto): Promise<Payment> {
    // Backend doesn't have this endpoint yet
    // When implemented, uncomment the following:
    // return apiClient.patch<Payment, UpdatePaymentDto>(`${this.basePath}/${id}`, data);
    
    console.warn('[PaymentService] Update endpoint not yet implemented in backend', { id, data });
    throw new Error('La edición de pagos estará disponible próximamente');
  }

  /**
   * Delete a payment record
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const paymentService = new PaymentService();
