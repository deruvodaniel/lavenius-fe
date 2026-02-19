import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReminderModal } from '@/components/cobros/ReminderModal';
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
        'payments.fields.patient': 'Paciente',
        'payments.reminderModal.title': 'Enviar Recordatorio',
        'payments.reminderModal.message': 'Mensaje',
        'payments.reminderModal.copy': 'Copiar',
        'payments.reminderModal.whatsapp': 'WhatsApp',
        'payments.reminderModal.loadingPatient': 'Cargando datos del paciente...',
        'payments.reminderModal.phone': 'Telefono',
        'payments.reminderModal.noPhone': 'No hay telefono registrado',
        'payments.messages.messageCopied': 'Mensaje copiado',
        'payments.messages.noPhoneRegistered': 'No hay telefono registrado',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock patient store - mutable state for tests
let mockSelectedPatient: { id: string; firstName: string; lastName: string; phone?: string } | null = null;
const mockFetchPatientById = vi.fn();

vi.mock('@/lib/stores/patient.store', () => ({
  usePatientStore: vi.fn((selector) => {
    const state = {
      fetchPatientById: mockFetchPatientById,
      selectedPatient: mockSelectedPatient,
    };
    return selector(state);
  }),
}));

// Mock whatsapp utilities
const mockOpenWhatsApp = vi.fn();

vi.mock('@/lib/utils/whatsappTemplates', () => ({
  formatPaymentReminderMessage: (name: string, date: string, amount: string) => 
    `Hola ${name}, te recordamos que tienes un pago pendiente de ${amount} con fecha ${date}.`,
  openWhatsApp: (phone: string, message: string) => mockOpenWhatsApp(phone, message),
}));

// Mock date formatters
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString('de-DE')}`,
}));

// Note: Clipboard API mocking is tricky in happy-dom environment.
// We verify copy functionality through the toast success message instead.

// ============================================================================
// TEST DATA
// ============================================================================

const mockPayment: Payment = {
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

const mockPaymentNoPatient: Payment = {
  ...mockPayment,
  id: 'payment-2',
  patient: undefined,
};

// ============================================================================
// TESTS
// ============================================================================

describe('ReminderModal', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    payment: mockPayment,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset selectedPatient to null before each test
    mockSelectedPatient = null;
    // Default: fetchPatientById resolves and updates selectedPatient
    mockFetchPatientById.mockImplementation(async () => {
      mockSelectedPatient = {
        id: 'patient-1',
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '+5491122334455',
      };
    });
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders modal with title', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByText('Enviar Recordatorio')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('renders message label', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByText('Mensaje')).toBeInTheDocument();
    });

    it('renders textarea with default message containing patient name', () => {
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      // Check that message contains patient name (Juan Perez)
      expect(textarea.textContent || (textarea as HTMLTextAreaElement).value).toContain('Juan Perez');
    });

    it('renders copy button', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Copiar/i })).toBeInTheDocument();
    });

    it('renders WhatsApp button', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
    });

    it('renders fallback name when patient is undefined', () => {
      render(<ReminderModal {...defaultProps} payment={mockPaymentNoPatient} />);

      const textarea = screen.getByRole('textbox');
      // Should contain "Paciente" (the translation fallback)
      expect(textarea.textContent || (textarea as HTMLTextAreaElement).value).toContain('Paciente');
    });
  });

  // ==========================================================================
  // CLOSE BUTTON TESTS
  // ==========================================================================

  describe('Close Button', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      await user.click(screen.getByLabelText('Cerrar'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const backdrop = document.querySelector('.bg-black\\/30');
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // MESSAGE EDITING TESTS
  // ==========================================================================

  describe('Message Editing', () => {
    it('allows editing the message', async () => {
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Nuevo mensaje');

      expect(textarea).toHaveValue('Nuevo mensaje');
    });

    it('textarea has proper label association', () => {
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByLabelText('Mensaje');
      expect(textarea).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COPY BUTTON TESTS
  // ==========================================================================

  describe('Copy Button', () => {
    it('shows success toast after clicking copy button', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Copiar/i }));

      expect(toast.success).toHaveBeenCalledWith('Mensaje copiado');
    });
  });

  // ==========================================================================
  // WHATSAPP BUTTON TESTS
  // ==========================================================================

  describe('WhatsApp Button', () => {
    it('shows info toast when no phone is registered', async () => {
      const { toast } = await import('sonner');
      
      // No phone set
      mockFetchPatientById.mockImplementation(async () => {
        mockSelectedPatient = {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Perez',
          phone: undefined,
        };
      });

      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Cargando datos del paciente...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /WhatsApp/i }));

      expect(toast.info).toHaveBeenCalledWith('No hay telefono registrado');
    });

    it('always calls onClose after clicking WhatsApp', async () => {
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Cargando datos del paciente...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /WhatsApp/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // PATIENT LOADING TESTS
  // ==========================================================================

  describe('Patient Loading', () => {
    it('fetches patient data on mount', async () => {
      render(<ReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });
    });

    it('shows loading state while fetching patient', () => {
      mockFetchPatientById.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByText('Cargando datos del paciente...')).toBeInTheDocument();
    });

    it('shows "No hay telefono registrado" when patient has no phone', async () => {
      mockFetchPatientById.mockImplementation(async () => {
        mockSelectedPatient = {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Perez',
          phone: undefined,
        };
      });

      render(<ReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No hay telefono registrado')).toBeInTheDocument();
      });
    });

    it('does not fetch patient if no patient id', () => {
      render(<ReminderModal {...defaultProps} payment={mockPaymentNoPatient} />);

      expect(mockFetchPatientById).not.toHaveBeenCalled();
    });

    it('handles fetch patient error gracefully', async () => {
      mockFetchPatientById.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      render(<ReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalled();
      });

      // Modal should still be functional
      expect(screen.getByText('Enviar Recordatorio')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // WHATSAPP BUTTON DISABLED STATE
  // ==========================================================================

  describe('WhatsApp Button Disabled State', () => {
    it('WhatsApp button is disabled while loading patient', () => {
      mockFetchPatientById.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ReminderModal {...defaultProps} />);

      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i });
      expect(whatsappButton).toBeDisabled();
    });

    it('WhatsApp button is enabled after patient loads', async () => {
      render(<ReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando datos del paciente...')).not.toBeInTheDocument();
      });

      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i });
      expect(whatsappButton).not.toBeDisabled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('close button has accessible aria-label', () => {
      render(<ReminderModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Cerrar');
      expect(closeButton).toBeInTheDocument();
    });

    it('textarea has accessible label', () => {
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByLabelText('Mensaje');
      expect(textarea).toBeInTheDocument();
    });

    it('buttons are focusable', async () => {
      render(<ReminderModal {...defaultProps} />);

      // Wait for loading to finish so WhatsApp button is enabled
      await waitFor(() => {
        expect(screen.queryByText('Cargando datos del paciente...')).not.toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i });

      copyButton.focus();
      expect(copyButton).toHaveFocus();

      whatsappButton.focus();
      expect(whatsappButton).toHaveFocus();
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Cerrar');
      closeButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('copy button is keyboard accessible', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      copyButton.focus();

      await user.keyboard('{Enter}');

      // Verify the copy action was triggered by checking the toast
      expect(toast.success).toHaveBeenCalledWith('Mensaje copiado');
    });
  });

  // ==========================================================================
  // VISUAL STRUCTURE TESTS
  // ==========================================================================

  describe('Visual Structure', () => {
    it('WhatsApp button has green styling', () => {
      render(<ReminderModal {...defaultProps} />);

      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i });
      expect(whatsappButton).toHaveClass('bg-green-600');
    });

    it('textarea has proper styling', () => {
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border', 'rounded-lg');
    });

    it('no phone status shows yellow color', async () => {
      mockFetchPatientById.mockImplementation(async () => {
        mockSelectedPatient = {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Perez',
          phone: undefined,
        };
      });

      render(<ReminderModal {...defaultProps} />);

      await waitFor(() => {
        const noPhoneText = screen.getByText('No hay telefono registrado');
        expect(noPhoneText.closest('div')).toHaveClass('text-yellow-600');
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles patient with only firstName', () => {
      const paymentWithFirstNameOnly: Payment = {
        ...mockPayment,
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: '',
          email: 'juan@test.com',
        },
      };

      render(<ReminderModal {...defaultProps} payment={paymentWithFirstNameOnly} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea.textContent || (textarea as HTMLTextAreaElement).value).toContain('Juan');
    });

    it('handles rapid button clicks gracefully', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /Copiar/i });
      
      // Rapid clicks
      await user.click(copyButton);
      await user.click(copyButton);
      await user.click(copyButton);

      // Should handle all clicks - verify through toast calls
      expect(toast.success).toHaveBeenCalledTimes(3);
    });

    it('handles empty message gracefully', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      render(<ReminderModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);

      expect(textarea).toHaveValue('');

      // Copy button should still work (triggers toast)
      await user.click(screen.getByRole('button', { name: /Copiar/i }));
      expect(toast.success).toHaveBeenCalledWith('Mensaje copiado');
    });
  });
});
