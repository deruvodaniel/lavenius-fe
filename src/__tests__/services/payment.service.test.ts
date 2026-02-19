import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  paymentService,
  type PaymentFilters,
  type BackendPaymentResponse,
} from '../../lib/services/payment.service';
import { apiClient } from '../../lib/api/client';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '../../lib/types/api.types';
import { PaymentStatus } from '../../lib/types/api.types';

vi.mock('../../lib/api/client');

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPayment: Payment = {
    id: 'payment-1',
    amount: 150,
    paymentDate: '2024-01-15',
    status: PaymentStatus.PENDING,
    sessionId: 'session-1',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@example.com',
    },
  };

  const mockPaidPayment: Payment = {
    ...mockPayment,
    id: 'payment-2',
    status: PaymentStatus.PAID,
    paidDate: '2024-01-16',
  };

  const mockOverduePayment: Payment = {
    ...mockPayment,
    id: 'payment-3',
    status: PaymentStatus.OVERDUE,
    amount: 200,
  };

  describe('getAll', () => {
    it('should fetch all payments without filters', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [mockPayment, mockPaidPayment],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
        total: 300,
        totalPaid: 150,
        totalPending: 150,
        totalOverdue: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const result = await paymentService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/payments');
      expect(result.payments).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.totals.totalAmount).toBe(300);
      expect(result.totals.paidAmount).toBe(150);
    });

    it('should fetch payments with date filters', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [mockPayment],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
        total: 150,
        totalPaid: 0,
        totalPending: 150,
        totalOverdue: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const filters: PaymentFilters = {
        from: '2024-01-01',
        to: '2024-01-31',
      };

      const result = await paymentService.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/payments?from=2024-01-01&to=2024-01-31');
      expect(result.payments).toHaveLength(1);
    });

    it('should fetch payments with search filter', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [mockPayment],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
        total: 150,
        totalPaid: 0,
        totalPending: 150,
        totalOverdue: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const result = await paymentService.getAll({ search: 'Juan' });

      expect(apiClient.get).toHaveBeenCalledWith('/payments?search=Juan');
      expect(result.payments[0].patient?.firstName).toBe('Juan');
    });

    it('should fetch payments with pagination', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [mockPayment],
          pagination: {
            page: 2,
            limit: 5,
            total: 10,
            totalPages: 2,
          },
        },
        total: 1500,
        totalPaid: 750,
        totalPending: 500,
        totalOverdue: 250,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const result = await paymentService.getAll({ page: 2, limit: 5 });

      expect(apiClient.get).toHaveBeenCalledWith('/payments?page=2&limit=5');
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should handle legacy array response', async () => {
      const legacyResponse: Payment[] = [mockPayment, mockPaidPayment, mockOverduePayment];

      vi.mocked(apiClient.get).mockResolvedValue(legacyResponse);

      const result = await paymentService.getAll();

      expect(result.payments).toHaveLength(3);
      // Fallback pagination
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      // Fallback totals calculated from data
      expect(result.totals.totalAmount).toBe(500); // 150 + 150 + 200
      expect(result.totals.paidCount).toBe(1);
      expect(result.totals.pendingCount).toBe(1);
      expect(result.totals.overdueCount).toBe(1);
    });

    it('should handle empty response', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        total: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const result = await paymentService.getAll();

      expect(result.payments).toHaveLength(0);
      expect(result.totals.totalAmount).toBe(0);
      expect(result.totals.totalCount).toBe(0);
    });

    it('should handle response with missing payments.data', async () => {
      const invalidResponse = { payments: {} };

      vi.mocked(apiClient.get).mockResolvedValue(invalidResponse);

      const result = await paymentService.getAll();

      expect(result.payments).toHaveLength(0);
    });

    it('should combine all filters in query string', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [],
          pagination: { page: 3, limit: 20, total: 0, totalPages: 0 },
        },
        total: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      await paymentService.getAll({
        from: '2024-01-01',
        to: '2024-12-31',
        search: 'Maria',
        page: 3,
        limit: 20,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payments?from=2024-01-01&to=2024-12-31&search=Maria&page=3&limit=20'
      );
    });
  });

  describe('create', () => {
    it('should create a new payment with date string', async () => {
      const createData: CreatePaymentDto = {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockPayment);

      const result = await paymentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments', {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T12:00:00.000Z',
      });
      expect(result).toEqual(mockPayment);
    });

    it('should create a payment with ISO datetime string', async () => {
      const createData: CreatePaymentDto = {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T10:30:00.000Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockPayment);

      await paymentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments', {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T10:30:00.000Z',
      });
    });

    it('should create a payment with description', async () => {
      const createData: CreatePaymentDto = {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15',
        description: 'Monthly session fee',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockPayment);

      await paymentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments', {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T12:00:00.000Z',
        description: 'Monthly session fee',
      });
    });

    it('should create a payment with status', async () => {
      const createData: CreatePaymentDto = {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15',
        status: PaymentStatus.PAID,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockPaidPayment);

      await paymentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments', {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T12:00:00.000Z',
        status: PaymentStatus.PAID,
      });
    });

    it('should create a payment with paidDate', async () => {
      const createData: CreatePaymentDto = {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15',
        status: PaymentStatus.PAID,
        paidDate: '2024-01-16',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockPaidPayment);

      await paymentService.create(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments', {
        sessionId: 'session-1',
        amount: 100,
        paymentDate: '2024-01-15T12:00:00.000Z',
        status: PaymentStatus.PAID,
        paidDate: '2024-01-16',
      });
    });
  });

  describe('markAsPaid', () => {
    it('should mark a payment as paid', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue(mockPaidPayment);

      const result = await paymentService.markAsPaid('payment-1');

      expect(apiClient.patch).toHaveBeenCalledWith('/payments/payment-1/pay', {});
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateData: UpdatePaymentDto = {
        amount: 200,
        description: 'Updated description',
      };

      const updatedPayment = { ...mockPayment, ...updateData };
      vi.mocked(apiClient.patch).mockResolvedValue(updatedPayment);

      const result = await paymentService.update('payment-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/payments/payment-1', updateData);
      expect(result.amount).toBe(200);
      expect(result.description).toBe('Updated description');
    });

    it('should update payment status', async () => {
      const updateData: UpdatePaymentDto = {
        status: PaymentStatus.PAID,
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ ...mockPayment, status: PaymentStatus.PAID });

      const result = await paymentService.update('payment-1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/payments/payment-1', updateData);
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('delete', () => {
    it('should delete a payment', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await paymentService.delete('payment-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/payments/payment-1');
    });
  });

  describe('totals calculation', () => {
    it('should use server totals when available', async () => {
      const backendResponse: BackendPaymentResponse = {
        payments: {
          data: [mockPayment], // Only 1 payment in current page
          pagination: {
            page: 1,
            limit: 10,
            total: 100, // But 100 total payments
            totalPages: 10,
          },
        },
        total: 15000,      // Server-calculated total
        totalPaid: 10000,
        totalPending: 3000,
        totalOverdue: 2000,
      };

      vi.mocked(apiClient.get).mockResolvedValue(backendResponse);

      const result = await paymentService.getAll();

      // Should use server totals, not calculated from single page
      expect(result.totals.totalAmount).toBe(15000);
      expect(result.totals.paidAmount).toBe(10000);
      expect(result.totals.pendingAmount).toBe(3000);
      expect(result.totals.overdueAmount).toBe(2000);
      expect(result.totals.totalCount).toBe(100);
    });

    it('should calculate totals from data when server totals unavailable', async () => {
      const payments: Payment[] = [
        { ...mockPayment, amount: 100, status: PaymentStatus.PAID },
        { ...mockPayment, id: '2', amount: 200, status: PaymentStatus.PENDING },
        { ...mockPayment, id: '3', amount: 300, status: PaymentStatus.OVERDUE },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(payments);

      const result = await paymentService.getAll();

      expect(result.totals.totalAmount).toBe(600);
      expect(result.totals.paidAmount).toBe(100);
      expect(result.totals.pendingAmount).toBe(200);
      expect(result.totals.overdueAmount).toBe(300);
      expect(result.totals.paidCount).toBe(1);
      expect(result.totals.pendingCount).toBe(1);
      expect(result.totals.overdueCount).toBe(1);
    });
  });
});
