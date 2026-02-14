import { useMemo } from 'react';
import { usePaymentStore, paymentSelectors } from '../stores/payment.store';

/**
 * usePayments Hook
 * 
 * Simple interface for payment data.
 * Store handles deduplication and caching.
 */
export const usePayments = () => {
  const store = usePaymentStore();
  
  // Memoized derived data - recalculates when weeklyStats changes
  const payments = useMemo(
    () => paymentSelectors.getPayments(store),
    [store.weeklyStats]
  );
  
  const paidPayments = useMemo(
    () => paymentSelectors.getPaidPayments(store),
    [store.weeklyStats]
  );
  
  const pendingPayments = useMemo(
    () => paymentSelectors.getPendingPayments(store),
    [store.weeklyStats]
  );

  // Calculated totals with safe defaults
  const totals = useMemo(() => {
    if (!store.weeklyStats?.payments) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalCount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      };
    }
    return paymentSelectors.calculateTotals(store);
  }, [store.weeklyStats]);

  // Utility: check if session is paid
  // Note: needs fresh store reference each call
  const isSessionPaid = (sessionId: string): boolean => 
    paymentSelectors.isSessionPaid(usePaymentStore.getState(), sessionId);

  return {
    // State
    weeklyStats: store.weeklyStats,
    isLoading: store.fetchStatus === 'loading',
    error: store.error,
    
    // Derived data
    payments,
    paidPayments,
    pendingPayments,
    
    // Calculated totals (never null)
    totals,
    
    // Utilities
    isSessionPaid,
    
    // Actions (direct from store - already stable)
    fetchPayments: store.fetchPayments,
    createPayment: store.createPayment,
    markAsPaid: store.markAsPaid,
    deletePayment: store.deletePayment,
    reset: store.reset,
  };
};
