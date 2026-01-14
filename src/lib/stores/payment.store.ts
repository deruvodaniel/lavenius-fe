import { create } from 'zustand';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '@/lib/types/api.types';
import { paymentService } from '@/lib/services/payment.service';

interface PaymentStore {
  payments: Payment[];
  selectedPayment: Payment | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchPaymentsByPatient: (patientId: string) => Promise<void>;
  fetchPaymentsBySession: (sessionId: string) => Promise<void>;
  fetchAllPayments: () => Promise<void>;
  createPayment: (data: CreatePaymentDto) => Promise<Payment>;
  updatePayment: (id: string, data: UpdatePaymentDto) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  setSelectedPayment: (payment: Payment | null) => void;
  clearPayments: () => void;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],
  selectedPayment: null,
  isLoading: false,
  error: null,

  fetchPaymentsByPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const payments = await paymentService.getByPatientId(patientId);
      set({ payments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch payments'),
        isLoading: false,
      });
    }
  },

  fetchPaymentsBySession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const payments = await paymentService.getBySessionId(sessionId);
      set({ payments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch payments'),
        isLoading: false,
      });
    }
  },

  fetchAllPayments: async () => {
    set({ isLoading: true, error: null });
    try {
      const payments = await paymentService.getAll();
      set({ payments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch payments'),
        isLoading: false,
      });
    }
  },

  createPayment: async (data: CreatePaymentDto) => {
    set({ isLoading: true, error: null });
    try {
      const newPayment = await paymentService.create(data);
      set((state) => ({
        payments: [newPayment, ...state.payments],
        isLoading: false,
      }));
      return newPayment;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to create payment'),
        isLoading: false,
      });
      throw error;
    }
  },

  updatePayment: async (id: string, data: UpdatePaymentDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPayment = await paymentService.update(id, data);
      set((state) => ({
        payments: state.payments.map((payment) =>
          payment.id === id ? updatedPayment : payment
        ),
        selectedPayment:
          state.selectedPayment?.id === id ? updatedPayment : state.selectedPayment,
        isLoading: false,
      }));
      return updatedPayment;
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to update payment'),
        isLoading: false,
      });
      throw error;
    }
  },

  deletePayment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await paymentService.delete(id);
      set((state) => ({
        payments: state.payments.filter((payment) => payment.id !== id),
        selectedPayment: state.selectedPayment?.id === id ? null : state.selectedPayment,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Failed to delete payment'),
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedPayment: (payment: Payment | null) => {
    set({ selectedPayment: payment });
  },

  clearPayments: () => {
    set({ payments: [], selectedPayment: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
