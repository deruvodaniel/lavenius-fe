import { create } from 'zustand';
import type {
  Payment,
  CreatePaymentDto,
  WeeklyPaymentStats,
} from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';
import { paymentService } from '@/lib/services/payment.service';

/**
 * Payment Store - Single Source of Truth
 * 
 * Data flow:
 * 1. fetchPayments() loads weeklyStats from /payments/weekly
 * 2. All derived data computed from weeklyStats.payments
 * 3. After mutations, we refresh to stay in sync with backend
 * 
 * Request deduplication:
 * - Uses fetchStatus to prevent concurrent duplicate requests
 * - lastFetchTime to enable smart refresh decisions
 */

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface PaymentState {
  weeklyStats: WeeklyPaymentStats | null;
  fetchStatus: FetchStatus;
  error: Error | null;
  lastFetchTime: number | null;
}

interface PaymentActions {
  fetchPayments: (force?: boolean) => Promise<void>;
  createPayment: (data: CreatePaymentDto) => Promise<Payment>;
  markAsPaid: (id: string) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  reset: () => void;
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

const initialState: PaymentState = {
  weeklyStats: null,
  fetchStatus: 'idle',
  error: null,
  lastFetchTime: null,
};

export const usePaymentStore = create<PaymentState & PaymentActions>((set, get) => ({
  ...initialState,

  fetchPayments: async (force = false) => {
    const { fetchStatus, lastFetchTime } = get();
    
    // Prevent duplicate concurrent requests
    if (fetchStatus === 'loading') {
      console.log('[PaymentStore] Skipping fetch - already loading');
      return;
    }
    
    // Use cache if valid and not forced
    if (!force && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      console.log('[PaymentStore] Using cached data');
      return;
    }

    set({ fetchStatus: 'loading', error: null });
    
    try {
      const weeklyStats = await paymentService.getWeeklyStats();
      console.log('[PaymentStore] Fetched weeklyStats:', weeklyStats);
      set({ 
        weeklyStats, 
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
    set({ fetchStatus: 'loading', error: null });
    try {
      const newPayment = await paymentService.create(data);
      console.log('[PaymentStore] Created payment:', newPayment);
      
      // Backend creates payments as 'pending', so we need to mark it as paid
      // This is the expected flow: create payment record, then mark as paid
      if (newPayment.id && newPayment.status !== PaymentStatus.PAID) {
        console.log('[PaymentStore] Marking payment as paid:', newPayment.id);
        await paymentService.markAsPaid(newPayment.id);
      }
      
      // Force refresh to get updated data from backend
      await get().fetchPayments(true);
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
      // Force refresh to get updated data from backend
      await get().fetchPayments(true);
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
      // Force refresh to get updated data from backend
      await get().fetchPayments(true);
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
    state.weeklyStats?.payments ?? [],
  
  getPaidPayments: (state: PaymentState): Payment[] =>
    state.weeklyStats?.payments?.filter(p => p.status === PaymentStatus.PAID) ?? [],
  
  getPendingPayments: (state: PaymentState): Payment[] =>
    state.weeklyStats?.payments?.filter(p => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    ) ?? [],
  
  getOverduePayments: (state: PaymentState): Payment[] =>
    state.weeklyStats?.payments?.filter(p => p.status === PaymentStatus.OVERDUE) ?? [],

  /** 
   * Check if a session has been paid
   * Looks for any payment linked to this session with status PAID
   */
  isSessionPaid: (state: PaymentState, sessionId: string): boolean =>
    state.weeklyStats?.payments?.some(
      p => p.sessionId === sessionId && p.status === PaymentStatus.PAID
    ) ?? false,

  /**
   * Get payment for a specific session
   */
  getPaymentBySessionId: (state: PaymentState, sessionId: string): Payment | undefined =>
    state.weeklyStats?.payments?.find(p => p.sessionId === sessionId),

  /**
   * Calculate totals from payments array (more accurate than backend totals)
   * Note: Backend may return amount as string, so we convert to number
   */
  calculateTotals: (state: PaymentState) => {
    const payments = state.weeklyStats?.payments ?? [];
    
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
