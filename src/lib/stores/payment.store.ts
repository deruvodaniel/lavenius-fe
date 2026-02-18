import { create } from 'zustand';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import { paymentService, type PaymentFilters, type PaymentTotals, type PaginationInfo } from '@/lib/services/payment.service';

/**
 * Payment Store - Single Source of Truth
 * 
 * Data flow:
 * 1. fetchPayments() loads payments from /payments with optional filters
 * 2. Totals come from backend (totalAmount, paidAmount, pendingAmount, overdueAmount)
 * 3. Pagination info stored for UI controls
 * 4. After mutations, we refresh to stay in sync with backend
 * 
 * Request deduplication:
 * - Uses fetchStatus to prevent concurrent duplicate requests
 * - lastFetchTime to enable smart refresh decisions
 */

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface PaymentState {
  payments: Payment[];
  totals: PaymentTotals;
  pagination: PaginationInfo;
  fetchStatus: FetchStatus;
  error: Error | null;
  lastFetchTime: number | null;
  currentFilters: PaymentFilters | null;
}

interface PaymentActions {
  fetchPayments: (force?: boolean, filters?: PaymentFilters) => Promise<void>;
  createPayment: (data: CreatePaymentDto) => Promise<Payment>;
  updatePayment: (id: string, data: UpdatePaymentDto) => Promise<Payment>;
  markAsPaid: (id: string) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  reset: () => void;
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

const defaultTotals: PaymentTotals = {
  totalAmount: 0,
  paidAmount: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  totalCount: 0,
  paidCount: 0,
  pendingCount: 0,
  overdueCount: 0,
};

const defaultPagination: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const initialState: PaymentState = {
  payments: [],
  totals: defaultTotals,
  pagination: defaultPagination,
  fetchStatus: 'idle',
  error: null,
  lastFetchTime: null,
  currentFilters: null,
};

export const usePaymentStore = create<PaymentState & PaymentActions>((set, get) => ({
  ...initialState,

  fetchPayments: async (force = false, filters?: PaymentFilters) => {
    const { fetchStatus, lastFetchTime, currentFilters } = get();
    
    // Prevent duplicate concurrent requests
    if (fetchStatus === 'loading') {
      return;
    }
    
    // Check if filters changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(currentFilters);
    
    // Use cache if valid, not forced, and filters haven't changed
    if (!force && !filtersChanged && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      return;
    }

    set({ fetchStatus: 'loading', error: null, currentFilters: filters || null });
    
    try {
      const response = await paymentService.getAll(filters);
      
      set({ 
        payments: response.payments,
        totals: response.totals,
        pagination: response.pagination,
        fetchStatus: 'success',
        lastFetchTime: Date.now(),
      });
    } catch (error) {
      console.error('[PaymentStore] Fetch error:', error);
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch payments'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  createPayment: async (data: CreatePaymentDto) => {
    try {
      // Create payment directly as PAID with paidDate
      const paymentData: CreatePaymentDto = {
        ...data,
        status: PaymentStatus.PAID,
        paidDate: new Date().toISOString(),
      };
      
      const newPayment = await paymentService.create(paymentData);
      
      return newPayment;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to create payment'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  updatePayment: async (id: string, data: UpdatePaymentDto) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      const updatedPayment = await paymentService.update(id, data);
      
      // Update local state immediately
      const currentPayments = get().payments;
      set({ 
        payments: currentPayments.map(p => p.id === id ? updatedPayment : p),
        fetchStatus: 'success',
      });
      
      return updatedPayment;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to update payment'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  markAsPaid: async (id: string) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      const updatedPayment = await paymentService.markAsPaid(id);
      
      // Update local state immediately
      const currentPayments = get().payments;
      set({ 
        payments: currentPayments.map(p => p.id === id ? updatedPayment : p),
        fetchStatus: 'success',
      });
      
      return updatedPayment;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to mark payment as paid'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  deletePayment: async (id: string) => {
    set({ fetchStatus: 'loading', error: null });
    try {
      await paymentService.delete(id);
      
      // Update local state immediately
      const currentPayments = get().payments;
      set({ 
        payments: currentPayments.filter(p => p.id !== id),
        fetchStatus: 'success',
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to delete payment'),
        fetchStatus: 'error',
      });
      throw error;
    }
  },

  reset: () => set(initialState),
}));

// ============================================================================
// SELECTORS - Pure functions for derived data
// ============================================================================

export const paymentSelectors = {
  getPayments: (state: PaymentState): Payment[] => 
    Array.isArray(state.payments) ? state.payments : [],
  
  /** Get totals from server (more accurate than client-side calculation) */
  getTotals: (state: PaymentState): PaymentTotals => state.totals,
  
  /** Get pagination info */
  getPagination: (state: PaymentState): PaginationInfo => state.pagination,
  
  getPaidPayments: (state: PaymentState): Payment[] => {
    const payments = Array.isArray(state.payments) ? state.payments : [];
    return payments.filter(p => p.status === PaymentStatus.PAID);
  },
  
  getPendingPayments: (state: PaymentState): Payment[] => {
    const payments = Array.isArray(state.payments) ? state.payments : [];
    return payments.filter(p => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    );
  },
  
  getOverduePayments: (state: PaymentState): Payment[] => {
    const payments = Array.isArray(state.payments) ? state.payments : [];
    return payments.filter(p => p.status === PaymentStatus.OVERDUE);
  },

  /** 
   * Check if a session has been paid
   * Looks for any payment linked to this session with status PAID
   */
  isSessionPaid: (state: PaymentState, sessionId: string): boolean => {
    const payments = Array.isArray(state.payments) ? state.payments : [];
    return payments.some(
      p => p.sessionId === sessionId && p.status === PaymentStatus.PAID
    );
  },

  /**
   * Get payment for a specific session
   */
  getPaymentBySessionId: (state: PaymentState, sessionId: string): Payment | undefined => {
    const payments = Array.isArray(state.payments) ? state.payments : [];
    return payments.find(p => p.sessionId === sessionId);
  },
};
