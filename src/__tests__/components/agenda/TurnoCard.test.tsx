import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TurnoCard } from '@/components/agenda/TurnoCard';
import { SessionStatus, SessionType } from '@/lib/types/session';
import type { SessionResponse } from '@/lib/types/session';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'agenda.status.scheduled': 'Programada',
        'agenda.status.confirmed': 'Confirmada',
        'agenda.status.completed': 'Completada',
        'agenda.status.cancelled': 'Cancelada',
        'agenda.status.unknown': 'Desconocido',
        'agenda.sessionTypes.remote': 'Remota',
        'agenda.sessionTypes.presential': 'Presencial',
        'agenda.card.actions': 'Acciones',
        'agenda.card.viewFile': 'Ver ficha',
        'agenda.card.editAppointment': 'Editar cita',
        'agenda.card.sendWhatsApp': 'Enviar WhatsApp',
        'agenda.card.deleteAppointment': 'Eliminar cita',
        'agenda.card.paid': 'Pagado',
        'agenda.card.riskMedium': 'Riesgo medio',
        'agenda.card.riskHigh': 'Riesgo alto',
        'agenda.details.noPatient': 'Sin paciente',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock session data
const mockSession: SessionResponse = {
  id: 'session-1',
  scheduledFrom: '2024-03-15T10:00:00Z',
  scheduledTo: '2024-03-15T11:00:00Z',
  status: SessionStatus.CONFIRMED,
  sessionType: SessionType.PRESENTIAL,
  cost: 15000,
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockPatient = {
  id: 'patient-1',
  nombre: 'Juan Pérez',
  telefono: '+5491112345678',
  riskLevel: 'low' as const,
};

const mockPatientMediumRisk = {
  ...mockPatient,
  id: 'patient-2',
  nombre: 'María García',
  riskLevel: 'medium' as const,
};

const mockPatientHighRisk = {
  ...mockPatient,
  id: 'patient-3',
  nombre: 'Carlos López',
  riskLevel: 'high' as const,
};

describe('TurnoCard', () => {
  const defaultProps = {
    session: mockSession,
    patient: mockPatient,
    hora: '10:00',
    onPatientClick: vi.fn(),
    onEditClick: vi.fn(),
    onDeleteClick: vi.fn(),
    onWhatsAppClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== RENDERING TESTS ====================
  describe('Rendering', () => {
    it('renders patient name', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('renders time', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('renders patient initials in avatar', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('renders status label', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });

    it('renders session type for presential', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByText('Presencial')).toBeInTheDocument();
    });

    it('renders session type for remote', () => {
      const remoteSession: SessionResponse = {
        ...mockSession,
        sessionType: SessionType.REMOTE,
      };

      render(<TurnoCard {...defaultProps} session={remoteSession} />);

      expect(screen.getByText('Remota')).toBeInTheDocument();
    });

    it('renders actions menu button', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
    });

    it('renders "Sin paciente" when patient is undefined', () => {
      render(<TurnoCard {...defaultProps} patient={undefined} />);

      expect(screen.getByText('Sin paciente')).toBeInTheDocument();
    });

    it('renders "?" for initials when patient is undefined', () => {
      render(<TurnoCard {...defaultProps} patient={undefined} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  // ==================== STATUS RENDERING TESTS ====================
  describe('Status Rendering', () => {
    it('renders pending status', () => {
      const pendingSession: SessionResponse = {
        ...mockSession,
        status: SessionStatus.PENDING,
      };

      render(<TurnoCard {...defaultProps} session={pendingSession} />);

      expect(screen.getByText('Programada')).toBeInTheDocument();
    });

    it('renders confirmed status', () => {
      const confirmedSession: SessionResponse = {
        ...mockSession,
        status: SessionStatus.CONFIRMED,
      };

      render(<TurnoCard {...defaultProps} session={confirmedSession} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });

    it('renders completed status', () => {
      const completedSession: SessionResponse = {
        ...mockSession,
        status: SessionStatus.COMPLETED,
      };

      render(<TurnoCard {...defaultProps} session={completedSession} />);

      expect(screen.getByText('Completada')).toBeInTheDocument();
    });

    it('renders cancelled status', () => {
      const cancelledSession: SessionResponse = {
        ...mockSession,
        status: SessionStatus.CANCELLED,
      };

      render(<TurnoCard {...defaultProps} session={cancelledSession} />);

      expect(screen.getByText('Cancelada')).toBeInTheDocument();
    });
  });

  // ==================== PAID INDICATOR TESTS ====================
  describe('Paid Indicator', () => {
    it('shows paid indicator when isPaid is true', () => {
      render(<TurnoCard {...defaultProps} isPaid={true} />);

      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    it('does not show paid indicator when isPaid is false', () => {
      render(<TurnoCard {...defaultProps} isPaid={false} />);

      expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    });

    it('does not show paid indicator by default', () => {
      render(<TurnoCard {...defaultProps} />);

      expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    });

    it('paid indicator has correct styling', () => {
      render(<TurnoCard {...defaultProps} isPaid={true} />);

      const paidBadge = screen.getByText('Pagado');
      expect(paidBadge).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  // ==================== RISK INDICATOR TESTS ====================
  describe('Risk Indicator', () => {
    it('does not show risk indicator for low risk', () => {
      render(<TurnoCard {...defaultProps} patient={mockPatient} />);

      // Low risk should not display any indicator
      expect(screen.queryByTitle('Riesgo medio')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Riesgo alto')).not.toBeInTheDocument();
    });

    it('shows risk indicator for medium risk', () => {
      render(<TurnoCard {...defaultProps} patient={mockPatientMediumRisk} />);

      expect(screen.getByTitle('Riesgo medio')).toBeInTheDocument();
    });

    it('shows risk indicator for high risk', () => {
      render(<TurnoCard {...defaultProps} patient={mockPatientHighRisk} />);

      expect(screen.getByTitle('Riesgo alto')).toBeInTheDocument();
    });

    it('medium risk indicator has correct styling', () => {
      render(<TurnoCard {...defaultProps} patient={mockPatientMediumRisk} />);

      const riskIndicator = screen.getByTitle('Riesgo medio');
      expect(riskIndicator).toHaveClass('text-yellow-600', 'bg-yellow-50');
    });

    it('high risk indicator has correct styling', () => {
      render(<TurnoCard {...defaultProps} patient={mockPatientHighRisk} />);

      const riskIndicator = screen.getByTitle('Riesgo alto');
      expect(riskIndicator).toHaveClass('text-red-600', 'bg-red-50');
    });
  });

  // ==================== COMPACT VIEW TESTS ====================
  describe('Compact View', () => {
    it('hides status and modality text in compact view', () => {
      render(<TurnoCard {...defaultProps} isCompactView={true} />);

      // In compact view, these are hidden
      expect(screen.queryByText('Confirmada')).not.toBeInTheDocument();
      expect(screen.queryByText('Presencial')).not.toBeInTheDocument();
    });

    it('shows modality icon in compact view', () => {
      render(<TurnoCard {...defaultProps} isCompactView={true} />);

      // Compact view shows modality icon with title
      const modalityIcon = screen.getByTitle('Presencial');
      expect(modalityIcon).toBeInTheDocument();
    });

    it('shows remote icon in compact view for remote session', () => {
      const remoteSession: SessionResponse = {
        ...mockSession,
        sessionType: SessionType.REMOTE,
      };

      render(<TurnoCard {...defaultProps} session={remoteSession} isCompactView={true} />);

      const modalityIcon = screen.getByTitle('Remota');
      expect(modalityIcon).toBeInTheDocument();
    });

    it('shows status and modality text in normal view', () => {
      render(<TurnoCard {...defaultProps} isCompactView={false} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
      expect(screen.getByText('Presencial')).toBeInTheDocument();
    });
  });

  // ==================== PATIENT CLICK INTERACTION TESTS ====================
  describe('Patient Click Interaction', () => {
    it('calls onPatientClick when patient name is clicked', async () => {
      const onPatientClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onPatientClick={onPatientClick} />);

      await user.click(screen.getByText('Juan Pérez'));

      expect(onPatientClick).toHaveBeenCalledTimes(1);
      expect(onPatientClick).toHaveBeenCalledWith('patient-1');
    });

    it('does not call onPatientClick when patient is undefined', async () => {
      const onPatientClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} patient={undefined} onPatientClick={onPatientClick} />);

      await user.click(screen.getByText('Sin paciente'));

      expect(onPatientClick).not.toHaveBeenCalled();
    });

    it('patient button is disabled when patient is undefined', () => {
      render(<TurnoCard {...defaultProps} patient={undefined} />);

      const patientButton = screen.getByText('Sin paciente').closest('button');
      expect(patientButton).toBeDisabled();
    });
  });

  // ==================== DROPDOWN MENU TESTS ====================
  describe('Dropdown Menu', () => {
    it('opens dropdown menu when actions button is clicked', async () => {
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));

      await waitFor(() => {
        expect(screen.getByText('Ver ficha')).toBeInTheDocument();
        expect(screen.getByText('Editar cita')).toBeInTheDocument();
        expect(screen.getByText('Enviar WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Eliminar cita')).toBeInTheDocument();
      });
    });

    it('calls onPatientClick when "Ver ficha" is clicked', async () => {
      const onPatientClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onPatientClick={onPatientClick} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Ver ficha')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Ver ficha'));

      expect(onPatientClick).toHaveBeenCalledWith('patient-1');
    });

    it('calls onEditClick when "Editar cita" is clicked', async () => {
      const onEditClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onEditClick={onEditClick} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Editar cita')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Editar cita'));

      expect(onEditClick).toHaveBeenCalledTimes(1);
    });

    it('calls onWhatsAppClick when "Enviar WhatsApp" is clicked', async () => {
      const onWhatsAppClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onWhatsAppClick={onWhatsAppClick} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Enviar WhatsApp')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Enviar WhatsApp'));

      expect(onWhatsAppClick).toHaveBeenCalledTimes(1);
    });

    it('calls onDeleteClick when "Eliminar cita" is clicked', async () => {
      const onDeleteClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onDeleteClick={onDeleteClick} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Eliminar cita')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Eliminar cita'));

      expect(onDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('disables "Ver ficha" when patient is undefined', async () => {
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} patient={undefined} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Ver ficha')).toBeInTheDocument();
      });

      const viewFileItem = screen.getByText('Ver ficha').closest('[role="menuitem"]');
      expect(viewFileItem).toHaveAttribute('data-disabled');
    });

    it('disables "Enviar WhatsApp" when patient is undefined', async () => {
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} patient={undefined} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Enviar WhatsApp')).toBeInTheDocument();
      });

      const whatsappItem = screen.getByText('Enviar WhatsApp').closest('[role="menuitem"]');
      expect(whatsappItem).toHaveAttribute('data-disabled');
    });

    it('"Eliminar cita" has destructive styling', async () => {
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Acciones' }));
      await waitFor(() => {
        expect(screen.getByText('Eliminar cita')).toBeInTheDocument();
      });

      const deleteItem = screen.getByText('Eliminar cita').closest('[role="menuitem"]');
      expect(deleteItem).toHaveClass('text-red-600');
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  describe('Accessibility', () => {
    it('actions button has aria-label', () => {
      render(<TurnoCard {...defaultProps} />);

      const actionsButton = screen.getByRole('button', { name: 'Acciones' });
      expect(actionsButton).toHaveAttribute('aria-label', 'Acciones');
    });

    it('patient button is keyboard accessible', async () => {
      const onPatientClick = vi.fn();
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} onPatientClick={onPatientClick} />);

      const patientButton = screen.getByText('Juan Pérez').closest('button');
      patientButton?.focus();

      await user.keyboard('{Enter}');

      expect(onPatientClick).toHaveBeenCalledWith('patient-1');
    });

    it('dropdown menu items are keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<TurnoCard {...defaultProps} />);

      const actionsButton = screen.getByRole('button', { name: 'Acciones' });
      actionsButton.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Ver ficha')).toBeInTheDocument();
      });

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
    });

    it('card has proper visual structure', () => {
      render(<TurnoCard {...defaultProps} />);

      const card = screen.getByText('Juan Pérez').closest('.border-l-4');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'hover:shadow-md');
    });
  });

  // ==================== INITIALS TESTS ====================
  describe('Patient Initials', () => {
    it('generates correct initials for two-word name', () => {
      render(<TurnoCard {...defaultProps} patient={{ ...mockPatient, nombre: 'Juan Pérez' }} />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('generates correct initials for three-word name', () => {
      render(<TurnoCard {...defaultProps} patient={{ ...mockPatient, nombre: 'Juan Pablo García' }} />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('generates correct initials for single-word name', () => {
      render(<TurnoCard {...defaultProps} patient={{ ...mockPatient, nombre: 'María' }} />);

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('generates uppercase initials', () => {
      render(<TurnoCard {...defaultProps} patient={{ ...mockPatient, nombre: 'juan pérez' }} />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('handles session with undefined sessionType gracefully', () => {
      const sessionNoType: SessionResponse = {
        ...mockSession,
        sessionType: undefined as unknown as SessionType,
      };

      // Should not crash
      render(<TurnoCard {...defaultProps} session={sessionNoType} />);
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('handles patient with no phone', () => {
      const patientNoPhone = {
        id: 'patient-1',
        nombre: 'Juan Pérez',
      };

      render(<TurnoCard {...defaultProps} patient={patientNoPhone} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('renders correctly with all indicators shown', () => {
      render(
        <TurnoCard
          {...defaultProps}
          patient={mockPatientHighRisk}
          isPaid={true}
        />
      );

      expect(screen.getByTitle('Riesgo alto')).toBeInTheDocument();
      expect(screen.getByText('Pagado')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('handles long patient name', () => {
      const longNamePatient = {
        ...mockPatient,
        nombre: 'María de los Angeles Fernández García López',
      };

      render(<TurnoCard {...defaultProps} patient={longNamePatient} />);

      expect(screen.getByText('María de los Angeles Fernández García López')).toBeInTheDocument();
    });

    it('handles empty patient name', () => {
      const emptyNamePatient = {
        ...mockPatient,
        nombre: '',
      };

      render(<TurnoCard {...defaultProps} patient={emptyNamePatient} />);

      // Should fall back to "Sin paciente" text and not crash
      expect(screen.getByText('Sin paciente')).toBeInTheDocument();
    });
  });

  // ==================== VISUAL STRUCTURE TESTS ====================
  describe('Visual Structure', () => {
    it('has left border with status color', () => {
      render(<TurnoCard {...defaultProps} />);

      const card = screen.getByText('Juan Pérez').closest('.border-l-4');
      expect(card).toBeInTheDocument();
    });

    it('has hover shadow transition', () => {
      render(<TurnoCard {...defaultProps} />);

      const card = screen.getByText('Juan Pérez').closest('.transition-shadow');
      expect(card).toBeInTheDocument();
    });

    it('avatar has correct styling', () => {
      render(<TurnoCard {...defaultProps} />);

      const avatar = screen.getByText('JP').closest('.bg-indigo-100');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('rounded-full', 'w-8', 'h-8');
    });

    it('time section has correct styling', () => {
      render(<TurnoCard {...defaultProps} />);

      const timeSection = screen.getByText('10:00').closest('.text-gray-600');
      expect(timeSection).toBeInTheDocument();
    });
  });
});
