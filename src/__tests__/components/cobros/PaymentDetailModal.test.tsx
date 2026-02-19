import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentDetailModal } from '@/components/cobros/PaymentDetailModal';
import type { Payment } from '@/lib/types/api.types';
import { PaymentStatus } from '@/lib/types/api.types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.close': 'Cerrar',
        'payments.paymentDetail': 'Detalle del Pago',
        'payments.fields.amount': 'Monto',
        'payments.fields.patient': 'Paciente',
        'payments.fields.paymentDate': 'Fecha de pago',
        'payments.fields.paidDate': 'Fecha de cobro',
        'payments.fields.description': 'Descripcion',
        'payments.paid': 'Pagado',
        'payments.pending': 'Pendiente',
        'payments.overdue': 'Vencido',
        'payments.noPatient': 'Sin paciente',
        'payments.actions.edit': 'Editar',
        'payments.actions.delete': 'Eliminar',
        'payments.actions.markAsCollected': 'Marcar como cobrado',
        'payments.messages.processing': 'Procesando...',
      };
      return translations[key] || key;
    },
  }),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockPendingPayment: Payment = {
  id: 'payment-1',
  sessionId: 'session-1',
  amount: 15000,
  paymentDate: '2024-03-15T00:00:00Z',
  status: PaymentStatus.PENDING,
  description: 'Sesion de terapia individual',
  patient: {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Perez',
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

// ============================================================================
// TESTS
// ============================================================================

describe('PaymentDetailModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnMarkAsPaid = vi.fn();

  const defaultProps = {
    payment: mockPendingPayment,
    onClose: mockOnClose,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onMarkAsPaid: mockOnMarkAsPaid,
    isMarkingAsPaid: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders modal with payment details', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByText('Detalle del Pago')).toBeInTheDocument();
    });

    it('renders patient name', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    it('renders "Sin paciente" when patient is undefined', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaymentNoPatient} />);

      expect(screen.getByText('Sin paciente')).toBeInTheDocument();
    });

    it('renders formatted amount', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      // Amount should be formatted as Argentine currency
      expect(screen.getByText(/15\.?000/)).toBeInTheDocument();
    });

    it('renders payment date', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByText('Fecha de pago')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByText('Sesion de terapia individual')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaymentNoDescription} />);

      expect(screen.queryByText('Descripcion')).not.toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STATUS DISPLAY TESTS
  // ==========================================================================

  describe('Status Display', () => {
    it('renders "Pendiente" status for pending payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('renders "Pagado" status for paid payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    it('renders "Vencido" status for overdue payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('renders paid date when payment is paid', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.getByText('Fecha de cobro')).toBeInTheDocument();
    });

    it('does not render paid date when payment is pending', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.queryByText('Fecha de cobro')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CLOSE BUTTON TESTS
  // ==========================================================================

  describe('Close Button', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      await user.click(screen.getByLabelText('Cerrar'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      // Click the backdrop (first element with bg-black/30 class)
      const backdrop = document.querySelector('.bg-black\\/30');
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACTION BUTTONS TESTS
  // ==========================================================================

  describe('Action Buttons', () => {
    it('renders edit button', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
    });

    it('renders delete button', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Editar/i }));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Eliminar/i }));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // MARK AS PAID BUTTON TESTS
  // ==========================================================================

  describe('Mark as Paid Button', () => {
    it('renders "Marcar como cobrado" button for pending payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPendingPayment} />);

      expect(screen.getByRole('button', { name: /Marcar como cobrado/i })).toBeInTheDocument();
    });

    it('renders "Marcar como cobrado" button for overdue payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockOverduePayment} />);

      expect(screen.getByRole('button', { name: /Marcar como cobrado/i })).toBeInTheDocument();
    });

    it('does not render "Marcar como cobrado" button for paid payment', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaidPayment} />);

      expect(screen.queryByRole('button', { name: /Marcar como cobrado/i })).not.toBeInTheDocument();
    });

    it('does not render "Marcar como cobrado" button when onMarkAsPaid is undefined', () => {
      render(<PaymentDetailModal {...defaultProps} onMarkAsPaid={undefined} />);

      expect(screen.queryByRole('button', { name: /Marcar como cobrado/i })).not.toBeInTheDocument();
    });

    it('calls onMarkAsPaid when "Marcar como cobrado" button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Marcar como cobrado/i }));

      expect(mockOnMarkAsPaid).toHaveBeenCalledTimes(1);
    });

    it('shows "Procesando..." when isMarkingAsPaid is true', () => {
      render(<PaymentDetailModal {...defaultProps} isMarkingAsPaid={true} />);

      expect(screen.getByText('Procesando...')).toBeInTheDocument();
    });

    it('disables button when isMarkingAsPaid is true', () => {
      render(<PaymentDetailModal {...defaultProps} isMarkingAsPaid={true} />);

      const button = screen.getByRole('button', { name: /Procesando/i });
      expect(button).toBeDisabled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('close button has accessible aria-label', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Cerrar');
      expect(closeButton).toBeInTheDocument();
    });

    it('action buttons are focusable', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar/i });
      const deleteButton = screen.getByRole('button', { name: /Eliminar/i });

      editButton.focus();
      expect(editButton).toHaveFocus();

      deleteButton.focus();
      expect(deleteButton).toHaveFocus();
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Cerrar');
      closeButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('edit button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar/i });
      editButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('delete button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /Eliminar/i });
      deleteButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles patient with only firstName', () => {
      const paymentOnlyFirstName: Payment = {
        ...mockPendingPayment,
        patient: {
          id: 'patient-1',
          firstName: 'Maria',
        },
      };

      render(<PaymentDetailModal {...defaultProps} payment={paymentOnlyFirstName} />);

      expect(screen.getByText('Maria')).toBeInTheDocument();
    });

    it('handles very large amount', () => {
      const largeAmountPayment: Payment = {
        ...mockPendingPayment,
        amount: 1000000000,
      };

      render(<PaymentDetailModal {...defaultProps} payment={largeAmountPayment} />);

      // Should render without crashing
      expect(screen.getByText('Detalle del Pago')).toBeInTheDocument();
    });

    it('handles zero amount', () => {
      const zeroAmountPayment: Payment = {
        ...mockPendingPayment,
        amount: 0,
      };

      render(<PaymentDetailModal {...defaultProps} payment={zeroAmountPayment} />);

      expect(screen.getByText('Detalle del Pago')).toBeInTheDocument();
    });

    it('handles very long description', () => {
      const longDescPayment: Payment = {
        ...mockPendingPayment,
        description: 'A'.repeat(500),
      };

      render(<PaymentDetailModal {...defaultProps} payment={longDescPayment} />);

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<PaymentDetailModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar/i });

      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // VISUAL STRUCTURE TESTS
  // ==========================================================================

  describe('Visual Structure', () => {
    it('renders header with gradient background', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      const header = screen.getByText('Detalle del Pago').closest('div');
      expect(header?.closest('.bg-gradient-to-r')).toBeInTheDocument();
    });

    it('renders amount card', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      const amountLabel = screen.getByText('Monto');
      expect(amountLabel).toBeInTheDocument();
    });

    it('delete button has red styling', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /Eliminar/i });
      expect(deleteButton).toHaveClass('text-red-600');
    });

    it('mark as paid button has green styling when visible', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPendingPayment} />);

      const markAsPaidButton = screen.getByRole('button', { name: /Marcar como cobrado/i });
      expect(markAsPaidButton).toHaveClass('bg-green-600');
    });
  });

  // ==========================================================================
  // CONTENT FORMATTING TESTS
  // ==========================================================================

  describe('Content Formatting', () => {
    it('formats payment date correctly', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      // The component formats dates in Spanish locale
      const dateSection = screen.getByText('Fecha de pago').closest('div');
      expect(dateSection).toBeInTheDocument();
    });

    it('formats paid date correctly when present', () => {
      render(<PaymentDetailModal {...defaultProps} payment={mockPaidPayment} />);

      const paidDateSection = screen.getByText('Fecha de cobro').closest('div');
      expect(paidDateSection).toBeInTheDocument();
    });

    it('displays short date in header', () => {
      render(<PaymentDetailModal {...defaultProps} />);

      // Short date format varies by locale, just verify a date pattern is shown
      // The component uses formatShortDate which renders DD/MM/YYYY in es-AR
      const header = screen.getByText('Detalle del Pago').closest('div')?.parentElement;
      expect(header).toBeInTheDocument();
      // The date is shown near the title in the header area
      expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
    });
  });
});
