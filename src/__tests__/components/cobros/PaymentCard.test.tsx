import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentCard } from '@/components/cobros/PaymentCard';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

// Mock date formatters
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatDate: (date: string) => date.split('T')[0],
  formatCurrency: (amount: number) => `$${amount.toLocaleString('de-DE')}`,
}));

// Mock payment data
const mockPendingPayment: Payment = {
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
};

const mockPaidPayment: Payment = {
  ...mockPendingPayment,
  id: 'payment-2',
  status: PaymentStatus.PAID,
  paidDate: '2024-03-16T00:00:00Z',
};

const mockOverduePayment: Payment = {
  ...mockPendingPayment,
  id: 'payment-3',
  status: PaymentStatus.OVERDUE,
};

const mockPaymentNoDescription: Payment = {
  ...mockPendingPayment,
  id: 'payment-4',
  description: undefined,
};

const mockPaymentNoPatient: Payment = {
  ...mockPendingPayment,
  id: 'payment-5',
  patient: undefined,
};

const mockPaymentOnlyFirstName: Payment = {
  ...mockPendingPayment,
  id: 'payment-6',
  patient: {
    id: 'patient-2',
    firstName: 'María',
  },
};

describe('PaymentCard', () => {
  const defaultProps = {
    payment: mockPendingPayment,
    onMarkAsPaid: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders patient name correctly', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('renders patient initials in avatar', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('renders amount formatted as currency', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByText('$15.000')).toBeInTheDocument();
    });

    it('renders payment date', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByText(/Fecha de pago:/)).toBeInTheDocument();
      expect(screen.getByText(/2024-03-15/)).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByText('Sesión de terapia individual')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaymentNoDescription} />);

      expect(screen.queryByText('Sesión de terapia individual')).not.toBeInTheDocument();
    });

    it('renders "Paciente desconocido" when patient is undefined', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaymentNoPatient} />);

      expect(screen.getByText('Paciente desconocido')).toBeInTheDocument();
    });

    it('renders patient name with only firstName when lastName is undefined', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaymentOnlyFirstName} />);

      expect(screen.getByText('María')).toBeInTheDocument();
    });

    it('renders single initial when patient has only firstName', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaymentOnlyFirstName} />);

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('renders "Pd" as initials for "Paciente desconocido"', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaymentNoPatient} />);

      expect(screen.getByText('Pd')).toBeInTheDocument();
    });
  });

  // ==================== STATUS BADGE TESTS ====================
  describe('Status Badge', () => {
    it('renders "Pendiente" badge for pending status', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('renders "Pagado" badge for paid status', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    it('renders "Vencido" badge for overdue status', () => {
      render(<PaymentCard {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('pending badge has yellow styling', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      const badge = screen.getByText('Pendiente').closest('.bg-yellow-100');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-yellow-700');
    });

    it('paid badge has green styling', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      const badge = screen.getByText('Pagado').closest('.bg-green-100');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-green-700');
    });
  });

  // ==================== PAID DATE TESTS ====================
  describe('Paid Date', () => {
    it('shows paid date when payment is paid', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.getByText(/Cobrado:/)).toBeInTheDocument();
      expect(screen.getByText(/2024-03-16/)).toBeInTheDocument();
    });

    it('does not show paid date when payment is pending', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.queryByText(/Cobrado:/)).not.toBeInTheDocument();
    });

    it('does not show paid date when payment is overdue', () => {
      render(<PaymentCard {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.queryByText(/Cobrado:/)).not.toBeInTheDocument();
    });

    it('paid date has green text color', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      const paidDateText = screen.getByText(/Cobrado:/).closest('p');
      expect(paidDateText).toHaveClass('text-green-600');
    });
  });

  // ==================== CARD BACKGROUND TESTS ====================
  describe('Card Background', () => {
    it('has green background when payment is paid', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      const card = screen.getByText('Juan Pérez').closest('.bg-green-50\\/50');
      expect(card).toBeInTheDocument();
    });

    it('does not have green background when payment is pending', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      const card = screen.getByText('Juan Pérez').closest('.p-4');
      expect(card).not.toHaveClass('bg-green-50/50');
    });
  });

  // ==================== MARK AS PAID BUTTON TESTS ====================
  describe('Mark as Paid Button', () => {
    it('shows "Cobrar" button when payment is pending', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
    });

    it('shows "Cobrar" button when payment is overdue', () => {
      render(<PaymentCard {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
    });

    it('does not show "Cobrar" button when payment is paid', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.queryByRole('button', { name: /Cobrar/i })).not.toBeInTheDocument();
    });

    it('calls onMarkAsPaid when "Cobrar" button is clicked', async () => {
      const onMarkAsPaid = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onMarkAsPaid={onMarkAsPaid} />);

      await user.click(screen.getByRole('button', { name: /Cobrar/i }));

      expect(onMarkAsPaid).toHaveBeenCalledTimes(1);
      expect(onMarkAsPaid).toHaveBeenCalledWith('payment-1');
    });

    it('"Cobrar" button has correct styling', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      const cobrarButton = screen.getByRole('button', { name: /Cobrar/i });
      expect(cobrarButton).toHaveClass('text-green-600', 'border-green-600');
    });

    it('"Cobrar" button has title attribute', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      const cobrarButton = screen.getByRole('button', { name: /Cobrar/i });
      expect(cobrarButton).toHaveAttribute('title', 'Marcar como pagado');
    });
  });

  // ==================== DELETE BUTTON TESTS ====================
  describe('Delete Button', () => {
    it('renders delete button', () => {
      render(<PaymentCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Eliminar pago' })).toBeInTheDocument();
    });

    it('delete button has correct aria-label', () => {
      render(<PaymentCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });
      expect(deleteButton).toHaveAttribute('aria-label', 'Eliminar pago');
    });

    it('delete button has correct title', () => {
      render(<PaymentCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });
      expect(deleteButton).toHaveAttribute('title', 'Eliminar pago');
    });

    it('opens confirm dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar pago')).toBeInTheDocument();
    });

    it('confirm dialog shows payment amount in description', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      // Use getAllByText since amount appears in both card and dialog
      const amountElements = screen.getAllByText(/\$15\.000/);
      expect(amountElements.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onDelete when deletion is confirmed', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith('payment-1');
    });

    it('does not call onDelete when deletion is cancelled', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('closes confirm dialog after confirmation', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('closes confirm dialog after cancellation', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onDelete={onDelete} />);

      // Open confirm dialog
      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('delete button has destructive styling', () => {
      render(<PaymentCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });
      expect(deleteButton).toHaveClass('text-destructive');
    });
  });

  // ==================== CONFIRM DIALOG TESTS ====================
  describe('Confirm Dialog', () => {
    it('confirm dialog uses danger variant', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('confirm dialog has correct title', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      expect(screen.getByText('Eliminar pago')).toBeInTheDocument();
    });

    it('confirm dialog mentions action cannot be undone', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Eliminar pago' }));

      expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('delete button has accessible aria-label', () => {
      render(<PaymentCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });
      expect(deleteButton).toHaveAttribute('aria-label', 'Eliminar pago');
    });

    it('buttons are focusable', () => {
      render(<PaymentCard {...defaultProps} />);

      const cobrarButton = screen.getByRole('button', { name: /Cobrar/i });
      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });

      cobrarButton.focus();
      expect(cobrarButton).toHaveFocus();

      deleteButton.focus();
      expect(deleteButton).toHaveFocus();
    });

    it('delete button is keyboard accessible', async () => {
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Eliminar pago' });
      deleteButton.focus();

      await user.keyboard('{Enter}');

      // Should open the confirm dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('"Cobrar" button is keyboard accessible', async () => {
      const onMarkAsPaid = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onMarkAsPaid={onMarkAsPaid} />);

      const cobrarButton = screen.getByRole('button', { name: /Cobrar/i });
      cobrarButton.focus();

      await user.keyboard('{Enter}');

      expect(onMarkAsPaid).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles payment with very large amount', () => {
      const largeAmountPayment: Payment = {
        ...mockPendingPayment,
        amount: 1000000000,
      };

      render(<PaymentCard {...defaultProps} payment={largeAmountPayment} />);

      expect(screen.getByText('$1.000.000.000')).toBeInTheDocument();
    });

    it('handles payment with zero amount', () => {
      const zeroAmountPayment: Payment = {
        ...mockPendingPayment,
        amount: 0,
      };

      render(<PaymentCard {...defaultProps} payment={zeroAmountPayment} />);

      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('handles payment with decimal amount', () => {
      const decimalAmountPayment: Payment = {
        ...mockPendingPayment,
        amount: 15000.5,
      };

      render(<PaymentCard {...defaultProps} payment={decimalAmountPayment} />);

      expect(screen.getByText('$15.000,5')).toBeInTheDocument();
    });

    it('handles payment with very long description', () => {
      const longDescPayment: Payment = {
        ...mockPendingPayment,
        description: 'A'.repeat(500),
      };

      render(<PaymentCard {...defaultProps} payment={longDescPayment} />);

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('handles payment with very long patient name', () => {
      const longNamePayment: Payment = {
        ...mockPendingPayment,
        patient: {
          id: 'patient-1',
          firstName: 'María de los Angeles',
          lastName: 'Fernández García López',
        },
      };

      render(<PaymentCard {...defaultProps} payment={longNamePayment} />);

      expect(screen.getByText('María de los Angeles Fernández García López')).toBeInTheDocument();
    });

    it('handles rapid clicks on "Cobrar" button', async () => {
      const onMarkAsPaid = vi.fn();
      const user = userEvent.setup();

      render(<PaymentCard {...defaultProps} onMarkAsPaid={onMarkAsPaid} />);

      const cobrarButton = screen.getByRole('button', { name: /Cobrar/i });

      await user.click(cobrarButton);
      await user.click(cobrarButton);
      await user.click(cobrarButton);

      expect(onMarkAsPaid).toHaveBeenCalledTimes(3);
    });

    it('handles payment with special characters in description', () => {
      const specialCharsPayment: Payment = {
        ...mockPendingPayment,
        description: 'Pago con <html> & "caracteres" especiales',
      };

      render(<PaymentCard {...defaultProps} payment={specialCharsPayment} />);

      expect(screen.getByText('Pago con <html> & "caracteres" especiales')).toBeInTheDocument();
    });
  });

  // ==================== VISUAL STRUCTURE TESTS ====================
  describe('Visual Structure', () => {
    it('card has proper padding', () => {
      render(<PaymentCard {...defaultProps} />);

      const card = screen.getByText('Juan Pérez').closest('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('avatar has correct styling', () => {
      render(<PaymentCard {...defaultProps} />);

      const avatar = screen.getByText('JP').closest('.bg-indigo-100');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('rounded-full', 'w-8', 'h-8');
    });

    it('amount has primary color and bold text', () => {
      render(<PaymentCard {...defaultProps} />);

      const amount = screen.getByText('$15.000');
      expect(amount).toHaveClass('text-2xl', 'font-bold', 'text-primary');
    });

    it('description has border-left styling', () => {
      render(<PaymentCard {...defaultProps} />);

      const description = screen.getByText('Sesión de terapia individual');
      expect(description).toHaveClass('border-l-2', 'pl-2');
    });

    it('payment date has muted foreground color', () => {
      render(<PaymentCard {...defaultProps} />);

      const dateText = screen.getByText(/Fecha de pago:/).closest('p');
      expect(dateText).toHaveClass('text-muted-foreground');
    });
  });

  // ==================== BUTTON VISIBILITY TESTS ====================
  describe('Button Visibility by Status', () => {
    it('shows only delete button when paid', () => {
      render(<PaymentCard {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.queryByRole('button', { name: /Cobrar/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar pago' })).toBeInTheDocument();
    });

    it('shows both buttons when pending', () => {
      render(<PaymentCard {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar pago' })).toBeInTheDocument();
    });

    it('shows both buttons when overdue', () => {
      render(<PaymentCard {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.getByRole('button', { name: /Cobrar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Eliminar pago' })).toBeInTheDocument();
    });
  });
});
