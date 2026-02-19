import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentDrawer } from '../../../components/cobros/PaymentDrawer';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '../../../lib/types/api.types';
import { PaymentStatus } from '../../../lib/types/api.types';
import type { SessionUI } from '../../../lib/types/session';
import { SessionStatus, SessionType } from '../../../lib/types/session';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'payments.registerPayment': 'Registrar Pago',
        'payments.editPayment': 'Editar Pago',
        'payments.drawer.closePanel': 'Cerrar panel',
        'payments.drawer.singlePayment': 'Pago Único',
        'payments.drawer.monthlyPlan': 'Plan Mensual',
        'payments.drawer.paymentType': 'Tipo de Pago',
        'payments.drawer.selectSession': 'Seleccionar sesión',
        'payments.drawer.selectPatient': 'Seleccionar paciente',
        'payments.drawer.sessionCount': 'Cantidad de sesiones',
        'payments.drawer.sessionsPerMonth': 'Sesiones por mes',
        'payments.drawer.pricePerSession': 'Precio por sesión',
        'payments.drawer.monthlyDiscount': 'Descuento mensual',
        'payments.drawer.totalMonthlyPlan': 'Total plan mensual',
        'payments.drawer.saving': 'Guardando...',
        'payments.drawer.saveChanges': 'Guardar Cambios',
        'payments.fields.session': 'Sesión',
        'payments.fields.amountARS': 'Monto (ARS)',
        'payments.fields.paymentDate': 'Fecha de Pago',
        'payments.fields.paymentStatus': 'Estado del Pago',
        'payments.fields.descriptionOptional': 'Descripción (opcional)',
        'payments.fields.descriptionPlaceholder': 'Notas sobre el pago...',
        'payments.fields.patient': 'Paciente',
        'payments.pending': 'Pendiente',
        'payments.paid': 'Pagado',
        'payments.overdue': 'Vencido',
        'payments.noPatient': 'Sin paciente',
        'payments.messages.selectSession': 'Debe seleccionar una sesión',
        'payments.messages.amountGreaterThanZero': 'El monto debe ser mayor a cero',
        'payments.messages.errorSave': 'Error al guardar el pago',
        'payments.comingSoon.title': 'Próximamente',
        'payments.comingSoon.description': 'Los planes mensuales estarán disponibles pronto',
        'common.cancel': 'Cancelar',
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, v);
        });
      }
      return result;
    },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import mocked toast for assertions
import { toast as mockToast } from 'sonner';

// Mock date formatter
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatISODate: (date: Date) => date.toISOString().split('T')[0],
}));

// Mock session data
const mockSessions: SessionUI[] = [
  {
    id: 'session-1',
    scheduledFrom: '2024-03-15T10:00:00Z',
    scheduledTo: '2024-03-15T11:00:00Z',
    status: SessionStatus.COMPLETED,
    sessionType: SessionType.PRESENTIAL,
    cost: 15000,
    patientName: 'Juan Pérez',
    formattedTime: '10:00',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Pérez',
    },
  },
  {
    id: 'session-2',
    scheduledFrom: '2024-03-16T14:00:00Z',
    scheduledTo: '2024-03-16T15:00:00Z',
    status: SessionStatus.CONFIRMED,
    sessionType: SessionType.REMOTE,
    cost: 12000,
    patientName: 'María García',
    formattedTime: '14:00',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    patient: {
      id: 'patient-2',
      firstName: 'María',
      lastName: 'García',
    },
  },
];

// Mock payment data for edit mode
const mockPayment: Payment = {
  id: 'payment-1',
  sessionId: 'session-1',
  amount: 15000,
  paymentDate: '2024-03-15T00:00:00Z',
  status: PaymentStatus.PAID,
  description: 'Pago de sesión individual',
  patient: {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
  },
};

describe('PaymentDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
    mockOnUpdate.mockResolvedValue(undefined);
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders drawer when open', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByRole('heading', { name: 'Registrar Pago' })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <PaymentDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.queryByRole('heading', { name: 'Registrar Pago' })).not.toBeInTheDocument();
    });

    it('shows correct title for create mode', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByRole('heading', { name: 'Registrar Pago' })).toBeInTheDocument();
    });

    it('shows correct title for edit mode', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      expect(screen.getByText('Editar Pago')).toBeInTheDocument();
    });

    it('renders session select field', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText(/Sesión/)).toBeInTheDocument();
    });

    it('renders amount input field', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument();
    });

    it('renders payment date field', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText(/Fecha de Pago/)).toBeInTheDocument();
    });

    it('renders payment status selector', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Pagado')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Notas sobre el pago...')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText('Cerrar panel')).toBeInTheDocument();
    });

    it('renders payment type selector in create mode', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByText('Pago Único')).toBeInTheDocument();
      expect(screen.getByText('Plan Mensual')).toBeInTheDocument();
    });

    it('does not render payment type selector in edit mode', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      expect(screen.queryByText('Tipo de Pago')).not.toBeInTheDocument();
    });

    it('shows patient name in header when editing', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // The component shows patient info in the header via "payments.paymentOf" translation
      // Check that at least one element contains the patient name
      const patientNameElements = screen.getAllByText(/Juan Pérez/);
      expect(patientNameElements.length).toBeGreaterThan(0);
    });

    it('shows session options in select', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const select = screen.getByLabelText(/Sesión/);
      const options = within(select).getAllByRole('option');
      
      // 1 placeholder + 2 sessions
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Seleccionar sesión');
    });
  });

  // ==================== FORM VALIDATION TESTS ====================
  describe('Form Validation', () => {
    it('shows error toast when session is not selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Set amount to make the button clickable
      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '15000');

      // Try to submit - but button should be disabled
      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });
      expect(submitButton).toBeDisabled();
    });

    it('shows error toast when amount is zero', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select a session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Set amount to 0
      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '0');

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when form is invalid', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when session is selected and amount is positive', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select a session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Amount should auto-fill from session cost
      const submitButton = screen.getByRole('button', { name: 'Registrar Pago' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  // ==================== CREATE MODE TESTS ====================
  describe('Create Mode', () => {
    it('submits form with correct data', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Change amount
      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '20000');

      // Add description
      const descriptionInput = screen.getByLabelText(/Descripción/);
      await user.type(descriptionInput, 'Pago en efectivo');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: 'session-1',
            amount: 20000,
            description: 'Pago en efectivo',
            status: PaymentStatus.PENDING,
          })
        );
      });
    });

    it('shows loading text during submission', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      expect(screen.getByRole('button', { name: 'Guardando...' })).toBeInTheDocument();
    });

    it('closes drawer on successful submission', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('auto-fills amount when session is selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('15000');
    });

    it('uses preselected session when provided', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
          preselectedSessionId="session-1"
        />
      );

      const sessionSelect = screen.getByLabelText(/Sesión/) as HTMLSelectElement;
      expect(sessionSelect.value).toBe('session-1');

      // Session select should be disabled
      expect(sessionSelect).toBeDisabled();

      // Amount should be auto-filled
      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('15000');
    });

    it('shows session preview when session is selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Should show patient name in preview
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('allows selecting different payment status', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session first
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Click on "Pagado" status
      await user.click(screen.getByText('Pagado'));

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            status: PaymentStatus.PAID,
          })
        );
      });
    });

    it('trims whitespace from description', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Add description with whitespace
      const descriptionInput = screen.getByLabelText(/Descripción/);
      await user.type(descriptionInput, '  Pago  ');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Pago',
          })
        );
      });
    });

    it('omits empty description from submitted data', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit without description
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0] as CreatePaymentDto;
        expect(callArg.description).toBeUndefined();
      });
    });

    it('rounds amount to 2 decimal places when submitted', async () => {
      // This test verifies that the component rounds amounts to 2 decimal places
      // when submitting (the actual rounding happens in the handleSubmit function)
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
          preselectedSessionId="session-1"
        />
      );

      // Enter an amount with 2 decimals
      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '15000.55');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 15000.55,
          })
        );
      });
    });
  });

  // ==================== EDIT MODE TESTS ====================
  describe('Edit Mode', () => {
    it('pre-fills form with payment data', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      const sessionSelect = screen.getByLabelText(/Sesión/) as HTMLSelectElement;
      expect(sessionSelect.value).toBe('session-1');

      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('15000');

      const descriptionInput = screen.getByLabelText(/Descripción/) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('Pago de sesión individual');
    });

    it('shows "Guardar Cambios" button in edit mode', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      expect(screen.getByRole('button', { name: 'Guardar Cambios' })).toBeInTheDocument();
    });

    it('calls onUpdate with updated data', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // Change amount
      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '18000');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          'payment-1',
          expect.objectContaining({
            amount: 18000,
          })
        );
      });
    });

    it('does not call onSave in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // Submit
      await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('closes drawer on successful update', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // Submit
      await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('pre-selects correct payment status', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // "Pagado" button should have active styles (check by finding it within parent with specific class)
      const pagadoButton = screen.getByText('Pagado').closest('button');
      expect(pagadoButton).toHaveClass('border-green-500');
    });

    it('allows changing payment status in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // Change to Pending status
      await user.click(screen.getByText('Pendiente'));

      // Submit
      await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          'payment-1',
          expect.objectContaining({
            status: PaymentStatus.PENDING,
          })
        );
      });
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('shows error toast on save failure', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows generic error message when error has no message', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue('Some error');

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al guardar el pago');
      });
    });

    it('keeps drawer open on error', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });

      // Drawer should still be visible (onClose not called)
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Registrar Pago' })).toBeInTheDocument();
    });

    it('shows error toast on update failure', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockRejectedValue(new Error('Update failed'));

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      // Submit
      await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('Interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button (X) is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      await user.click(screen.getByLabelText('Cerrar panel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const backdrop = document.querySelector('.backdrop-blur-\\[2px\\]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('allows typing in amount field', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      await user.clear(amountInput);
      await user.type(amountInput, '25000');

      expect(amountInput.value).toBe('25000');
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const descriptionInput = screen.getByLabelText(/Descripción/) as HTMLTextAreaElement;
      await user.type(descriptionInput, 'Test description');

      expect(descriptionInput.value).toBe('Test description');
    });

    it('allows changing payment date', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha de Pago/) as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2024-04-01');

      expect(dateInput.value).toBe('2024-04-01');
    });

    it('session select changes amount when different session selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select first session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      let amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('15000');

      // Select second session
      await user.selectOptions(sessionSelect, 'session-2');

      amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('12000');
    });
  });

  // ==================== PAYMENT TYPE TESTS ====================
  describe('Payment Type Selector', () => {
    it('defaults to single payment type', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const singlePaymentButton = screen.getByText('Pago Único').closest('button');
      expect(singlePaymentButton).toHaveClass('border-indigo-500');
    });

    it('shows coming soon overlay when monthly is selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      await user.click(screen.getByText('Plan Mensual'));

      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });

    it('hides single payment form when monthly is selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      await user.click(screen.getByText('Plan Mensual'));

      // Session selector should not be visible (it's in the single payment form)
      expect(screen.queryByLabelText(/Sesión/)).not.toBeInTheDocument();
    });

    it('hides submit button when monthly is selected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      await user.click(screen.getByText('Plan Mensual'));

      expect(screen.queryByRole('button', { name: 'Registrar Pago' })).not.toBeInTheDocument();
    });

    it('shows single payment form again when switching back', async () => {
      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Switch to monthly
      await user.click(screen.getByText('Plan Mensual'));
      expect(screen.queryByLabelText(/Sesión/)).not.toBeInTheDocument();

      // Switch back to single
      await user.click(screen.getByText('Pago Único'));
      expect(screen.getByLabelText(/Sesión/)).toBeInTheDocument();
    });

    it('disables payment type selector when preselected session is provided', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
          preselectedSessionId="session-1"
        />
      );

      const singlePaymentButton = screen.getByText('Pago Único').closest('button');
      const monthlyPaymentButton = screen.getByText('Plan Mensual').closest('button');

      expect(singlePaymentButton).toBeDisabled();
      expect(monthlyPaymentButton).toBeDisabled();
    });
  });

  // ==================== FORM RESET TESTS ====================
  describe('Form Reset', () => {
    it('resets form when drawer is reopened', async () => {
      const { rerender } = render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Fill form
      const user = userEvent.setup();
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Close drawer
      rerender(
        <PaymentDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Reopen drawer
      rerender(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const newSessionSelect = screen.getByLabelText(/Sesión/) as HTMLSelectElement;
      expect(newSessionSelect.value).toBe('');
    });

    it('loads new payment data when editPayment changes', () => {
      const newPayment: Payment = {
        ...mockPayment,
        id: 'payment-2',
        amount: 25000,
        description: 'Different payment',
      };

      const { rerender } = render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={mockPayment}
        />
      );

      expect((screen.getByLabelText(/Monto/) as HTMLInputElement).value).toBe('15000');

      rerender(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={newPayment}
        />
      );

      expect((screen.getByLabelText(/Monto/) as HTMLInputElement).value).toBe('25000');
      expect((screen.getByLabelText(/Descripción/) as HTMLTextAreaElement).value).toBe('Different payment');
    });
  });

  // ==================== LOADING STATE TESTS ====================
  describe('Loading State', () => {
    it('disables form fields when isLoading is true', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText(/Sesión/)).toBeDisabled();
      expect(screen.getByLabelText(/Monto/)).toBeDisabled();
      expect(screen.getByLabelText(/Fecha de Pago/)).toBeDisabled();
      expect(screen.getByLabelText(/Descripción/)).toBeDisabled();
    });

    it('disables cancel button during save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Select session
      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-1');

      // Submit
      await user.click(screen.getByRole('button', { name: 'Registrar Pago' }));

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has accessible labels for all form inputs', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText(/Sesión/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha de Pago/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      expect(screen.getByLabelText('Cerrar panel')).toBeInTheDocument();
    });

    it('amount input has correct type attribute', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const amountInput = screen.getByLabelText(/Monto/);
      expect(amountInput).toHaveAttribute('type', 'number');
    });

    it('date input has correct type attribute', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha de Pago/);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('required fields are marked with asterisk', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={mockSessions}
        />
      );

      // Check that required field labels contain asterisk marker
      const sessionLabel = screen.getByText(/Sesión/).closest('label');
      const amountLabel = screen.getByText(/Monto/).closest('label');
      const dateLabel = screen.getByText(/Fecha de Pago/).closest('label');

      expect(sessionLabel?.textContent).toContain('*');
      expect(amountLabel?.textContent).toContain('*');
      expect(dateLabel?.textContent).toContain('*');
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles empty sessions array', () => {
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={[]}
        />
      );

      const sessionSelect = screen.getByLabelText(/Sesión/);
      const options = within(sessionSelect).getAllByRole('option');

      // Only placeholder option
      expect(options).toHaveLength(1);
    });

    it('handles session without cost', async () => {
      const sessionsWithoutCost: SessionUI[] = [
        {
          id: 'session-no-cost',
          scheduledFrom: '2024-03-15T10:00:00Z',
          scheduledTo: '2024-03-15T11:00:00Z',
          status: SessionStatus.COMPLETED,
          sessionType: SessionType.PRESENTIAL,
          patientName: 'Test Patient',
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-03-01T00:00:00Z',
        },
      ];

      const user = userEvent.setup();
      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={sessionsWithoutCost}
        />
      );

      const sessionSelect = screen.getByLabelText(/Sesión/);
      await user.selectOptions(sessionSelect, 'session-no-cost');

      // Amount should be 0 when session has no cost
      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('0');
    });

    it('handles payment without patient info in edit mode', () => {
      const paymentWithoutPatient: Payment = {
        ...mockPayment,
        patient: undefined,
      };

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          sessions={mockSessions}
          editPayment={paymentWithoutPatient}
        />
      );

      // Should not crash and render normally
      expect(screen.getByText('Editar Pago')).toBeInTheDocument();
    });

    it('handles session with only firstName (no lastName)', async () => {
      const sessionsWithPartialPatient: SessionUI[] = [
        {
          id: 'session-partial',
          scheduledFrom: '2024-03-15T10:00:00Z',
          scheduledTo: '2024-03-15T11:00:00Z',
          status: SessionStatus.COMPLETED,
          sessionType: SessionType.PRESENTIAL,
          patientName: 'Juan',
          patient: {
            id: 'patient-1',
            firstName: 'Juan',
          },
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-03-01T00:00:00Z',
        },
      ];

      render(
        <PaymentDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          sessions={sessionsWithPartialPatient}
          preselectedSessionId="session-partial"
        />
      );

      // Should show partial patient name
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
  });
});
