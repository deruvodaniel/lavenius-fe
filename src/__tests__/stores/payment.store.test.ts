import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { usePaymentStore, paymentSelectors } from '../../lib/stores/payment.store';
import { paymentService } from '../../lib/services/payment.service';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../../lib/types/api.types';
import { PaymentStatus } from '../../lib/types/api.types';
import type {
  PaymentFilters,
  PaymentTotals,
  PaginationInfo,
  NormalizedPaymentResponse,
} from '../../lib/services/payment.service';

// Mock the payment service
vi.mock('../../lib/services/payment.service', () => ({
  paymentService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsPaid: vi.fn(),
  },
}));

describe('usePaymentStore', () => {
  // Mock payment data
  const mockPayments: Payment[] = [
    {
      id: '1',
      sessionId: 'session-1',
      amount: 5000,
      paymentDate: '2024-01-15',
      status: PaymentStatus.PAID,
      paidDate: '2024-01-15',
      patient: {
        id: 'p1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@test.com',
      },
    },
    {
      id: '2',
      sessionId: 'session-2',
      amount: 3000,
      paymentDate: '2024-01-10',
      status: PaymentStatus.PENDING,
      patient: {
        id: 'p2',
        firstName: 'María',
        lastName: 'García',
        email: 'maria@test.com',
      },
    },
    {
      id: '3',
      sessionId: 'session-3',
      amount: 4000,
      paymentDate: '2024-01-05',
      status: PaymentStatus.OVERDUE,
      dueDate: '2024-01-01',
      patient: {
        id: 'p3',
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos@test.com',
      },
    },
  ];

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

  const initialState = {
    payments: [],
    totals: defaultTotals,
    pagination: defaultPagination,
    fetchStatus: 'idle' as const,
    error: null,
    lastFetchTime: null,
    currentFilters: null,
  };

  const mockNormalizedResponse: NormalizedPaymentResponse = {
    payments: mockPayments,
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
    },
    totals: {
      totalAmount: 12000,
      paidAmount: 5000,
      pendingAmount: 3000,
      overdueAmount: 4000,
      totalCount: 3,
      paidCount: 1,
      pendingCount: 1,
      overdueCount: 1,
    },
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    usePaymentStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('should have empty payments array by default', () => {
      const { payments } = usePaymentStore.getState();
      expect(payments).toEqual([]);
    });

    it('should have default totals by default', () => {
      const { totals } = usePaymentStore.getState();
      expect(totals).toEqual(defaultTotals);
    });

    it('should have default pagination by default', () => {
      const { pagination } = usePaymentStore.getState();
      expect(pagination).toEqual(defaultPagination);
    });

    it('should have fetchStatus "idle" by default', () => {
      const { fetchStatus } = usePaymentStore.getState();
      expect(fetchStatus).toBe('idle');
    });

    it('should have null error by default', () => {
      const { error } = usePaymentStore.getState();
      expect(error).toBeNull();
    });

    it('should have null lastFetchTime by default', () => {
      const { lastFetchTime } = usePaymentStore.getState();
      expect(lastFetchTime).toBeNull();
    });

    it('should have null currentFilters by default', () => {
      const { currentFilters } = usePaymentStore.getState();
      expect(currentFilters).toBeNull();
    });
  });

  // ==================== fetchPayments Tests ====================
  describe('fetchPayments', () => {
    it('should call paymentService.getAll', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(paymentService.getAll).toHaveBeenCalledTimes(1);
      expect(paymentService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('should call paymentService.getAll with filters', async () => {
      const filters: PaymentFilters = {
        from: '2024-01-01',
        to: '2024-01-31',
        search: 'Juan',
        page: 1,
        limit: 20,
      };
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments(false, filters);
      });

      expect(paymentService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should set fetchStatus to "loading" during request', async () => {
      let statusDuringRequest: string | undefined;

      vi.mocked(paymentService.getAll).mockImplementation(async () => {
        statusDuringRequest = usePaymentStore.getState().fetchStatus;
        return mockNormalizedResponse;
      });

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(statusDuringRequest).toBe('loading');
    });

    it('should set fetchStatus to "success" after successful request', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().fetchStatus).toBe('success');
    });

    it('should populate payments array on success', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().payments).toEqual(mockPayments);
      expect(usePaymentStore.getState().payments).toHaveLength(3);
    });

    it('should populate totals on success', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().totals).toEqual(mockNormalizedResponse.totals);
    });

    it('should populate pagination on success', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().pagination).toEqual(mockNormalizedResponse.pagination);
    });

    it('should set lastFetchTime on success', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);
      const beforeFetch = Date.now();

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      const { lastFetchTime } = usePaymentStore.getState();
      expect(lastFetchTime).toBeGreaterThanOrEqual(beforeFetch);
      expect(lastFetchTime).toBeLessThanOrEqual(Date.now());
    });

    it('should clear error on successful request', async () => {
      // First set an error
      usePaymentStore.setState({ error: new Error('Previous error') });
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().error).toBeNull();
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Error al cargar pagos';
      vi.mocked(paymentService.getAll).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePaymentStore.getState().fetchPayments();
        } catch {
          // Expected to throw
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe(errorMessage);
      expect(usePaymentStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on failure', async () => {
      vi.mocked(paymentService.getAll).mockRejectedValue(new Error('Network error'));

      await expect(usePaymentStore.getState().fetchPayments()).rejects.toThrow('Network error');
    });

    it('should store currentFilters when provided', async () => {
      const filters: PaymentFilters = { from: '2024-01-01', to: '2024-01-31' };
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments(false, filters);
      });

      expect(usePaymentStore.getState().currentFilters).toEqual(filters);
    });

    // ==================== Cache and Deduplication Tests ====================
    describe('Cache and Deduplication', () => {
      it('should prevent duplicate concurrent requests', async () => {
        vi.mocked(paymentService.getAll).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockNormalizedResponse), 100))
        );

        // Set state to loading to simulate in-flight request
        usePaymentStore.setState({ fetchStatus: 'loading' });

        await act(async () => {
          await usePaymentStore.getState().fetchPayments();
        });

        // Should not call service because already loading
        expect(paymentService.getAll).not.toHaveBeenCalled();
      });

      it('should use cache when not forced and within cache duration', async () => {
        const filters: PaymentFilters = { from: '2024-01-01', to: '2024-01-31' };
        vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

        // First fetch with specific filters
        await act(async () => {
          await usePaymentStore.getState().fetchPayments(false, filters);
        });

        // Second fetch with same filters - should use cache
        await act(async () => {
          await usePaymentStore.getState().fetchPayments(false, filters);
        });

        // Should only call once because cache is valid and filters are the same
        expect(paymentService.getAll).toHaveBeenCalledTimes(1);
      });

      it('should bypass cache when force is true', async () => {
        vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

        // First fetch
        await act(async () => {
          await usePaymentStore.getState().fetchPayments();
        });

        // Second fetch with force - should fetch again
        await act(async () => {
          await usePaymentStore.getState().fetchPayments(true);
        });

        expect(paymentService.getAll).toHaveBeenCalledTimes(2);
      });

      it('should refetch when filters change', async () => {
        vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

        const filters1: PaymentFilters = { from: '2024-01-01' };
        const filters2: PaymentFilters = { from: '2024-02-01' };

        // First fetch with filters1
        await act(async () => {
          await usePaymentStore.getState().fetchPayments(false, filters1);
        });

        // Second fetch with different filters - should fetch again
        await act(async () => {
          await usePaymentStore.getState().fetchPayments(false, filters2);
        });

        expect(paymentService.getAll).toHaveBeenCalledTimes(2);
        expect(paymentService.getAll).toHaveBeenLastCalledWith(filters2);
      });
    });

    // ==================== Pagination Tests ====================
    describe('Pagination', () => {
      it('should pass page parameter to service', async () => {
        const filters: PaymentFilters = { page: 2, limit: 10 };
        vi.mocked(paymentService.getAll).mockResolvedValue({
          ...mockNormalizedResponse,
          pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
        });

        await act(async () => {
          await usePaymentStore.getState().fetchPayments(true, filters);
        });

        expect(paymentService.getAll).toHaveBeenCalledWith(filters);
      });

      it('should store pagination info correctly', async () => {
        const paginatedResponse: NormalizedPaymentResponse = {
          payments: [mockPayments[0]],
          pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
          totals: mockNormalizedResponse.totals,
        };
        vi.mocked(paymentService.getAll).mockResolvedValue(paginatedResponse);

        await act(async () => {
          await usePaymentStore.getState().fetchPayments(true, { page: 2, limit: 10 });
        });

        const { pagination } = usePaymentStore.getState();
        expect(pagination.page).toBe(2);
        expect(pagination.limit).toBe(10);
        expect(pagination.total).toBe(25);
        expect(pagination.totalPages).toBe(3);
      });
    });
  });

  // ==================== createPayment Tests ====================
  describe('createPayment', () => {
    const newPaymentData: CreatePaymentDto = {
      sessionId: 'session-4',
      amount: 6000,
      paymentDate: '2024-01-20',
      description: 'Sesión de terapia',
    };

    const createdPayment: Payment = {
      id: '4',
      sessionId: 'session-4',
      amount: 6000,
      paymentDate: '2024-01-20',
      status: PaymentStatus.PAID,
      paidDate: '2024-01-20',
      description: 'Sesión de terapia',
    };

    it('should call paymentService.create with correct data and PAID status', async () => {
      vi.mocked(paymentService.create).mockResolvedValue(createdPayment);

      await act(async () => {
        await usePaymentStore.getState().createPayment(newPaymentData);
      });

      expect(paymentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newPaymentData,
          status: PaymentStatus.PAID,
          paidDate: expect.any(String),
        })
      );
    });

    it('should return created payment', async () => {
      vi.mocked(paymentService.create).mockResolvedValue(createdPayment);

      let result: Payment | undefined;
      await act(async () => {
        result = await usePaymentStore.getState().createPayment(newPaymentData);
      });

      expect(result).toEqual(createdPayment);
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Failed to create payment';
      vi.mocked(paymentService.create).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePaymentStore.getState().createPayment(newPaymentData);
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe(errorMessage);
      expect(usePaymentStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on failure', async () => {
      vi.mocked(paymentService.create).mockRejectedValue(new Error('Create failed'));

      await expect(
        usePaymentStore.getState().createPayment(newPaymentData)
      ).rejects.toThrow('Create failed');
    });

    it('should set paidDate automatically as ISO string', async () => {
      vi.mocked(paymentService.create).mockResolvedValue(createdPayment);

      await act(async () => {
        await usePaymentStore.getState().createPayment(newPaymentData);
      });

      const calledWith = vi.mocked(paymentService.create).mock.calls[0][0];
      expect(calledWith.paidDate).toBeDefined();
      // Should be a valid ISO string
      expect(new Date(calledWith.paidDate!).toISOString()).toBe(calledWith.paidDate);
    });
  });

  // ==================== updatePayment Tests ====================
  describe('updatePayment', () => {
    const updateData: UpdatePaymentDto = {
      amount: 5500,
      description: 'Updated description',
    };

    const updatedPayment: Payment = {
      ...mockPayments[0],
      amount: 5500,
      description: 'Updated description',
    };

    it('should call paymentService.update with correct id and data', async () => {
      vi.mocked(paymentService.update).mockResolvedValue(updatedPayment);

      await act(async () => {
        await usePaymentStore.getState().updatePayment('1', updateData);
      });

      expect(paymentService.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should update payment in payments list', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.update).mockResolvedValue(updatedPayment);

      await act(async () => {
        await usePaymentStore.getState().updatePayment('1', updateData);
      });

      const { payments } = usePaymentStore.getState();
      const payment = payments.find((p) => p.id === '1');
      expect(payment?.amount).toBe(5500);
      expect(payment?.description).toBe('Updated description');
    });

    it('should return updated payment', async () => {
      vi.mocked(paymentService.update).mockResolvedValue(updatedPayment);

      let result: Payment | undefined;
      await act(async () => {
        result = await usePaymentStore.getState().updatePayment('1', updateData);
      });

      expect(result).toEqual(updatedPayment);
    });

    it('should set fetchStatus to "loading" during request', async () => {
      let statusDuringRequest: string | undefined;

      vi.mocked(paymentService.update).mockImplementation(async () => {
        statusDuringRequest = usePaymentStore.getState().fetchStatus;
        return updatedPayment;
      });

      await act(async () => {
        await usePaymentStore.getState().updatePayment('1', updateData);
      });

      expect(statusDuringRequest).toBe('loading');
      expect(usePaymentStore.getState().fetchStatus).toBe('success');
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Failed to update payment';
      vi.mocked(paymentService.update).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePaymentStore.getState().updatePayment('1', updateData);
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe(errorMessage);
      expect(usePaymentStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on failure', async () => {
      vi.mocked(paymentService.update).mockRejectedValue(new Error('Update failed'));

      await expect(
        usePaymentStore.getState().updatePayment('1', updateData)
      ).rejects.toThrow('Update failed');
    });

    it('should not modify other payments in the list', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.update).mockResolvedValue(updatedPayment);

      await act(async () => {
        await usePaymentStore.getState().updatePayment('1', updateData);
      });

      const { payments } = usePaymentStore.getState();
      expect(payments.find((p) => p.id === '2')).toEqual(mockPayments[1]);
      expect(payments.find((p) => p.id === '3')).toEqual(mockPayments[2]);
    });
  });

  // ==================== deletePayment Tests ====================
  describe('deletePayment', () => {
    it('should call paymentService.delete with correct id', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await usePaymentStore.getState().deletePayment('1');
      });

      expect(paymentService.delete).toHaveBeenCalledWith('1');
    });

    it('should remove payment from payments list', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await usePaymentStore.getState().deletePayment('1');
      });

      const { payments } = usePaymentStore.getState();
      expect(payments.find((p) => p.id === '1')).toBeUndefined();
      expect(payments).toHaveLength(2);
    });

    it('should set fetchStatus to "loading" during request', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      let statusDuringRequest: string | undefined;

      vi.mocked(paymentService.delete).mockImplementation(async () => {
        statusDuringRequest = usePaymentStore.getState().fetchStatus;
        return undefined;
      });

      await act(async () => {
        await usePaymentStore.getState().deletePayment('1');
      });

      expect(statusDuringRequest).toBe('loading');
      expect(usePaymentStore.getState().fetchStatus).toBe('success');
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Failed to delete payment';
      vi.mocked(paymentService.delete).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePaymentStore.getState().deletePayment('1');
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe(errorMessage);
      expect(usePaymentStore.getState().fetchStatus).toBe('error');
    });

    it('should throw error on failure', async () => {
      vi.mocked(paymentService.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(
        usePaymentStore.getState().deletePayment('1')
      ).rejects.toThrow('Delete failed');
    });

    it('should not affect other payments in the list', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await usePaymentStore.getState().deletePayment('1');
      });

      const { payments } = usePaymentStore.getState();
      expect(payments.find((p) => p.id === '2')).toEqual(mockPayments[1]);
      expect(payments.find((p) => p.id === '3')).toEqual(mockPayments[2]);
    });
  });

  // ==================== markAsPaid Tests ====================
  describe('markAsPaid', () => {
    const paidPayment: Payment = {
      ...mockPayments[1], // Originally PENDING
      status: PaymentStatus.PAID,
      paidDate: '2024-01-20',
    };

    it('should call paymentService.markAsPaid with correct id', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.markAsPaid).mockResolvedValue(paidPayment);

      await act(async () => {
        await usePaymentStore.getState().markAsPaid('2');
      });

      expect(paymentService.markAsPaid).toHaveBeenCalledWith('2');
    });

    it('should update payment status to PAID in payments list', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.markAsPaid).mockResolvedValue(paidPayment);

      await act(async () => {
        await usePaymentStore.getState().markAsPaid('2');
      });

      const { payments } = usePaymentStore.getState();
      const payment = payments.find((p) => p.id === '2');
      expect(payment?.status).toBe(PaymentStatus.PAID);
      expect(payment?.paidDate).toBe('2024-01-20');
    });

    it('should return updated payment', async () => {
      vi.mocked(paymentService.markAsPaid).mockResolvedValue(paidPayment);

      let result: Payment | undefined;
      await act(async () => {
        result = await usePaymentStore.getState().markAsPaid('2');
      });

      expect(result).toEqual(paidPayment);
    });

    it('should set fetchStatus to "loading" during request', async () => {
      let statusDuringRequest: string | undefined;

      vi.mocked(paymentService.markAsPaid).mockImplementation(async () => {
        statusDuringRequest = usePaymentStore.getState().fetchStatus;
        return paidPayment;
      });

      await act(async () => {
        await usePaymentStore.getState().markAsPaid('2');
      });

      expect(statusDuringRequest).toBe('loading');
      expect(usePaymentStore.getState().fetchStatus).toBe('success');
    });

    it('should set error on failure', async () => {
      const errorMessage = 'Failed to mark payment as paid';
      vi.mocked(paymentService.markAsPaid).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await usePaymentStore.getState().markAsPaid('2');
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe(errorMessage);
      expect(usePaymentStore.getState().fetchStatus).toBe('error');
    });

    it('should work with OVERDUE payment', async () => {
      const overdueTopaId: Payment = {
        ...mockPayments[2], // Originally OVERDUE
        status: PaymentStatus.PAID,
        paidDate: '2024-01-20',
      };
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.markAsPaid).mockResolvedValue(overdueTopaId);

      await act(async () => {
        await usePaymentStore.getState().markAsPaid('3');
      });

      const { payments } = usePaymentStore.getState();
      const payment = payments.find((p) => p.id === '3');
      expect(payment?.status).toBe(PaymentStatus.PAID);
    });
  });

  // ==================== reset Tests ====================
  describe('reset', () => {
    it('should reset store to initial state', () => {
      // Set some state
      usePaymentStore.setState({
        payments: mockPayments,
        totals: mockNormalizedResponse.totals,
        pagination: mockNormalizedResponse.pagination,
        fetchStatus: 'success',
        error: new Error('Some error'),
        lastFetchTime: Date.now(),
        currentFilters: { from: '2024-01-01' },
      });

      // Reset
      usePaymentStore.getState().reset();

      // Verify initial state
      const state = usePaymentStore.getState();
      expect(state.payments).toEqual([]);
      expect(state.totals).toEqual(defaultTotals);
      expect(state.pagination).toEqual(defaultPagination);
      expect(state.fetchStatus).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.lastFetchTime).toBeNull();
      expect(state.currentFilters).toBeNull();
    });
  });

  // ==================== Selectors Tests ====================
  describe('Selectors', () => {
    beforeEach(() => {
      usePaymentStore.setState({
        payments: mockPayments,
        totals: mockNormalizedResponse.totals,
        pagination: mockNormalizedResponse.pagination,
        fetchStatus: 'success',
        error: null,
        lastFetchTime: Date.now(),
        currentFilters: null,
      });
    });

    describe('getPayments', () => {
      it('should return payments array', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPayments(state)).toEqual(mockPayments);
      });

      it('should return empty array when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPayments(state)).toEqual([]);
      });
    });

    describe('getTotals', () => {
      it('should return totals object', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getTotals(state)).toEqual(mockNormalizedResponse.totals);
      });
    });

    describe('getPagination', () => {
      it('should return pagination object', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPagination(state)).toEqual(mockNormalizedResponse.pagination);
      });
    });

    describe('getPaidPayments', () => {
      it('should return only paid payments', () => {
        const state = usePaymentStore.getState();
        const paidPayments = paymentSelectors.getPaidPayments(state);

        expect(paidPayments).toHaveLength(1);
        expect(paidPayments.every((p) => p.status === PaymentStatus.PAID)).toBe(true);
        expect(paidPayments[0].id).toBe('1');
      });

      it('should return empty array when no paid payments', () => {
        usePaymentStore.setState({
          payments: mockPayments.filter((p) => p.status !== PaymentStatus.PAID),
        });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPaidPayments(state)).toEqual([]);
      });

      it('should return empty array when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPaidPayments(state)).toEqual([]);
      });
    });

    describe('getPendingPayments', () => {
      it('should return pending and overdue payments', () => {
        const state = usePaymentStore.getState();
        const pendingPayments = paymentSelectors.getPendingPayments(state);

        expect(pendingPayments).toHaveLength(2);
        expect(
          pendingPayments.every(
            (p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE
          )
        ).toBe(true);
      });

      it('should return empty array when no pending/overdue payments', () => {
        usePaymentStore.setState({
          payments: mockPayments.filter((p) => p.status === PaymentStatus.PAID),
        });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPendingPayments(state)).toEqual([]);
      });

      it('should return empty array when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPendingPayments(state)).toEqual([]);
      });
    });

    describe('getOverduePayments', () => {
      it('should return only overdue payments', () => {
        const state = usePaymentStore.getState();
        const overduePayments = paymentSelectors.getOverduePayments(state);

        expect(overduePayments).toHaveLength(1);
        expect(overduePayments.every((p) => p.status === PaymentStatus.OVERDUE)).toBe(true);
        expect(overduePayments[0].id).toBe('3');
      });

      it('should return empty array when no overdue payments', () => {
        usePaymentStore.setState({
          payments: mockPayments.filter((p) => p.status !== PaymentStatus.OVERDUE),
        });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getOverduePayments(state)).toEqual([]);
      });

      it('should return empty array when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getOverduePayments(state)).toEqual([]);
      });
    });

    describe('isSessionPaid', () => {
      it('should return true when session has a paid payment', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.isSessionPaid(state, 'session-1')).toBe(true);
      });

      it('should return false when session has no paid payment', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.isSessionPaid(state, 'session-2')).toBe(false); // PENDING
        expect(paymentSelectors.isSessionPaid(state, 'session-3')).toBe(false); // OVERDUE
      });

      it('should return false when session does not exist', () => {
        const state = usePaymentStore.getState();
        expect(paymentSelectors.isSessionPaid(state, 'non-existent-session')).toBe(false);
      });

      it('should return false when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.isSessionPaid(state, 'session-1')).toBe(false);
      });
    });

    describe('getPaymentBySessionId', () => {
      it('should return payment for existing session', () => {
        const state = usePaymentStore.getState();
        const payment = paymentSelectors.getPaymentBySessionId(state, 'session-1');

        expect(payment).toBeDefined();
        expect(payment?.id).toBe('1');
        expect(payment?.sessionId).toBe('session-1');
      });

      it('should return undefined for non-existent session', () => {
        const state = usePaymentStore.getState();
        const payment = paymentSelectors.getPaymentBySessionId(state, 'non-existent-session');

        expect(payment).toBeUndefined();
      });

      it('should return undefined when payments is not an array', () => {
        usePaymentStore.setState({ payments: null as unknown as Payment[] });
        const state = usePaymentStore.getState();
        expect(paymentSelectors.getPaymentBySessionId(state, 'session-1')).toBeUndefined();
      });
    });
  });

  // ==================== Filtering Tests ====================
  describe('Filtering', () => {
    it('should filter by date range', async () => {
      const filters: PaymentFilters = {
        from: '2024-01-10',
        to: '2024-01-20',
      };
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments(true, filters);
      });

      expect(paymentService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should filter by search term (patient name)', async () => {
      const filters: PaymentFilters = {
        search: 'Juan',
      };
      vi.mocked(paymentService.getAll).mockResolvedValue({
        ...mockNormalizedResponse,
        payments: [mockPayments[0]],
      });

      await act(async () => {
        await usePaymentStore.getState().fetchPayments(true, filters);
      });

      expect(paymentService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should combine multiple filters', async () => {
      const filters: PaymentFilters = {
        from: '2024-01-01',
        to: '2024-01-31',
        search: 'Juan',
        page: 1,
        limit: 20,
      };
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments(true, filters);
      });

      expect(paymentService.getAll).toHaveBeenCalledWith(filters);
      expect(usePaymentStore.getState().currentFilters).toEqual(filters);
    });
  });

  // ==================== Statistics/Totals Tests ====================
  describe('Statistics/Totals', () => {
    it('should store total amounts correctly', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      const { totals } = usePaymentStore.getState();
      expect(totals.totalAmount).toBe(12000);
      expect(totals.paidAmount).toBe(5000);
      expect(totals.pendingAmount).toBe(3000);
      expect(totals.overdueAmount).toBe(4000);
    });

    it('should store payment counts correctly', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue(mockNormalizedResponse);

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      const { totals } = usePaymentStore.getState();
      expect(totals.totalCount).toBe(3);
      expect(totals.paidCount).toBe(1);
      expect(totals.pendingCount).toBe(1);
      expect(totals.overdueCount).toBe(1);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('should handle empty payments list gracefully', async () => {
      vi.mocked(paymentService.getAll).mockResolvedValue({
        payments: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        totals: defaultTotals,
      });

      await act(async () => {
        await usePaymentStore.getState().fetchPayments();
      });

      expect(usePaymentStore.getState().payments).toEqual([]);
      expect(usePaymentStore.getState().totals).toEqual(defaultTotals);
    });

    it('should handle update of non-existent payment in list', async () => {
      usePaymentStore.setState({ payments: mockPayments });

      const nonExistentPayment: Payment = {
        id: '999',
        sessionId: 'session-999',
        amount: 1000,
        paymentDate: '2024-01-01',
        status: PaymentStatus.PAID,
      };

      vi.mocked(paymentService.update).mockResolvedValue(nonExistentPayment);

      await act(async () => {
        await usePaymentStore.getState().updatePayment('999', { amount: 1000 });
      });

      // Should not add new payment, list stays the same size
      expect(usePaymentStore.getState().payments).toHaveLength(3);
    });

    it('should handle delete of non-existent payment', async () => {
      usePaymentStore.setState({ payments: mockPayments });
      vi.mocked(paymentService.delete).mockResolvedValue(undefined);

      await act(async () => {
        await usePaymentStore.getState().deletePayment('999');
      });

      // List should remain unchanged (no payment with id 999)
      expect(usePaymentStore.getState().payments).toHaveLength(3);
    });

    it('should handle non-Error error objects', async () => {
      vi.mocked(paymentService.getAll).mockRejectedValue('String error');

      await act(async () => {
        try {
          await usePaymentStore.getState().fetchPayments();
        } catch {
          // Expected
        }
      });

      // Should wrap non-Error in Error
      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe('Failed to fetch payments');
    });

    it('should handle non-Error error on create', async () => {
      vi.mocked(paymentService.create).mockRejectedValue('String error');

      await act(async () => {
        try {
          await usePaymentStore.getState().createPayment({
            sessionId: 'session-1',
            amount: 1000,
            paymentDate: '2024-01-01',
          });
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe('Failed to create payment');
    });

    it('should handle non-Error error on update', async () => {
      vi.mocked(paymentService.update).mockRejectedValue('String error');

      await act(async () => {
        try {
          await usePaymentStore.getState().updatePayment('1', { amount: 1000 });
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe('Failed to update payment');
    });

    it('should handle non-Error error on delete', async () => {
      vi.mocked(paymentService.delete).mockRejectedValue('String error');

      await act(async () => {
        try {
          await usePaymentStore.getState().deletePayment('1');
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe('Failed to delete payment');
    });

    it('should handle non-Error error on markAsPaid', async () => {
      vi.mocked(paymentService.markAsPaid).mockRejectedValue('String error');

      await act(async () => {
        try {
          await usePaymentStore.getState().markAsPaid('1');
        } catch {
          // Expected
        }
      });

      expect(usePaymentStore.getState().error).toBeInstanceOf(Error);
      expect(usePaymentStore.getState().error?.message).toBe('Failed to mark payment as paid');
    });
  });
});
