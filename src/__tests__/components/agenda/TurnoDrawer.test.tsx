import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TurnoDrawer } from '../../../components/agenda/TurnoDrawer';
import { SessionStatus, SessionType } from '@/lib/types/session';
import type { SessionResponse } from '@/lib/types/session';
import type { Patient } from '@/lib/types/api.types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'agenda.newSession': 'Nueva Sesión',
        'agenda.editSession': 'Editar Sesión',
        'agenda.fields.patient': 'Paciente',
        'agenda.fields.date': 'Fecha',
        'agenda.fields.startTime': 'Hora de Inicio',
        'agenda.fields.endTime': 'Hora de Fin',
        'agenda.fields.reason': 'Motivo',
        'agenda.fields.reasonPlaceholder': 'Motivo de la consulta...',
        'agenda.fields.type': 'Tipo de Sesión',
        'agenda.fields.status': 'Estado',
        'agenda.fields.amount': 'Monto',
        'agenda.drawer.required': '*',
        'agenda.drawer.selectPatient': 'Seleccionar paciente',
        'agenda.drawer.loadingPatientData': 'Cargando datos del paciente...',
        'agenda.drawer.emailLabel': 'Email',
        'agenda.drawer.saveChanges': 'Guardar Cambios',
        'agenda.drawer.createAppointment': 'Crear Turno',
        'agenda.drawer.saveConfirmTitle': 'Guardar cambios',
        'agenda.drawer.saveConfirmTitleCreate': 'Crear turno',
        'agenda.drawer.saveConfirmDescription': '¿Deseas guardar los cambios realizados?',
        'agenda.drawer.saveConfirmDescriptionCreate': '¿Deseas crear este turno?',
        'agenda.drawer.saving': 'Guardando...',
        'agenda.drawer.deleteConfirmTitle': 'Eliminar turno',
        'agenda.drawer.deleteConfirmDescription': '¿Estás seguro de eliminar este turno?',
        'agenda.drawer.deleting': 'Eliminando...',
        'agenda.sessionTypes.presential': 'Presencial',
        'agenda.sessionTypes.remote': 'Remoto',
        'agenda.status.scheduled': 'Programado',
        'agenda.status.confirmed': 'Confirmado',
        'agenda.status.completed': 'Completado',
        'agenda.status.cancelled': 'Cancelado',
        'agenda.validation.selectPatient': 'Por favor selecciona un paciente',
        'agenda.validation.selectDate': 'Por favor selecciona una fecha',
        'agenda.validation.selectTime': 'Por favor selecciona la hora',
        'agenda.validation.selectSessionType': 'Por favor selecciona el tipo de sesión',
        'agenda.validation.selectStatus': 'Por favor selecciona el estado',
        'agenda.validation.userIdError': 'Error de usuario',
        'agenda.validation.completeAllFields': 'Completa todos los campos requeridos',
        'agenda.messages.loadPatientDataError': 'Error al cargar datos del paciente',
        'agenda.messages.patientNoEmail': 'El paciente no tiene email registrado',
        'agenda.messages.patientEmailRequired': 'El paciente debe tener email registrado',
        'agenda.messages.pastDateError': 'No se puede crear un turno en el pasado',
        'common.close': 'Cerrar',
        'common.delete': 'Eliminar',
        'common.confirm': 'Confirmar',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// Mock stores
const mockUser = { id: 'therapist-1', email: 'therapist@test.com' };
const mockFetchPatientById = vi.fn();
const mockSelectedPatient: Patient | null = null;

vi.mock('@/lib/stores', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: mockUser };
    return selector(state);
  }),
  usePatientStore: vi.fn((selector) => {
    const state = {
      fetchPatientById: mockFetchPatientById,
      selectedPatient: mockSelectedPatient,
    };
    return selector(state);
  }),
}));

// Mock ConfirmDialog
vi.mock('@/components/shared', () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    onConfirm,
    onOpenChange,
    confirmLabel,
    cancelLabel,
    isLoading,
  }: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    confirmLabel: string;
    cancelLabel: string;
    isLoading?: boolean;
  }) =>
    open ? (
      <div data-testid="confirm-dialog" role="dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button
          data-testid="confirm-action"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {confirmLabel}
        </button>
        <button
          data-testid="cancel-action"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
      </div>
    ) : null,
}));

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    therapistId: 'therapist-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    phone: '+5491112345678',
    status: 'ACTIVE' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-2',
    therapistId: 'therapist-1',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@test.com',
    phone: '+5491198765432',
    status: 'ACTIVE' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-3',
    therapistId: 'therapist-1',
    firstName: 'Carlos',
    lastName: 'López',
    // No email - for testing validation
    phone: '+5491111111111',
    status: 'ACTIVE' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Get a future date for testing
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const futureDateStr = futureDate.toISOString().split('T')[0];

const mockSession: SessionResponse = {
  id: 'session-1',
  scheduledFrom: `${futureDateStr}T10:00:00.000Z`,
  scheduledTo: `${futureDateStr}T11:00:00.000Z`,
  status: SessionStatus.CONFIRMED,
  sessionType: SessionType.PRESENTIAL,
  sessionSummary: 'Sesión de seguimiento',
  cost: 8500,
  patient: {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ============================================================================
// TESTS
// ============================================================================

describe('TurnoDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
    mockOnDelete.mockResolvedValue(undefined);
    // Default: return patient with email when fetchPatientById is called
    mockFetchPatientById.mockImplementation(async (patientId: string) => {
      const patient = mockPatients.find((p) => p.id === patientId);
      // Simulate the store updating selectedPatient
      const { usePatientStore } = await import('@/lib/stores');
      vi.mocked(usePatientStore).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patient || null,
        };
        return selector(state);
      });
      return patient;
    });
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders drawer when open', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TurnoDrawer
          isOpen={false}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Nueva Sesión')).not.toBeInTheDocument();
    });

    it('shows "Nueva Sesión" title for create mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    });

    it('shows "Editar Sesión" title for edit mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      expect(screen.getByText('Editar Sesión')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FORM FIELDS TESTS
  // ==========================================================================

  describe('Form Fields', () => {
    it('renders patient select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Paciente/)).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /Paciente/ })
      ).toBeInTheDocument();
    });

    it('renders patient options in select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const select = screen.getByLabelText(/Paciente/);
      expect(select).toBeInTheDocument();

      // Check options are present
      expect(
        screen.getByRole('option', { name: 'Seleccionar paciente' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Juan Pérez' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'María García' })
      ).toBeInTheDocument();
    });

    it('renders date picker', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Fecha/)).toBeInTheDocument();
      const dateInput = screen.getByLabelText(/Fecha/);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('renders start time select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Hora de Inicio/)).toBeInTheDocument();
    });

    it('renders end time select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Hora de Fin/)).toBeInTheDocument();
    });

    it('renders reason/notes input', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Motivo/)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Motivo de la consulta...')
      ).toBeInTheDocument();
    });

    it('renders session type select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Tipo de Sesión/)).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Presencial' })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Remoto' })).toBeInTheDocument();
    });

    it('renders status select', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Estado/)).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Programado' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Confirmado' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Completado' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Cancelado' })
      ).toBeInTheDocument();
    });

    it('renders amount input', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument();
      const amountInput = screen.getByLabelText(/Monto/);
      expect(amountInput).toHaveAttribute('type', 'number');
    });

    it('renders create button in create mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Crear Turno')).toBeInTheDocument();
    });

    it('renders save changes button in edit mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });

    it('renders delete button in edit mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          session={mockSession}
        />
      );

      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    it('does not render delete button in create mode', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FORM VALIDATION TESTS
  // ==========================================================================

  describe('Form Validation', () => {
    it('disables submit button when patient is not selected', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill only date and keep patient empty
      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);

      // Submit button should be disabled
      const submitButton = screen.getByText('Crear Turno');
      expect(submitButton).toBeDisabled();
      
      // Click should not trigger onSave
      await user.click(submitButton);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('disables submit button when date is not selected', async () => {
      const user = userEvent.setup();

      // Setup mock to simulate patient data loading
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Select patient but don't fill date
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');

      // Wait for patient data to load
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });

      // Submit button should still be disabled without date
      const submitButton = screen.getByText('Crear Turno');
      expect(submitButton).toBeDisabled();
      
      // Click should not trigger onSave
      await user.click(submitButton);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('disables submit button when all required fields are empty', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText('Crear Turno');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('cursor-not-allowed');
    });

    it('shows patient required field styling when empty', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const patientSelect = screen.getByLabelText(/Paciente/);
      expect(patientSelect).toHaveClass('border-red-300');
      expect(patientSelect).toHaveClass('bg-red-50');
    });

    it('shows date required field styling when empty', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha/);
      expect(dateInput).toHaveClass('border-red-300');
      expect(dateInput).toHaveClass('bg-red-50');
    });

    it('shows error when patient has no email', async () => {
      const user = userEvent.setup();

      // Setup mock to simulate patient without email
      const patientWithoutEmail = mockPatients[2]; // Carlos López has no email
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithoutEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Select patient without email
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-3');

      // Wait for patient data to load
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-3');
      });

      // Check that the email required message appears
      await waitFor(() => {
        expect(
          screen.getByText('El paciente debe tener email registrado')
        ).toBeInTheDocument();
      });
    });

    it('shows patient email when loaded', async () => {
      const user = userEvent.setup();

      // Setup mock to simulate patient with email
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Select patient
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');

      // Wait for email to appear
      await waitFor(() => {
        expect(screen.getByText(/juan@test.com/)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // CREATE MODE TESTS
  // ==========================================================================

  describe('Create Mode', () => {
    it('shows confirmation dialog before creating', async () => {
      const user = userEvent.setup();

      // Setup mock to simulate patient with email
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill required fields
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });

      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);

      // Click create
      await user.click(screen.getByText('Crear Turno'));

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('Crear turno')).toBeInTheDocument();
      });
    });

    it('calls onSave with correct data on confirmation', async () => {
      const user = userEvent.setup();

      // Setup mock to simulate patient with email
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill form
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });

      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);
      await user.clear(screen.getByLabelText(/Motivo/));
      await user.type(
        screen.getByLabelText(/Motivo/),
        'Consulta de seguimiento'
      );

      // Click create
      await user.click(screen.getByText('Crear Turno'));

      // Confirm
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('confirm-action'));

      // Verify onSave was called with correct structure
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: 'patient-1',
            attendeeEmail: 'juan@test.com',
            sessionSummary: 'Consulta de seguimiento',
            type: SessionType.PRESENTIAL,
            status: SessionStatus.CONFIRMED,
          })
        );
      });
    });

    it('closes drawer on successful save', async () => {
      const user = userEvent.setup();

      // Setup mock
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill form
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalled();
      });
      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);

      // Submit
      await user.click(screen.getByText('Crear Turno'));
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('confirm-action'));

      // Verify drawer closes
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('keeps drawer open on save error', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValue(new Error('Network error'));

      // Setup mock
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill form
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalled();
      });
      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);

      // Submit
      await user.click(screen.getByText('Crear Turno'));
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('confirm-action'));

      // Wait for save attempt
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Drawer should NOT be closed on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('pre-fills date from initialDate prop', () => {
      const initialDate = new Date(futureDateStr + 'T14:30:00');

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          initialDate={initialDate}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha/) as HTMLInputElement;
      expect(dateInput.value).toBe(futureDateStr);

      // Check that time is also pre-filled
      const startTimeSelect = screen.getByLabelText(
        /Hora de Inicio/
      ) as HTMLSelectElement;
      expect(startTimeSelect.value).toBe('14:30');
    });

    it('pre-fills patient from pacienteId prop', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          pacienteId="patient-2"
        />
      );

      const patientSelect = screen.getByLabelText(
        /Paciente/
      ) as HTMLSelectElement;
      expect(patientSelect.value).toBe('patient-2');
    });
  });

  // ==========================================================================
  // EDIT MODE TESTS
  // ==========================================================================

  describe('Edit Mode', () => {
    it('pre-fills form with session data', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      // Check patient is selected
      const patientSelect = screen.getByLabelText(
        /Paciente/
      ) as HTMLSelectElement;
      expect(patientSelect.value).toBe('patient-1');

      // Check date is filled
      const dateInput = screen.getByLabelText(/Fecha/) as HTMLInputElement;
      expect(dateInput.value).toBe(futureDateStr);

      // Check reason is filled
      const reasonInput = screen.getByLabelText(/Motivo/) as HTMLInputElement;
      expect(reasonInput.value).toBe('Sesión de seguimiento');

      // Check session type
      const typeSelect = screen.getByLabelText(
        /Tipo de Sesión/
      ) as HTMLSelectElement;
      expect(typeSelect.value).toBe('presential');

      // Check status
      const statusSelect = screen.getByLabelText(/Estado/) as HTMLSelectElement;
      expect(statusSelect.value).toBe('confirmed');

      // Check amount
      const amountInput = screen.getByLabelText(/Monto/) as HTMLInputElement;
      expect(amountInput.value).toBe('8500');
    });

    it('shows confirmation dialog before updating', async () => {
      const user = userEvent.setup();

      // Setup mock
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      // Wait for patient data to load
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });

      // Modify something
      await user.clear(screen.getByLabelText(/Motivo/));
      await user.type(screen.getByLabelText(/Motivo/), 'Motivo actualizado');

      // Click save
      await user.click(screen.getByText('Guardar Cambios'));

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
      });
    });

    it('calls onSave with updated data on confirmation', async () => {
      const user = userEvent.setup();

      // Setup mock
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      // Wait for patient data
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalled();
      });

      // Modify reason
      await user.clear(screen.getByLabelText(/Motivo/));
      await user.type(screen.getByLabelText(/Motivo/), 'Motivo actualizado');

      // Submit
      await user.click(screen.getByText('Guardar Cambios'));
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('confirm-action'));

      // Verify onSave was called with updated data
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionSummary: 'Motivo actualizado',
          })
        );
      });
    });

    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup();

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          session={mockSession}
        />
      );

      // Click delete
      await user.click(screen.getByText('Eliminar'));

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('Eliminar turno')).toBeInTheDocument();
      });
    });

    it('calls onDelete on delete confirmation', async () => {
      const user = userEvent.setup();

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          session={mockSession}
        />
      );

      // Click delete
      await user.click(screen.getByText('Eliminar'));

      // Confirm
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('confirm-action'));

      // Verify onDelete was called
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('session-1');
      });
    });

    it('closes drawer on successful delete', async () => {
      const user = userEvent.setup();

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          session={mockSession}
        />
      );

      // Delete flow
      await user.click(screen.getByText('Eliminar'));
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('confirm-action'));

      // Verify close was called
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('resets form when session prop changes to null', async () => {
      const { rerender } = render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      // Verify session data is loaded
      expect(
        (screen.getByLabelText(/Motivo/) as HTMLInputElement).value
      ).toBe('Sesión de seguimiento');

      // Rerender without session
      rerender(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={null}
        />
      );

      // Form should be reset
      expect(
        (screen.getByLabelText(/Motivo/) as HTMLInputElement).value
      ).toBe('');
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByLabelText('Cerrar'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Click the backdrop
      const backdrop = document.querySelector('.backdrop-blur-\\[2px\\]');
      expect(backdrop).toBeInTheDocument();
      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('cancels save confirmation when cancel is clicked', async () => {
      const user = userEvent.setup();

      // Setup mock
      const patientWithEmail = mockPatients[0];
      vi.mocked(
        (await import('@/lib/stores')).usePatientStore
      ).mockImplementation((selector) => {
        const state = {
          fetchPatientById: mockFetchPatientById,
          selectedPatient: patientWithEmail,
        };
        return selector(state);
      });

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Fill form
      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-1');
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalled();
      });
      await user.type(screen.getByLabelText(/Fecha/), futureDateStr);

      // Open confirmation
      await user.click(screen.getByText('Crear Turno'));
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      // Cancel
      await user.click(screen.getByTestId('cancel-action'));

      // Dialog should close, onSave should not be called
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('allows changing session type', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const typeSelect = screen.getByLabelText(/Tipo de Sesión/);
      expect((typeSelect as HTMLSelectElement).value).toBe('presential');

      await user.selectOptions(typeSelect, 'remote');
      expect((typeSelect as HTMLSelectElement).value).toBe('remote');
    });

    it('allows changing status', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const statusSelect = screen.getByLabelText(/Estado/);

      await user.selectOptions(statusSelect, 'completed');
      expect((statusSelect as HTMLSelectElement).value).toBe('completed');
    });

    it('allows changing amount', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const amountInput = screen.getByLabelText(/Monto/);
      await user.clear(amountInput);
      await user.type(amountInput, '10000');

      expect((amountInput as HTMLInputElement).value).toBe('10000');
    });

    it('fetches patient data when patient is selected', async () => {
      const user = userEvent.setup();
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      await user.selectOptions(screen.getByLabelText(/Paciente/), 'patient-2');

      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-2');
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles empty patients list', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={[]}
          onSave={mockOnSave}
        />
      );

      const patientSelect = screen.getByLabelText(/Paciente/);
      const options = within(patientSelect).getAllByRole('option');
      // Should only have the placeholder option
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Seleccionar paciente');
    });

    it('handles session without patient data', () => {
      const sessionWithoutPatient: SessionResponse = {
        ...mockSession,
        patient: undefined,
      };

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={sessionWithoutPatient}
        />
      );

      const patientSelect = screen.getByLabelText(
        /Paciente/
      ) as HTMLSelectElement;
      expect(patientSelect.value).toBe('');
    });

    it('handles session with remote type', () => {
      const remoteSession: SessionResponse = {
        ...mockSession,
        sessionType: SessionType.REMOTE,
      };

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={remoteSession}
        />
      );

      const typeSelect = screen.getByLabelText(
        /Tipo de Sesión/
      ) as HTMLSelectElement;
      expect(typeSelect.value).toBe('remote');
    });

    it('handles different session statuses', () => {
      const pendingSession: SessionResponse = {
        ...mockSession,
        status: SessionStatus.PENDING,
      };

      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={pendingSession}
        />
      );

      const statusSelect = screen.getByLabelText(/Estado/) as HTMLSelectElement;
      expect(statusSelect.value).toBe('pending');
    });

    it('updates form when session prop changes', async () => {
      const anotherSession: SessionResponse = {
        ...mockSession,
        id: 'session-2',
        sessionSummary: 'Otra sesión',
        cost: 12000,
        patient: {
          id: 'patient-2',
          firstName: 'María',
          lastName: 'García',
        },
      };

      const { rerender } = render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={mockSession}
        />
      );

      // Verify initial session data
      expect(
        (screen.getByLabelText(/Motivo/) as HTMLInputElement).value
      ).toBe('Sesión de seguimiento');

      // Change to another session
      rerender(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
          session={anotherSession}
        />
      );

      // Verify new session data
      expect(
        (screen.getByLabelText(/Motivo/) as HTMLInputElement).value
      ).toBe('Otra sesión');
      expect(
        (screen.getByLabelText(/Monto/) as HTMLInputElement).value
      ).toBe('12000');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible labels for all form inputs', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Paciente/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hora de Inicio/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hora de Fin/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Motivo/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tipo de Sesión/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estado/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monto/)).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('date input has correct type', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const dateInput = screen.getByLabelText(/Fecha/);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('amount input has correct type', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      const amountInput = screen.getByLabelText(/Monto/);
      expect(amountInput).toHaveAttribute('type', 'number');
    });

    it('required fields are marked with asterisk', () => {
      render(
        <TurnoDrawer
          isOpen={true}
          onClose={mockOnClose}
          patients={mockPatients}
          onSave={mockOnSave}
        />
      );

      // Check that required indicator (*) is present for required fields
      const patientLabel = screen
        .getByText('Paciente')
        .closest('label');
      expect(patientLabel?.textContent).toContain('*');

      const dateLabel = screen.getByText('Fecha').closest('label');
      expect(dateLabel?.textContent).toContain('*');
    });
  });
});
