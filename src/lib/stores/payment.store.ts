import { create } from 'zustand';
import type {
  Payment,
  CreatePaymentDto,
} from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import { paymentService, type PaymentFilters } from '@/lib/services/payment.service';

/**
 * Payment Store - Single Source of Truth
 * 
 * Data flow:
 * 1. fetchPayments() loads payments from /payments with optional filters
 * 2. All derived data computed from payments array
 * 3. After mutations, we refresh to stay in sync with backend
 * 
 * Request deduplication:
 * - Uses fetchStatus to prevent concurrent duplicate requests
 * - lastFetchTime to enable smart refresh decisions
 */

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface PaymentState {
  payments: Payment[];
  fetchStatus: FetchStatus;
  error: Error | null;
  lastFetchTime: number | null;
  currentFilters: PaymentFilters | null;
}

interface PaymentActions {
  fetchPayments: (force?: boolean, filters?: PaymentFilters) => Promise<void>;
  createPayment: (data: CreatePaymentDto) => Promise<Payment>;
  markAsPaid: (id: string) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  reset: () => void;
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

const initialState: PaymentState = {
  payments: [],
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
      const payments = await paymentService.getAll(filters);
      set({ 
        payments, 
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
    state.payments ?? [],
  
  getPaidPayments: (state: PaymentState): Payment[] =>
    state.payments?.filter(p => p.status === PaymentStatus.PAID) ?? [],
  
  getPendingPayments: (state: PaymentState): Payment[] =>
    state.payments?.filter(p => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    ) ?? [],
  
  getOverduePayments: (state: PaymentState): Payment[] =>
    state.payments?.filter(p => p.status === PaymentStatus.OVERDUE) ?? [],

  /** 
   * Check if a session has been paid
   * Looks for any payment linked to this session with status PAID
   */
  isSessionPaid: (state: PaymentState, sessionId: string): boolean =>
    state.payments?.some(
      p => p.sessionId === sessionId && p.status === PaymentStatus.PAID
    ) ?? false,

  /**
   * Get payment for a specific session
   */
  getPaymentBySessionId: (state: PaymentState, sessionId: string): Payment | undefined =>
    state.payments?.find(p => p.sessionId === sessionId),

  /**
   * Calculate totals from payments array
   * Note: Backend may return amount as string, so we convert to number
   */
  calculateTotals: (state: PaymentState) => {
    const payments = state.payments ?? [];
    
    const paidPayments = payments.filter(p => p.status === PaymentStatus.PAID);
    const pendingPayments = payments.filter(p => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    );
    const overduePayments = payments.filter(p => p.status === PaymentStatus.OVERDUE);

    // Helper to safely sum amounts (handles string/number)
    const sumAmounts = (items: typeof payments) => 
      items.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalAmount: sumAmounts(payments),
      paidAmount: sumAmounts(paidPayments),
      pendingAmount: sumAmounts(pendingPayments),
      overdueAmount: sumAmounts(overduePayments),
      totalCount: payments.length,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
    };
  },
};
