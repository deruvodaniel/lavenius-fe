import { usePaymentStore } from '../stores/payment.store';

/**
 * Custom hook para gestionar pagos
 * Simplifica el acceso al payment store en los componentes
 */
export const usePayments = () => {
  const {
    payments,
    selectedPayment,
    isLoading,
    error,
    fetchPaymentsByPatient,
    fetchPaymentsBySession,
    fetchAllPayments,
    createPayment,
    updatePayment,
    deletePayment,
    setSelectedPayment,
    clearPayments,
    clearError,
  } = usePaymentStore();

  return {
    payments,
    selectedPayment,
    isLoading,
    error,
    fetchPaymentsByPatient,
    fetchPaymentsBySession,
    fetchAllPayments,
    createPayment,
    updatePayment,
    deletePayment,
    setSelectedPayment,
    clearPayments,
    clearError,
  };
};
