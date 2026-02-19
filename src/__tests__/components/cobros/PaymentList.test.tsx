import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentList } from '@/components/cobros/PaymentList';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

// Mock react-i18next (for EmptyState translations)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock date formatters
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatDate: (date: string) => date.split('T')[0],
  formatCurrency: (amount: number) => `$${amount.toLocaleString('de-DE')}`,
}));

// Mock payment data
const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    sessionId: 'session-1',
    amount: 15000,
    paymentDate: '2024-03-15T00:00:00Z',
    status: PaymentStatus.PENDING,
    description: 'Sesión de terapia individual',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
    },
  },
  {
    id: 'payment-2',
    sessionId: 'session-2',
    amount: 20000,
    paymentDate: '2024-03-16T00:00:00Z',
    status: PaymentStatus.PAID,
    paidDate: '2024-03-17T00:00:00Z',
    description: 'Sesión de pareja',
    patient: {
      id: 'patient-2',
      firstName: 'María',
      lastName: 'García',
      email: 'maria@test.com',
    },
  },
  {
    id: 'payment-3',
    sessionId: 'session-3',
    amount: 12000,
    paymentDate: '2024-03-10T00:00:00Z',
    status: PaymentStatus.OVERDUE,
    description: 'Sesión grupal',
    patient: {
      id: 'patient-3',
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos@test.com',
    },
  },
];

describe('PaymentList', () => {
  const defaultProps = {
    payments: mockPayments,
    onMarkAsPaid: vi.fn(),
    onDelete: vi.fn(),
    onCreateNew: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders payment cards for each payment', () => {
      render(<PaymentList {...defaultProps} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('renders correct number of payment cards', () => {
      render(<PaymentList {...defaultProps} />);

      // Each payment has a description
      expect(screen.getByText('Sesión de terapia individual')).toBeInTheDocument();
      expect(screen.getByText('Sesión de pareja')).toBeInTheDocument();
      expect(screen.getByText('Sesión grupal')).toBeInTheDocument();
    });

    it('renders payments with correct amounts', () => {
      render(<PaymentList {...defaultProps} />);

      expect(screen.getByText('$15.000')).toBeInTheDocument();
      expect(screen.getByText('$20.000')).toBeInTheDocument();
      expect(screen.getByText('$12.000')).toBeInTheDocument();
    });

    it('renders payments with correct status badges', () => {
      render(<PaymentList {...defaultProps} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Pagado')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('renders payment cards with proper spacing', () => {
      const { container } = render(<PaymentList {...defaultProps} />);

      const listContainer = container.querySelector('.space-y-4');
      expect(listContainer).toBeInTheDocument();
    });
  });

  // ==================== EMPTY STATE TESTS ====================
  describe('Empty State', () => {
    it('renders empty state when no payments', () => {
      render(<PaymentList {...defaultProps} payments={[]} />);

      expect(screen.getByText('No hay pagos registrados')).toBeInTheDocument();
      expect(
        screen.getByText('Comienza registrando el primer pago para este paciente o sesión.')
      ).toBeInTheDocument();
    });

    it('renders action button in empty state when onCreateNew is provided', () => {
      render(<PaymentList {...defaultProps} payments={[]} />);

      expect(screen.getByRole('button', { name: 'Registrar Pago' })).toBeInTheDocument();
    });

    it('does not render action button when onCreateNew is not provided', () => {
      render(<PaymentList {...defaultProps} payments={[]} onCreateNew={undefined} />);

      expect(screen.queryByRole('button', { name: 'Registrar Pago' })).not.toBeInTheDocument();
    });

    it('calls onCreateNew when action button is clicked', async () => {
      const user = userEvent.setup();
      const onCreateNew = vi.fn();

      render(<PaymentList {...defaultProps} payments={[]} onCreateNew={onCreateNew} />);

      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      expect(onCreateNew).toHaveBeenCalledTimes(1);
    });

    it('shows receipt icon in empty state', () => {
      render(<PaymentList {...defaultProps} payments={[]} />);

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();

      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('Interactions', () => {
    it('calls onMarkAsPaid when mark as paid button is clicked', async () => {
      const user = userEvent.setup();
      const onMarkAsPaid = vi.fn();

      render(<PaymentList {...defaultProps} onMarkAsPaid={onMarkAsPaid} />);

      // Click the first "Cobrar" button (pending payment)
      const cobrarButtons = screen.getAllByRole('button', { name: /Cobrar/i });
      await user.click(cobrarButtons[0]);

      expect(onMarkAsPaid).toHaveBeenCalledWith('payment-1');
    });

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<PaymentList {...defaultProps} onDelete={onDelete} />);

      // Click the first delete button
      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      await user.click(deleteButtons[0]);

      // Confirm deletion in dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      expect(onDelete).toHaveBeenCalledWith('payment-1');
    });

    it('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<PaymentList {...defaultProps} onDelete={onDelete} />);

      // Click the first delete button
      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      await user.click(deleteButtons[0]);

      // Cancel deletion in dialog
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not show mark as paid button for already paid payments', () => {
      // Only include the paid payment
      render(<PaymentList {...defaultProps} payments={[mockPayments[1]]} />);

      expect(screen.queryByRole('button', { name: /Cobrar/i })).not.toBeInTheDocument();
    });

    it('shows mark as paid button for pending payments', () => {
      // Only include the pending payment
      render(<PaymentList {...defaultProps} payments={[mockPayments[0]]} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
    });

    it('shows mark as paid button for overdue payments', () => {
      // Only include the overdue payment
      render(<PaymentList {...defaultProps} payments={[mockPayments[2]]} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
    });
  });

  // ==================== SINGLE PAYMENT TESTS ====================
  describe('Single Payment', () => {
    it('renders correctly with a single payment', () => {
      render(<PaymentList {...defaultProps} payments={[mockPayments[0]]} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('$15.000')).toBeInTheDocument();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles payment without patient', () => {
      const paymentNoPatient: Payment = {
        ...mockPayments[0],
        id: 'payment-no-patient',
        patient: undefined,
      };

      render(<PaymentList {...defaultProps} payments={[paymentNoPatient]} />);

      expect(screen.getByText('Paciente desconocido')).toBeInTheDocument();
    });

    it('handles payment without description', () => {
      const paymentNoDesc: Payment = {
        ...mockPayments[0],
        id: 'payment-no-desc',
        description: undefined,
      };

      render(<PaymentList {...defaultProps} payments={[paymentNoDesc]} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('Sesión de terapia individual')).not.toBeInTheDocument();
    });

    it('handles very large number of payments', () => {
      const manyPayments = Array.from({ length: 50 }, (_, i) => ({
        ...mockPayments[0],
        id: `payment-${i}`,
        patient: {
          ...mockPayments[0].patient!,
          firstName: `Patient${i}`,
        },
      }));

      render(<PaymentList {...defaultProps} payments={manyPayments} />);

      expect(screen.getByText('Patient0 Pérez')).toBeInTheDocument();
      expect(screen.getByText('Patient49 Pérez')).toBeInTheDocument();
    });

    it('handles payments with special characters in descriptions', () => {
      const specialPayment: Payment = {
        ...mockPayments[0],
        id: 'payment-special',
        description: 'Sesión con <html> & "caracteres" especiales',
      };

      render(<PaymentList {...defaultProps} payments={[specialPayment]} />);

      expect(screen.getByText('Sesión con <html> & "caracteres" especiales')).toBeInTheDocument();
    });

    it('handles payments with very large amounts', () => {
      const largeAmountPayment: Payment = {
        ...mockPayments[0],
        id: 'payment-large',
        amount: 1000000000,
      };

      render(<PaymentList {...defaultProps} payments={[largeAmountPayment]} />);

      expect(screen.getByText('$1.000.000.000')).toBeInTheDocument();
    });

    it('handles payments with zero amount', () => {
      const zeroAmountPayment: Payment = {
        ...mockPayments[0],
        id: 'payment-zero',
        amount: 0,
      };

      render(<PaymentList {...defaultProps} payments={[zeroAmountPayment]} />);

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  // ==================== ORDER PRESERVATION ====================
  describe('Order Preservation', () => {
    it('preserves the order of payments as provided', () => {
      render(<PaymentList {...defaultProps} />);

      const patientNames = screen.getAllByText(/Pérez|García|López/);

      // Check order matches the mockPayments order
      expect(patientNames[0]).toHaveTextContent('Juan Pérez');
      expect(patientNames[1]).toHaveTextContent('María García');
      expect(patientNames[2]).toHaveTextContent('Carlos López');
    });
  });

  // ==================== ACCESSIBILITY ====================
  describe('Accessibility', () => {
    it('delete buttons have accessible aria-labels', () => {
      render(<PaymentList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      expect(deleteButtons).toHaveLength(3);

      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', 'Eliminar pago');
      });
    });

    it('mark as paid buttons are focusable', () => {
      render(<PaymentList {...defaultProps} />);

      const cobrarButtons = screen.getAllByRole('button', { name: /Cobrar/i });
      cobrarButtons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('empty state action button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const onCreateNew = vi.fn();

      render(<PaymentList {...defaultProps} payments={[]} onCreateNew={onCreateNew} />);

      const button = screen.getByRole('button', { name: 'Registrar Pago' });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== CONFIRM DIALOG INTEGRATION ====================
  describe('Confirm Dialog Integration', () => {
    it('opens confirm dialog with correct content', async () => {
      const user = userEvent.setup();

      render(<PaymentList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar pago')).toBeInTheDocument();
    });

    it('closes confirm dialog when confirmed', async () => {
      const user = userEvent.setup();

      render(<PaymentList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('closes confirm dialog when cancelled', async () => {
      const user = userEvent.setup();

      render(<PaymentList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: 'Eliminar pago' });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });
});
