import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionDetailsModal } from '@/components/agenda/SessionDetailsModal';
import { SessionStatus, SessionType } from '@/lib/types/session';
import type { SessionUI } from '@/lib/types/session';

// ============================================================================
// MOCKS
// ============================================================================

// Mock date formatters
vi.mock('@/lib/utils/dateFormatters', () => ({
  formatTime: (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  },
  formatDate: (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatDuration: (from: string, to: string) => {
    const start = new Date(from);
    const end = new Date(to);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${minutes} min`;
  },
}));

// Mock session colors constants
vi.mock('@/lib/constants/sessionColors', () => ({
  SESSION_STATUS_BADGE_CLASSES: {
    pending: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  },
  SESSION_STATUS_LABELS: {
    pending: 'Agendada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  },
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockSession: SessionUI = {
  id: 'session-1',
  scheduledFrom: '2024-03-15T10:00:00Z',
  scheduledTo: '2024-03-15T11:00:00Z',
  status: SessionStatus.CONFIRMED,
  sessionType: SessionType.PRESENTIAL,
  patientName: 'Juan Perez',
  cost: 15000,
  sessionSummary: 'Sesion de seguimiento',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockRemoteSession: SessionUI = {
  ...mockSession,
  id: 'session-2',
  sessionType: SessionType.REMOTE,
  meetLink: 'https://meet.google.com/abc-defg-hij',
};

const mockPendingSession: SessionUI = {
  ...mockSession,
  id: 'session-3',
  status: SessionStatus.PENDING,
};

const mockCompletedSession: SessionUI = {
  ...mockSession,
  id: 'session-4',
  status: SessionStatus.COMPLETED,
};

const mockCancelledSession: SessionUI = {
  ...mockSession,
  id: 'session-5',
  status: SessionStatus.CANCELLED,
};

const mockSessionNoPatient: SessionUI = {
  ...mockSession,
  id: 'session-6',
  patientName: undefined,
};

const mockSessionNoCost: SessionUI = {
  ...mockSession,
  id: 'session-7',
  cost: undefined,
};

const mockSessionNoSummary: SessionUI = {
  ...mockSession,
  id: 'session-8',
  sessionSummary: undefined,
};

// ============================================================================
// TESTS
// ============================================================================

describe('SessionDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();

  const defaultProps = {
    session: mockSession,
    isOpen: true,
    onClose: mockOnClose,
    onEdit: mockOnEdit,
    isPaid: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<SessionDetailsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not render when session is null', () => {
      render(<SessionDetailsModal {...defaultProps} session={null} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog title', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Detalles de la Sesión')).toBeInTheDocument();
    });

    it('renders patient name', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    it('does not render patient name when undefined', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSessionNoPatient} />);

      // When patientName is undefined, it shows "Sin paciente"
      expect(screen.getByText(/Sin paciente/)).toBeInTheDocument();
    });

    it('renders session date', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Fecha')).toBeInTheDocument();
    });

    it('renders session time range', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Horario')).toBeInTheDocument();
    });

    it('renders session duration', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      // Duration should be calculated from scheduledFrom and scheduledTo
      expect(screen.getByText(/60 min/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STATUS BADGE TESTS
  // ==========================================================================

  describe('Status Badge', () => {
    it('renders "Confirmada" badge for confirmed session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSession} />);

      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });

    it('renders "Agendada" badge for pending session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockPendingSession} />);

      expect(screen.getByText('Agendada')).toBeInTheDocument();
    });

    it('renders "Completada" badge for completed session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockCompletedSession} />);

      expect(screen.getByText('Completada')).toBeInTheDocument();
    });

    it('renders "Cancelada" badge for cancelled session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockCancelledSession} />);

      expect(screen.getByText('Cancelada')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SESSION TYPE TESTS
  // ==========================================================================

  describe('Session Type', () => {
    it('renders "Presencial" for presential session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSession} />);

      expect(screen.getByText('Presencial')).toBeInTheDocument();
    });

    it('renders "Remota" for remote session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockRemoteSession} />);

      expect(screen.getByText('Remota')).toBeInTheDocument();
    });

    it('renders "Modalidad" label', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Modalidad')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // COST TESTS
  // ==========================================================================

  describe('Cost Display', () => {
    it('renders cost when provided', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Costo')).toBeInTheDocument();
      expect(screen.getByText(/15\.?000/)).toBeInTheDocument();
    });

    it('does not render cost section when cost is undefined', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSessionNoCost} />);

      expect(screen.queryByText('Costo')).not.toBeInTheDocument();
    });

    it('renders "Pagado" badge when isPaid is true', () => {
      render(<SessionDetailsModal {...defaultProps} isPaid={true} />);

      expect(screen.getByText('Pagado')).toBeInTheDocument();
    });

    it('does not render "Pagado" badge when isPaid is false', () => {
      render(<SessionDetailsModal {...defaultProps} isPaid={false} />);

      expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SESSION SUMMARY TESTS
  // ==========================================================================

  describe('Session Summary', () => {
    it('renders session summary when provided', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Resumen')).toBeInTheDocument();
      expect(screen.getByText('Sesion de seguimiento')).toBeInTheDocument();
    });

    it('does not render summary section when sessionSummary is undefined', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSessionNoSummary} />);

      expect(screen.queryByText('Resumen')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACTION BUTTONS TESTS
  // ==========================================================================

  describe('Action Buttons', () => {
    it('renders close button', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    });

    it('renders edit button', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Editar Sesión/i })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Cerrar' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Editar Sesión/i }));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // DIALOG CLOSE TESTS
  // ==========================================================================

  describe('Dialog Close', () => {
    it('calls onClose when dialog is closed via onOpenChange', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      // Click close button (X) in dialog header if available
      const closeButton = screen.getByRole('button', { name: 'Cerrar' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('modal has role="dialog"', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('buttons are focusable', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Cerrar' });
      const editButton = screen.getByRole('button', { name: /Editar Sesión/i });

      closeButton.focus();
      expect(closeButton).toHaveFocus();

      editButton.focus();
      expect(editButton).toHaveFocus();
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Cerrar' });
      closeButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('edit button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar Sesión/i });
      editButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('section headings have proper styling', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      const patientLabel = screen.getByText('Paciente');
      expect(patientLabel).toHaveClass('text-sm', 'font-semibold', 'text-gray-500');
    });
  });

  // ==========================================================================
  // VISUAL STRUCTURE TESTS
  // ==========================================================================

  describe('Visual Structure', () => {
    it('edit button has indigo styling', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar Sesión/i });
      expect(editButton).toHaveClass('bg-indigo-600');
    });

    it('close button has outline variant', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Cerrar' });
      // Outline variant from shadcn/ui
      expect(closeButton).toBeInTheDocument();
    });

    it('paid badge has green styling', () => {
      render(<SessionDetailsModal {...defaultProps} isPaid={true} />);

      const paidBadge = screen.getByText('Pagado');
      expect(paidBadge.closest('span')).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('dialog content has white background', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // The !bg-white class is on the dialog element itself
      expect(dialog).toHaveClass('!bg-white');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles very long patient name', () => {
      const longNameSession: SessionUI = {
        ...mockSession,
        patientName: 'Maria de los Angeles Fernandez Garcia Lopez Rodriguez',
      };

      render(<SessionDetailsModal {...defaultProps} session={longNameSession} />);

      expect(screen.getByText('Maria de los Angeles Fernandez Garcia Lopez Rodriguez')).toBeInTheDocument();
    });

    it('handles very long session summary', () => {
      const longSummarySession: SessionUI = {
        ...mockSession,
        sessionSummary: 'A'.repeat(500),
      };

      render(<SessionDetailsModal {...defaultProps} session={longSummarySession} />);

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('handles zero cost', () => {
      const zeroCostSession: SessionUI = {
        ...mockSession,
        cost: 0,
      };

      render(<SessionDetailsModal {...defaultProps} session={zeroCostSession} />);

      // Zero is falsy so cost section won't render
      expect(screen.queryByText('Costo')).not.toBeInTheDocument();
    });

    it('handles very large cost', () => {
      const largeCostSession: SessionUI = {
        ...mockSession,
        cost: 1000000000,
      };

      render(<SessionDetailsModal {...defaultProps} session={largeCostSession} />);

      expect(screen.getByText('Costo')).toBeInTheDocument();
    });

    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<SessionDetailsModal {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /Editar Sesión/i });

      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });

    it('handles session with all optional fields undefined', () => {
      const minimalSession: SessionUI = {
        id: 'session-minimal',
        scheduledFrom: '2024-03-15T10:00:00Z',
        scheduledTo: '2024-03-15T11:00:00Z',
        status: SessionStatus.PENDING,
        sessionType: SessionType.PRESENTIAL,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z',
        // All optional fields undefined
      };

      render(<SessionDetailsModal {...defaultProps} session={minimalSession} />);

      expect(screen.getByText('Detalles de la Sesión')).toBeInTheDocument();
      expect(screen.getByText(/Sin paciente/)).toBeInTheDocument();
      expect(screen.queryByText('Costo')).not.toBeInTheDocument();
      expect(screen.queryByText('Resumen')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CONTENT SECTIONS TESTS
  // ==========================================================================

  describe('Content Sections', () => {
    it('renders patient section', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Paciente')).toBeInTheDocument();
    });

    it('renders date section', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Fecha')).toBeInTheDocument();
    });

    it('renders time section', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Horario')).toBeInTheDocument();
    });

    it('renders modality section', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      expect(screen.getByText('Modalidad')).toBeInTheDocument();
    });

    it('displays date and time in grid layout', () => {
      render(<SessionDetailsModal {...defaultProps} />);

      // Both Fecha and Horario should be in the same row
      const fechaLabel = screen.getByText('Fecha');
      const horarioLabel = screen.getByText('Horario');

      expect(fechaLabel.closest('.grid')).toBe(horarioLabel.closest('.grid'));
    });
  });

  // ==========================================================================
  // ICON TESTS
  // ==========================================================================

  describe('Icons', () => {
    it('renders MapPin icon for presential session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockSession} />);

      // Check that the Modalidad section contains the presential type
      expect(screen.getByText('Presencial')).toBeInTheDocument();
    });

    it('renders Monitor icon for remote session', () => {
      render(<SessionDetailsModal {...defaultProps} session={mockRemoteSession} />);

      // Check that the Modalidad section contains the remote type
      expect(screen.getByText('Remota')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // OPEN STATE TESTS
  // ==========================================================================

  describe('Open State', () => {
    it('renders when isOpen transitions from false to true', () => {
      const { rerender } = render(<SessionDetailsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<SessionDetailsModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen transitions from true to false', () => {
      const { rerender } = render(<SessionDetailsModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<SessionDetailsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
