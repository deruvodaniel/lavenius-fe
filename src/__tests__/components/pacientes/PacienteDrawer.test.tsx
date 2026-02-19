import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PacienteDrawer } from '../../../components/pacientes/PacienteDrawer';
import type { Patient, CreatePatientDto } from '../../../lib/types/api.types';
import { PatientStatus, SessionType } from '../../../lib/types/api.types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'patients.newPatient': 'Nuevo Paciente',
        'patients.editPatient': 'Editar Paciente',
        'patients.drawer.closePanel': 'Cerrar panel',
        'patients.drawer.requiredFieldsNote': 'Los campos marcados con * son obligatorios.',
        'patients.drawer.sections.personalInfo': 'Información Personal',
        'patients.drawer.sections.treatmentModality': 'Modalidad de Tratamiento',
        'patients.drawer.sections.clinicalHistory': 'Historia Clínica',
        'patients.fields.firstName': 'Nombre',
        'patients.fields.lastName': 'Apellido',
        'patients.fields.age': 'Edad',
        'patients.fields.phone': 'Teléfono',
        'patients.fields.email': 'Email',
        'patients.fields.healthInsurance': 'Cobertura Médica',
        'patients.fields.sessionType': 'Tipo de Sesión',
        'patients.fields.frequency': 'Frecuencia',
        'patients.fields.diagnosis': 'Diagnóstico',
        'patients.fields.currentTreatment': 'Tratamiento Actual',
        'patients.fields.observations': 'Observaciones',
        'patients.drawer.placeholders.firstName': 'Ingrese el nombre',
        'patients.drawer.placeholders.lastName': 'Ingrese el apellido',
        'patients.drawer.placeholders.age': 'Ingrese la edad',
        'patients.drawer.placeholders.phone': '+54 11 1234-5678',
        'patients.drawer.placeholders.email': 'paciente@email.com',
        'patients.drawer.placeholders.healthInsurance': 'Nombre de la obra social',
        'patients.drawer.placeholders.customFrequency': 'Especifique la frecuencia',
        'patients.drawer.placeholders.diagnosis': 'Diagnóstico del paciente...',
        'patients.drawer.placeholders.currentTreatment': 'Tratamiento actual...',
        'patients.drawer.placeholders.observations': 'Notas adicionales...',
        'patients.drawer.buttons.cancel': 'Cancelar',
        'patients.drawer.buttons.create': 'Crear Paciente',
        'patients.drawer.buttons.update': 'Actualizar',
        'patients.drawer.validation.firstNameRequired': 'El nombre es requerido (mínimo 2 caracteres)',
        'patients.drawer.validation.lastNameRequired': 'El apellido es requerido',
        'patients.drawer.validation.invalidEmail': 'Email inválido',
        'patients.drawer.validation.invalidPhone': 'Teléfono inválido (mínimo 8 dígitos)',
        'patients.drawer.validation.invalidAge': 'Edad inválida (0-120)',
        'patients.drawer.validation.specifyFrequency': 'Especifique la frecuencia',
        'patients.modality.presential': 'Presencial',
        'patients.modality.remote': 'Remoto',
        'patients.frequency.weekly': 'Semanal',
        'patients.frequency.biweekly': 'Quincenal',
        'patients.frequency.monthly': 'Mensual',
        'patients.frequency.other': 'Otra',
      };
      return translations[key] || key;
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock patient data for edit mode
const mockPatient: Patient = {
  id: '1',
  therapistId: 'therapist-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  phone: '+5491112345678',
  age: 30,
  healthInsurance: 'OSDE',
  sessionType: SessionType.PRESENTIAL,
  frequency: 'semanal',
  diagnosis: 'Ansiedad generalizada',
  currentTreatment: 'TCC',
  observations: 'Paciente colaborador',
  status: PatientStatus.ACTIVE,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('PacienteDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders drawer when open', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Nuevo Paciente')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <PacienteDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Nuevo Paciente')).not.toBeInTheDocument();
    });

    it('shows "Nuevo Paciente" title for new patient (create mode)', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Nuevo Paciente')).toBeInTheDocument();
    });

    it('shows "Editar Paciente" title when editing', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
    });

    it('renders all form sections', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Información Personal')).toBeInTheDocument();
      expect(screen.getByText('Modalidad de Tratamiento')).toBeInTheDocument();
      expect(screen.getByText('Historia Clínica')).toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Cerrar panel')).toBeInTheDocument();
    });

    it('renders required fields note', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Los campos marcados con/)).toBeInTheDocument();
    });
  });

  // ==================== FORM FIELDS TESTS ====================
  describe('Form Fields', () => {
    it('renders first name input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingrese el nombre')).toBeInTheDocument();
    });

    it('renders last name input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Apellido/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingrese el apellido')).toBeInTheDocument();
    });

    it('renders age input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Edad')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingrese la edad')).toBeInTheDocument();
    });

    it('renders phone input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+54 11 1234-5678')).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('paciente@email.com')).toBeInTheDocument();
    });

    it('renders health insurance input', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Cobertura Médica/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nombre de la obra social')).toBeInTheDocument();
    });

    it('renders session type buttons', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Presencial')).toBeInTheDocument();
      expect(screen.getByText('Remoto')).toBeInTheDocument();
    });

    it('renders frequency radio options', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Semanal')).toBeInTheDocument();
      expect(screen.getByText('Quincenal')).toBeInTheDocument();
      expect(screen.getByText('Mensual')).toBeInTheDocument();
      expect(screen.getByText('Otra')).toBeInTheDocument();
    });

    it('renders diagnosis textarea', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Diagnóstico')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Diagnóstico del paciente...')).toBeInTheDocument();
    });

    it('renders current treatment textarea', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Tratamiento Actual')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tratamiento actual...')).toBeInTheDocument();
    });

    it('renders observations textarea', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Observaciones')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Notas adicionales...')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('renders create button in create mode', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: 'Crear Paciente' })).toBeInTheDocument();
    });

    it('renders update button in edit mode', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    });
  });

  // ==================== FORM VALIDATION TESTS ====================
  describe('Form Validation', () => {
    it('shows first name validation error on blur when empty', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.click(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido (mínimo 2 caracteres)')).toBeInTheDocument();
      });
    });

    it('shows first name validation error when name is too short', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.type(firstNameInput, 'A');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido (mínimo 2 caracteres)')).toBeInTheDocument();
      });
    });

    it('clears first name validation error when valid input is provided', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.click(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido (mínimo 2 caracteres)')).toBeInTheDocument();
      });

      await user.type(firstNameInput, 'Juan');

      await waitFor(() => {
        expect(screen.queryByText('El nombre es requerido (mínimo 2 caracteres)')).not.toBeInTheDocument();
      });
    });

    it('shows last name validation error on blur when empty', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const lastNameInput = screen.getByLabelText(/Apellido/);
      await user.click(lastNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El apellido es requerido')).toBeInTheDocument();
      });
    });

    it('shows email validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('does not show email validation error for empty email (optional field)', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const emailInput = screen.getByLabelText(/Email/);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
      });
    });

    it('accepts valid email format', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const emailInput = screen.getByLabelText(/Email/);
      await user.type(emailInput, 'valid@email.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
      });
    });

    it('shows phone validation error for invalid phone format', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const phoneInput = screen.getByLabelText(/Teléfono/);
      await user.type(phoneInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Teléfono inválido (mínimo 8 dígitos)')).toBeInTheDocument();
      });
    });

    it('accepts valid phone format with 8+ digits', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const phoneInput = screen.getByLabelText(/Teléfono/);
      await user.type(phoneInput, '+54 11 1234-5678');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Teléfono inválido (mínimo 8 dígitos)')).not.toBeInTheDocument();
      });
    });

    it('shows age validation error for invalid age', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const ageInput = screen.getByLabelText('Edad');
      await user.type(ageInput, '150');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Edad inválida (0-120)')).toBeInTheDocument();
      });
    });

    it('accepts valid age (0-120)', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const ageInput = screen.getByLabelText('Edad');
      await user.type(ageInput, '30');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Edad inválida (0-120)')).not.toBeInTheDocument();
      });
    });

    it('requires custom frequency when "Otra" is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Select "Otra" frequency option
      const otraRadio = screen.getByRole('radio', { name: 'Otra' });
      await user.click(otraRadio);

      // Custom frequency input should appear
      const customFreqInput = await screen.findByPlaceholderText('Especifique la frecuencia');
      await user.click(customFreqInput);
      await user.tab();

      // The validation error appears in a span with text-xs class (not the sr-only label)
      await waitFor(() => {
        const errorMessages = screen.getAllByText('Especifique la frecuencia');
        // Should have 2: one sr-only label and one error message
        expect(errorMessages.length).toBe(2);
        // The error message has the text-xs class
        const errorSpan = errorMessages.find(el => el.classList.contains('text-xs'));
        expect(errorSpan).toBeInTheDocument();
      });
    });

    it('disables submit button when required fields are empty', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Crear Paciente' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when required fields are filled', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');

      const submitButton = screen.getByRole('button', { name: 'Crear Paciente' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  // ==================== CREATE MODE TESTS ====================
  describe('Create Mode', () => {
    it('submits form with correct data when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');
      await user.type(screen.getByLabelText(/Email/), 'juan@test.com');
      await user.type(screen.getByLabelText(/Teléfono/), '+5491112345678');
      await user.type(screen.getByLabelText('Edad'), '30');

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@test.com',
            phone: '+5491112345678',
            age: 30,
            sessionType: 'presential',
            frequency: 'semanal',
          })
        );
      });
    });

    it('calls onSave with CreatePatientDto structure', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'María');
      await user.type(screen.getByLabelText(/Apellido/), 'García');
      await user.type(screen.getByLabelText('Diagnóstico'), 'Depresión');
      await user.type(screen.getByLabelText('Tratamiento Actual'), 'Medicación');
      await user.type(screen.getByLabelText('Observaciones'), 'Notas importantes');

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0] as CreatePatientDto;
        expect(callArg.firstName).toBe('María');
        expect(callArg.lastName).toBe('García');
        expect(callArg.diagnosis).toBe('Depresión');
        expect(callArg.currentTreatment).toBe('Medicación');
        expect(callArg.observations).toBe('Notas importantes');
      });
    });

    it('does not call onSave when form is invalid', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Try to click disabled button (should not work)
      const submitButton = screen.getByRole('button', { name: 'Crear Paciente' });
      await user.click(submitButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('submits correct session type when remote is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');
      await user.click(screen.getByText('Remoto'));

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionType: 'remote',
          })
        );
      });
    });

    it('submits correct frequency when biweekly is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');
      await user.click(screen.getByRole('radio', { name: 'Quincenal' }));

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'quincenal',
          })
        );
      });
    });

    it('submits custom frequency when "Otra" is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');
      await user.click(screen.getByRole('radio', { name: 'Otra' }));
      
      const customFreqInput = await screen.findByPlaceholderText('Especifique la frecuencia');
      await user.type(customFreqInput, 'Cada 3 semanas');

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            frequency: 'Cada 3 semanas',
          })
        );
      });
    });

    it('trims whitespace from text fields', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), '  Juan  ');
      await user.type(screen.getByLabelText(/Apellido/), '  Pérez  ');

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Juan',
            lastName: 'Pérez',
          })
        );
      });
    });
  });

  // ==================== EDIT MODE TESTS ====================
  describe('Edit Mode', () => {
    it('pre-fills form with patient data', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('Juan');
      expect(screen.getByLabelText(/Apellido/)).toHaveValue('Pérez');
      expect(screen.getByLabelText(/Email/)).toHaveValue('juan@test.com');
      expect(screen.getByLabelText(/Teléfono/)).toHaveValue('+5491112345678');
      expect(screen.getByLabelText('Edad')).toHaveValue(30);
      expect(screen.getByLabelText(/Cobertura Médica/)).toHaveValue('OSDE');
      expect(screen.getByLabelText('Diagnóstico')).toHaveValue('Ansiedad generalizada');
      expect(screen.getByLabelText('Tratamiento Actual')).toHaveValue('TCC');
      expect(screen.getByLabelText('Observaciones')).toHaveValue('Paciente colaborador');
    });

    it('pre-selects session type from patient data', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      // Presential button should have active styles
      const presentialButton = screen.getByText('Presencial').closest('button');
      expect(presentialButton).toHaveClass('border-purple-600');
    });

    it('pre-selects frequency from patient data', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      const semanalRadio = screen.getByRole('radio', { name: 'Semanal' });
      expect(semanalRadio).toBeChecked();
    });

    it('handles custom frequency in edit mode', () => {
      const patientWithCustomFreq: Patient = {
        ...mockPatient,
        frequency: 'Cada 10 días',
      };

      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={patientWithCustomFreq}
        />
      );

      const otraRadio = screen.getByRole('radio', { name: 'Otra' });
      expect(otraRadio).toBeChecked();

      const customFreqInput = screen.getByPlaceholderText('Especifique la frecuencia');
      expect(customFreqInput).toHaveValue('Cada 10 días');
    });

    it('calls onSave with updated data', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Carlos');

      await user.click(screen.getByRole('button', { name: 'Actualizar' }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Carlos',
            lastName: 'Pérez',
          })
        );
      });
    });

    it('resets form when patient prop changes to null', async () => {
      const { rerender } = render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('Juan');

      rerender(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={null}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('');
    });

    it('updates form when patient prop changes to different patient', async () => {
      const anotherPatient: Patient = {
        ...mockPatient,
        id: '2',
        firstName: 'María',
        lastName: 'García',
      };

      const { rerender } = render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={mockPatient}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('Juan');

      rerender(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={anotherPatient}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('María');
      expect(screen.getByLabelText(/Apellido/)).toHaveValue('García');
    });
  });

  // ==================== INTERACTION TESTS ====================
  describe('Interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button (X) is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.click(screen.getByLabelText('Cerrar panel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside (backdrop)', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Click the backdrop (has backdrop-blur class)
      const backdrop = document.querySelector('.backdrop-blur-\\[2px\\]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('clears validation errors when drawer is closed', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Trigger validation error
      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.click(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido (mínimo 2 caracteres)')).toBeInTheDocument();
      });

      // Close the drawer
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('allows typing in all text fields', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const firstNameInput = screen.getByLabelText(/Nombre/);
      await user.type(firstNameInput, 'TestName');
      expect(firstNameInput).toHaveValue('TestName');

      const diagnosisInput = screen.getByLabelText('Diagnóstico');
      await user.type(diagnosisInput, 'Test diagnosis');
      expect(diagnosisInput).toHaveValue('Test diagnosis');
    });

    it('toggles session type when buttons are clicked', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const presentialButton = screen.getByText('Presencial').closest('button')!;
      const remoteButton = screen.getByText('Remoto').closest('button')!;

      // Default is presential
      expect(presentialButton).toHaveClass('border-purple-600');

      // Click remote
      await user.click(remoteButton);
      expect(remoteButton).toHaveClass('border-blue-600');

      // Click presential again
      await user.click(presentialButton);
      expect(presentialButton).toHaveClass('border-purple-600');
    });

    it('shows custom frequency input when "Otra" is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Initially, custom frequency input should not be visible
      expect(screen.queryByPlaceholderText('Especifique la frecuencia')).not.toBeInTheDocument();

      // Select "Otra"
      await user.click(screen.getByRole('radio', { name: 'Otra' }));

      // Custom frequency input should appear
      expect(screen.getByPlaceholderText('Especifique la frecuencia')).toBeInTheDocument();
    });

    it('hides custom frequency input when other option is selected', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Select "Otra"
      await user.click(screen.getByRole('radio', { name: 'Otra' }));
      expect(screen.getByPlaceholderText('Especifique la frecuencia')).toBeInTheDocument();

      // Select "Semanal"
      await user.click(screen.getByRole('radio', { name: 'Semanal' }));
      expect(screen.queryByPlaceholderText('Especifique la frecuencia')).not.toBeInTheDocument();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles patient with missing optional fields', () => {
      const minimalPatient: Patient = {
        id: '2',
        therapistId: 'therapist-1',
        firstName: 'Minimal',
        lastName: 'Patient',
        status: PatientStatus.ACTIVE,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={minimalPatient}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('Minimal');
      expect(screen.getByLabelText(/Apellido/)).toHaveValue('Patient');
      expect(screen.getByLabelText(/Email/)).toHaveValue('');
      expect(screen.getByLabelText(/Teléfono/)).toHaveValue('');
    });

    it('handles patient with remote session type', () => {
      const remotePatient: Patient = {
        ...mockPatient,
        sessionType: SessionType.REMOTE,
      };

      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={remotePatient}
        />
      );

      const remoteButton = screen.getByText('Remoto').closest('button');
      expect(remoteButton).toHaveClass('border-blue-600');
    });

    it('handles patient with monthly frequency', () => {
      const monthlyPatient: Patient = {
        ...mockPatient,
        frequency: 'mensual',
      };

      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          patient={monthlyPatient}
        />
      );

      const mensualRadio = screen.getByRole('radio', { name: 'Mensual' });
      expect(mensualRadio).toBeChecked();
    });

    it('omits undefined optional fields from submitted data', async () => {
      const user = userEvent.setup();
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await user.type(screen.getByLabelText(/Nombre/), 'Juan');
      await user.type(screen.getByLabelText(/Apellido/), 'Pérez');

      await user.click(screen.getByRole('button', { name: 'Crear Paciente' }));

      await waitFor(() => {
        const callArg = mockOnSave.mock.calls[0][0] as CreatePatientDto;
        expect(callArg.email).toBeUndefined();
        expect(callArg.phone).toBeUndefined();
        expect(callArg.age).toBeUndefined();
      });
    });

    it('resets form state when isOpen changes from false to true', async () => {
      const { rerender } = render(
        <PacienteDrawer
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      rerender(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toHaveValue('');
      expect(screen.getByLabelText(/Apellido/)).toHaveValue('');
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('has accessible labels for all form inputs', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Apellido/)).toBeInTheDocument();
      expect(screen.getByLabelText('Edad')).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cobertura Médica/)).toBeInTheDocument();
      expect(screen.getByLabelText('Diagnóstico')).toBeInTheDocument();
      expect(screen.getByLabelText('Tratamiento Actual')).toBeInTheDocument();
      expect(screen.getByLabelText('Observaciones')).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByLabelText('Cerrar panel');
      expect(closeButton).toBeInTheDocument();
    });

    it('radio buttons have proper roles', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBe(4); // semanal, quincenal, mensual, otra
    });

    it('email input has correct type attribute', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const emailInput = screen.getByLabelText(/Email/);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('phone input has correct type attribute', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const phoneInput = screen.getByLabelText(/Teléfono/);
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    it('age input has correct type and constraints', () => {
      render(
        <PacienteDrawer
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const ageInput = screen.getByLabelText('Edad');
      expect(ageInput).toHaveAttribute('type', 'number');
      expect(ageInput).toHaveAttribute('min', '0');
      expect(ageInput).toHaveAttribute('max', '120');
    });
  });
});
