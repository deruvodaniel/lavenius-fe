import { useMemo } from 'react';
import { usePaymentStore } from '../stores/payment.store';
import { PaymentStatus } from '../types/api.types';
import type { Payment } from '../types/api.types';

/**
 * usePayments Hook
 * 
 * Simple interface for payment data.
 * Store handles deduplication and caching.
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

  // Calculated totals with safe defaults
  const totals = useMemo(() => {
    if (paymentsArray.length === 0) {
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
    
    const paid = paymentsArray.filter((p: Payment) => p.status === PaymentStatus.PAID);
    const pending = paymentsArray.filter((p: Payment) => 
      p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
    );
    const overdue = paymentsArray.filter((p: Payment) => p.status === PaymentStatus.OVERDUE);

    // Helper to safely sum amounts (handles string/number)
    const sumAmounts = (items: Payment[]) => 
      items.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalAmount: sumAmounts(paymentsArray),
      paidAmount: sumAmounts(paid),
      pendingAmount: sumAmounts(pending),
      overdueAmount: sumAmounts(overdue),
      totalCount: paymentsArray.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    };
  }, [paymentsArray]);

  // Utility: check if session is paid
  // Note: needs fresh store reference each call
  const isSessionPaid = (sessionId: string): boolean => {
    const currentPayments = usePaymentStore.getState().payments;
    const paymentsArr = Array.isArray(currentPayments) ? currentPayments : [];
    return paymentsArr.some(
      (p: Payment) => p.sessionId === sessionId && p.status === PaymentStatus.PAID
    );
  };

  return {
    // State
    payments,
    isLoading: store.fetchStatus === 'loading',
    error: store.error,
    
    // Derived data
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
