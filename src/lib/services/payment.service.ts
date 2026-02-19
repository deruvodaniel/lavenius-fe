import { apiClient } from '../api/client';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../types/api.types';
import { PaymentStatus } from '../types/api.types';

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
    // Build query params for backend filters
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
    
    const response = await apiClient.get<Payment[] | BackendPaymentResponse>(url);
    
    // Handle both array response (current backend) and object response (future)
    let paymentsData: Payment[];
    
    if (Array.isArray(response)) {
      // Backend returns array directly
      paymentsData = response;
    } else if (response.payments?.data) {
      // Backend returns paginated object
      paymentsData = response.payments.data;
    } else {
      paymentsData = [];
    }
    
    // Calculate totals from the data using PaymentStatus enum
    const paidPayments = paymentsData.filter(p => p.status === PaymentStatus.PAID);
    const pendingPayments = paymentsData.filter(p => p.status === PaymentStatus.PENDING);
    const overduePayments = paymentsData.filter(p => p.status === PaymentStatus.OVERDUE);
    
    return {
      payments: paymentsData,
      pagination: {
        page: 1,
        limit: paymentsData.length,
        total: paymentsData.length,
        totalPages: 1,
      },
      totals: {
        totalAmount: paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        paidAmount: paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        pendingAmount: pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        overdueAmount: overduePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        totalCount: paymentsData.length,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
        overdueCount: overduePayments.length,
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
   */
  async update(id: string, data: UpdatePaymentDto): Promise<Payment> {
    return apiClient.patch<Payment, UpdatePaymentDto>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a payment record
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const paymentService = new PaymentService();
