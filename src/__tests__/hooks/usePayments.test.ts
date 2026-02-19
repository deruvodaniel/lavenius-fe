import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePayments } from '../../lib/hooks/usePayments';
import { usePaymentStore } from '../../lib/stores/payment.store';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '../../lib/types/api.types';
import { PaymentStatus } from '../../lib/types/api.types';

// Mock the payment store
vi.mock('../../lib/stores/payment.store', () => ({
  usePaymentStore: vi.fn(),
}));

describe('usePayments', () => {
  // Mock payment data
  const mockPayments: Payment[] = [
    {
      id: '1',
      sessionId: 'session-1',
      amount: 100,
      paymentDate: '2024-01-15',
      status: PaymentStatus.PAID,
      paidDate: '2024-01-15',
    },
    {
      id: '2',
      sessionId: 'session-2',
      amount: 150,
      paymentDate: '2024-01-16',
      status: PaymentStatus.PENDING,
    },
    {
      id: '3',
      sessionId: 'session-3',
      amount: 200,
      paymentDate: '2024-01-10',
      status: PaymentStatus.OVERDUE,
    },
    {
      id: '4',
      sessionId: 'session-4',
      amount: 120,
      paymentDate: '2024-01-17',
      status: PaymentStatus.PAID,
      paidDate: '2024-01-17',
    },
  ];

  const mockTotals = {
    totalAmount: 570,
    paidAmount: 220,
    pendingAmount: 150,
    overdueAmount: 200,
    totalCount: 4,
    paidCount: 2,
    pendingCount: 1,
    overdueCount: 1,
  };

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 4,
    totalPages: 1,
  };

  // Mock store functions
  const mockFetchPayments = vi.fn();
  const mockCreatePayment = vi.fn();
  const mockUpdatePayment = vi.fn();
  const mockMarkAsPaid = vi.fn();
  const mockDeletePayment = vi.fn();
  const mockReset = vi.fn();

  // Default mock store state
  const defaultMockState = {
    payments: mockPayments,
    totals: mockTotals,
    pagination: mockPagination,
    fetchStatus: 'success' as const,
    error: null as Error | null,
    fetchPayments: mockFetchPayments,
    createPayment: mockCreatePayment,
    updatePayment: mockUpdatePayment,
    markAsPaid: mockMarkAsPaid,
    deletePayment: mockDeletePayment,
    reset: mockReset,
  };

  // Helper to setup store mock
  const setupStoreMock = (overrides: Partial<typeof defaultMockState> = {}) => {
    const state = { ...defaultMockState, ...overrides };
    vi.mocked(usePaymentStore).mockReturnValue(state);
    return state;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Hook Return Values Tests ====================
  describe('Hook Return Values', () => {
    it('returns payments array from store', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.payments).toEqual(mockPayments);
      expect(result.current.payments).toHaveLength(4);
    });

    it('returns isLoading true when fetchStatus is loading', () => {
      setupStoreMock({ fetchStatus: 'loading' });

      const { result } = renderHook(() => usePayments());

      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading false when fetchStatus is not loading', () => {
      setupStoreMock({ fetchStatus: 'success' });

      const { result } = renderHook(() => usePayments());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns error null from store', () => {
      setupStoreMock({ error: null });

      const { result } = renderHook(() => usePayments());

      expect(result.current.error).toBeNull();
    });

    it('returns error from store', () => {
      const error = new Error('Failed to fetch payments');
      setupStoreMock({ error });

      const { result } = renderHook(() => usePayments());

      expect(result.current.error).toEqual(error);
    });

    it('returns totals from store', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.totals).toEqual(mockTotals);
    });

    it('returns pagination from store', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.pagination).toEqual(mockPagination);
    });

    it('returns empty payments array when store has empty array', () => {
      setupStoreMock({ payments: [] });

      const { result } = renderHook(() => usePayments());

      expect(result.current.payments).toEqual([]);
      expect(result.current.payments).toHaveLength(0);
    });

    it('handles non-array payments gracefully', () => {
      setupStoreMock({ payments: null as unknown as Payment[] });

      const { result } = renderHook(() => usePayments());

      expect(result.current.payments).toEqual([]);
    });
  });

  // ==================== Computed Values Tests ====================
  describe('Computed Values', () => {
    it('returns paidPayments filtered from payments', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.paidPayments).toHaveLength(2);
      expect(
        result.current.paidPayments.every((p) => p.status === PaymentStatus.PAID)
      ).toBe(true);
    });

    it('returns pendingPayments including PENDING and OVERDUE', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.pendingPayments).toHaveLength(2);
      expect(
        result.current.pendingPayments.every(
          (p) =>
            p.status === PaymentStatus.PENDING ||
            p.status === PaymentStatus.OVERDUE
        )
      ).toBe(true);
    });

    it('returns empty paidPayments when no paid payments exist', () => {
      setupStoreMock({
        payments: mockPayments.filter((p) => p.status !== PaymentStatus.PAID),
      });

      const { result } = renderHook(() => usePayments());

      expect(result.current.paidPayments).toHaveLength(0);
    });

    it('returns empty pendingPayments when no pending payments exist', () => {
      setupStoreMock({
        payments: mockPayments.filter((p) => p.status === PaymentStatus.PAID),
      });

      const { result } = renderHook(() => usePayments());

      expect(result.current.pendingPayments).toHaveLength(0);
    });

    it('returns empty computed arrays when payments is empty', () => {
      setupStoreMock({ payments: [] });

      const { result } = renderHook(() => usePayments());

      expect(result.current.paidPayments).toEqual([]);
      expect(result.current.pendingPayments).toEqual([]);
    });
  });

  // ==================== isSessionPaid Utility Tests ====================
  describe('isSessionPaid', () => {
    it('returns true when session has a paid payment', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.isSessionPaid('session-1')).toBe(true);
    });

    it('returns false when session has no paid payment', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.isSessionPaid('session-2')).toBe(false);
    });

    it('returns false for non-existent session', () => {
      const { result } = renderHook(() => usePayments());

      expect(result.current.isSessionPaid('non-existent')).toBe(false);
    });

    it('returns false when payments array is empty', () => {
      setupStoreMock({ payments: [] });

      const { result } = renderHook(() => usePayments());

      expect(result.current.isSessionPaid('session-1')).toBe(false);
    });

    it('handles null payments gracefully', () => {
      setupStoreMock({ payments: null as unknown as Payment[] });

      const { result } = renderHook(() => usePayments());

      expect(result.current.isSessionPaid('session-1')).toBe(false);
    });
  });

  // ==================== Action Functions Tests ====================
  describe('Action Functions', () => {
    describe('fetchPayments', () => {
      it('calls store fetchPayments action', async () => {
        mockFetchPayments.mockResolvedValue(undefined);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.fetchPayments();
        });

        expect(mockFetchPayments).toHaveBeenCalledTimes(1);
      });

      it('fetchPayments passes force parameter', async () => {
        mockFetchPayments.mockResolvedValue(undefined);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.fetchPayments(true);
        });

        expect(mockFetchPayments).toHaveBeenCalledWith(true);
      });

      it('fetchPayments passes filters parameter', async () => {
        const filters = { status: PaymentStatus.PAID };
        mockFetchPayments.mockResolvedValue(undefined);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.fetchPayments(false, filters);
        });

        expect(mockFetchPayments).toHaveBeenCalledWith(false, filters);
      });
    });

    describe('createPayment', () => {
      const newPaymentData: CreatePaymentDto = {
        sessionId: 'session-5',
        amount: 180,
        paymentDate: '2024-01-20',
        description: 'New payment',
      };

      const createdPayment: Payment = {
        id: '5',
        ...newPaymentData,
        status: PaymentStatus.PAID,
        paidDate: '2024-01-20',
      };

      it('createPayment calls store action with data', async () => {
        mockCreatePayment.mockResolvedValue(createdPayment);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.createPayment(newPaymentData);
        });

        expect(mockCreatePayment).toHaveBeenCalledWith(newPaymentData);
        expect(mockCreatePayment).toHaveBeenCalledTimes(1);
      });

      it('createPayment returns created payment from store', async () => {
        mockCreatePayment.mockResolvedValue(createdPayment);
        const { result } = renderHook(() => usePayments());

        let returnedPayment: Payment | undefined;
        await act(async () => {
          returnedPayment = await result.current.createPayment(newPaymentData);
        });

        expect(returnedPayment).toEqual(createdPayment);
      });

      it('createPayment propagates error from store', async () => {
        const error = new Error('Failed to create payment');
        mockCreatePayment.mockRejectedValue(error);
        const { result } = renderHook(() => usePayments());

        await expect(
          act(async () => {
            await result.current.createPayment(newPaymentData);
          })
        ).rejects.toThrow('Failed to create payment');
      });
    });

    describe('updatePayment', () => {
      const updateData: UpdatePaymentDto = {
        amount: 200,
        description: 'Updated payment',
      };

      const updatedPayment: Payment = {
        ...mockPayments[0],
        ...updateData,
      };

      it('updatePayment calls store action with id and data', async () => {
        mockUpdatePayment.mockResolvedValue(updatedPayment);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.updatePayment('1', updateData);
        });

        expect(mockUpdatePayment).toHaveBeenCalledWith('1', updateData);
        expect(mockUpdatePayment).toHaveBeenCalledTimes(1);
      });

      it('updatePayment returns updated payment from store', async () => {
        mockUpdatePayment.mockResolvedValue(updatedPayment);
        const { result } = renderHook(() => usePayments());

        let returnedPayment: Payment | undefined;
        await act(async () => {
          returnedPayment = await result.current.updatePayment('1', updateData);
        });

        expect(returnedPayment).toEqual(updatedPayment);
      });

      it('updatePayment propagates error from store', async () => {
        const error = new Error('Payment not found');
        mockUpdatePayment.mockRejectedValue(error);
        const { result } = renderHook(() => usePayments());

        await expect(
          act(async () => {
            await result.current.updatePayment('999', updateData);
          })
        ).rejects.toThrow('Payment not found');
      });
    });

    describe('markAsPaid', () => {
      it('markAsPaid calls store action with id', async () => {
        const updatedPayment: Payment = {
          ...mockPayments[1],
          status: PaymentStatus.PAID,
          paidDate: '2024-01-20',
        };
        mockMarkAsPaid.mockResolvedValue(updatedPayment);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.markAsPaid('2');
        });

        expect(mockMarkAsPaid).toHaveBeenCalledWith('2');
        expect(mockMarkAsPaid).toHaveBeenCalledTimes(1);
      });

      it('markAsPaid returns updated payment', async () => {
        const updatedPayment: Payment = {
          ...mockPayments[1],
          status: PaymentStatus.PAID,
          paidDate: '2024-01-20',
        };
        mockMarkAsPaid.mockResolvedValue(updatedPayment);
        const { result } = renderHook(() => usePayments());

        let returnedPayment: Payment | undefined;
        await act(async () => {
          returnedPayment = await result.current.markAsPaid('2');
        });

        expect(returnedPayment).toEqual(updatedPayment);
      });

      it('markAsPaid propagates error from store', async () => {
        const error = new Error('Failed to mark as paid');
        mockMarkAsPaid.mockRejectedValue(error);
        const { result } = renderHook(() => usePayments());

        await expect(
          act(async () => {
            await result.current.markAsPaid('999');
          })
        ).rejects.toThrow('Failed to mark as paid');
      });
    });

    describe('deletePayment', () => {
      it('deletePayment calls store action with id', async () => {
        mockDeletePayment.mockResolvedValue(undefined);
        const { result } = renderHook(() => usePayments());

        await act(async () => {
          await result.current.deletePayment('1');
        });

        expect(mockDeletePayment).toHaveBeenCalledWith('1');
        expect(mockDeletePayment).toHaveBeenCalledTimes(1);
      });

      it('deletePayment propagates error from store', async () => {
        const error = new Error('Failed to delete payment');
        mockDeletePayment.mockRejectedValue(error);
        const { result } = renderHook(() => usePayments());

        await expect(
          act(async () => {
            await result.current.deletePayment('999');
          })
        ).rejects.toThrow('Failed to delete payment');
      });
    });

    describe('reset', () => {
      it('reset calls store reset action', () => {
        const { result } = renderHook(() => usePayments());

        act(() => {
          result.current.reset();
        });

        expect(mockReset).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => usePayments());

      // State values
      expect(result.current).toHaveProperty('payments');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('paidPayments');
      expect(result.current).toHaveProperty('pendingPayments');
      expect(result.current).toHaveProperty('totals');
      expect(result.current).toHaveProperty('pagination');

      // Utilities
      expect(result.current).toHaveProperty('isSessionPaid');

      // Functions
      expect(result.current).toHaveProperty('fetchPayments');
      expect(result.current).toHaveProperty('createPayment');
      expect(result.current).toHaveProperty('updatePayment');
      expect(result.current).toHaveProperty('markAsPaid');
      expect(result.current).toHaveProperty('deletePayment');
      expect(result.current).toHaveProperty('reset');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => usePayments());

      expect(typeof result.current.fetchPayments).toBe('function');
      expect(typeof result.current.createPayment).toBe('function');
      expect(typeof result.current.updatePayment).toBe('function');
      expect(typeof result.current.markAsPaid).toBe('function');
      expect(typeof result.current.deletePayment).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.isSessionPaid).toBe('function');
    });
  });

  // ==================== Memoization Tests ====================
  describe('Memoization', () => {
    it('payments is memoized with same reference', () => {
      const { result, rerender } = renderHook(() => usePayments());

      const firstPayments = result.current.payments;
      rerender();
      const secondPayments = result.current.payments;

      expect(firstPayments).toEqual(secondPayments);
    });

    it('paidPayments is memoized with same reference', () => {
      const { result, rerender } = renderHook(() => usePayments());

      const firstPaidPayments = result.current.paidPayments;
      rerender();
      const secondPaidPayments = result.current.paidPayments;

      expect(firstPaidPayments).toEqual(secondPaidPayments);
    });

    it('pendingPayments is memoized with same reference', () => {
      const { result, rerender } = renderHook(() => usePayments());

      const firstPendingPayments = result.current.pendingPayments;
      rerender();
      const secondPendingPayments = result.current.pendingPayments;

      expect(firstPendingPayments).toEqual(secondPendingPayments);
    });
  });

  // ==================== Multiple Calls Tests ====================
  describe('Multiple Calls', () => {
    it('can call fetchPayments multiple times', async () => {
      mockFetchPayments.mockResolvedValue(undefined);
      const { result } = renderHook(() => usePayments());

      await act(async () => {
        await result.current.fetchPayments();
        await result.current.fetchPayments();
        await result.current.fetchPayments();
      });

      expect(mockFetchPayments).toHaveBeenCalledTimes(3);
    });

    it('can perform sequential payment operations', async () => {
      const newPayment: Payment = {
        id: '5',
        sessionId: 'session-5',
        amount: 180,
        paymentDate: '2024-01-20',
        status: PaymentStatus.PAID,
      };

      mockCreatePayment.mockResolvedValue(newPayment);
      mockUpdatePayment.mockResolvedValue({ ...newPayment, amount: 200 });
      mockDeletePayment.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        await result.current.createPayment({
          sessionId: 'session-5',
          amount: 180,
          paymentDate: '2024-01-20',
        });
        await result.current.updatePayment('5', { amount: 200 });
        await result.current.deletePayment('5');
      });

      expect(mockCreatePayment).toHaveBeenCalledTimes(1);
      expect(mockUpdatePayment).toHaveBeenCalledTimes(1);
      expect(mockDeletePayment).toHaveBeenCalledTimes(1);
    });
  });
});
