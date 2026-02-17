import { useMemo, useCallback } from 'react';
import { usePaymentStore } from '../stores/payment.store';
import { PaymentStatus } from '../types/api.types';
import type { Payment } from '../types/api.types';

/**
 * usePayments Hook
 * 
 * Simple interface for payment data.
 * Store handles deduplication and caching.
 * Totals come from the server for accuracy across paginated data.
 */
export const usePayments = () => {
  const store = usePaymentStore();
  
  // Extract payments for dependency tracking - ensure it's always an array
  const paymentsArray = Array.isArray(store.payments) ? store.payments : [];
  
  // Memoized derived data - recalculates when payments array changes
  const payments = useMemo(
    () => paymentsArray,
    [paymentsArray]
  );
  
  const paidPayments = useMemo(
    () => paymentsArray.filter((p: Payment) => p.status === PaymentStatus.PAID),
    [paymentsArray]
  );
  
  const pendingPayments = useMemo(
    () => paymentsArray.filter((p: Payment) => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    ),
    [paymentsArray]
  );

  // Utility: check if session is paid
  // Uses useCallback with paymentsArray dependency so the function reference
  // changes when payments change, triggering re-renders in dependent useMemos
  const isSessionPaid = useCallback(
    (sessionId: string): boolean => {
      return paymentsArray.some(
        (p: Payment) => p.sessionId === sessionId && p.status === PaymentStatus.PAID
      );
    },
    [paymentsArray]
  );

  return {
    // State
    payments,
    isLoading: store.fetchStatus === 'loading',
    error: store.error,
    
    // Derived data (from current page)
    paidPayments,
    pendingPayments,
    
    // Server totals (accurate across all pages)
    totals: store.totals,
    
    // Pagination info
    pagination: store.pagination,
    
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
