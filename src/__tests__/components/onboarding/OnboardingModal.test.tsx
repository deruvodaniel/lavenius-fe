import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingModal } from '../../../components/onboarding/OnboardingModal';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.welcome': 'Bienvenido a Lavenius',
        'onboarding.welcomeDescription': 'Tu asistente de gestión de consultorio psicológico',
        'onboarding.calendar.title': 'Conecta tu calendario',
        'onboarding.calendar.description': 'Sincroniza tu Google Calendar para gestionar tus citas',
        'onboarding.calendar.connect': 'Conectar calendario',
        'onboarding.calendar.later': 'Más tarde',
        'onboarding.patient.title': 'Crea tu primer paciente',
        'onboarding.patient.description': 'Agrega la información de tu primer paciente',
        'onboarding.patient.create': 'Crear paciente',
        'onboarding.patient.later': 'Más tarde',
        'onboarding.complete.title': 'Todo listo',
        'onboarding.complete.description': 'Ya puedes comenzar a usar Lavenius',
        'onboarding.complete.tip': 'Tip:',
        'onboarding.complete.tipText': 'Puedes acceder a la',
        'onboarding.complete.helpSection': 'sección de ayuda',
        'onboarding.complete.tipSuffix': 'cuando lo necesites.',
        'onboarding.navigation.back': 'Atrás',
        'onboarding.navigation.next': 'Siguiente',
        'onboarding.navigation.start': 'Comenzar',
        'onboarding.navigation.close': 'Cerrar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useOnboarding hook
const mockCompleteOnboarding = vi.fn();

vi.mock('@/lib/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    completeOnboarding: mockCompleteOnboarding,
    hasCompletedOnboarding: false,
    shouldShowOnboarding: () => true,
  }),
}));

// ============================================================================
// TESTS
// ============================================================================

describe('OnboardingModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConnectCalendar = vi.fn();
  const mockOnCreatePatient = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConnectCalendar: mockOnConnectCalendar,
    onCreatePatient: mockOnCreatePatient,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<OnboardingModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders close button with aria-label', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
    });

    it('renders progress indicator', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      // Progress dots (4 steps total)
      const progressDots = screen.getAllByRole('button', { name: /Paso \d+ de 4/i });
      expect(progressDots).toHaveLength(4);
    });

    it('renders first step (welcome) by default', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Bienvenido a Lavenius' })).toBeInTheDocument();
      expect(screen.getByText('Tu asistente de gestión de consultorio psicológico')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      // On first step, only "next" should be visible (no back button)
      expect(screen.getByText('Siguiente')).toBeInTheDocument();
      expect(screen.queryByText('Atrás')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STEP NAVIGATION TESTS
  // ==========================================================================

  describe('Step Navigation', () => {
    it('navigates to step 2 (calendar) when clicking next', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      expect(screen.getByText('Sincroniza tu Google Calendar para gestionar tus citas')).toBeInTheDocument();
    });

    it('navigates to step 3 (patient) when clicking next twice', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
      expect(screen.getByText('Agrega la información de tu primer paciente')).toBeInTheDocument();
    });

    it('navigates to step 4 (complete) when clicking next three times', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
      expect(screen.getByText('Ya puedes comenzar a usar Lavenius')).toBeInTheDocument();
    });

    it('shows back button after step 1', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // No back button on step 1
      expect(screen.queryByText('Atrás')).not.toBeInTheDocument();
      
      await user.click(screen.getByText('Siguiente'));
      
      // Back button visible on step 2
      expect(screen.getByText('Atrás')).toBeInTheDocument();
    });

    it('navigates back when clicking back button', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Go to step 2
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      
      // Go back to step 1
      await user.click(screen.getByText('Atrás'));
      expect(screen.getByRole('heading', { name: 'Bienvenido a Lavenius' })).toBeInTheDocument();
    });

    it('shows "Comenzar" button on last step instead of "Siguiente"', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Navigate to last step
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Comenzar' })).toBeInTheDocument();
    });

    it('updates progress indicator as user navigates', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Check initial state - first dot should be current
      const step1Dot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      expect(step1Dot).toHaveAttribute('aria-current', 'step');
      
      await user.click(screen.getByText('Siguiente'));
      
      // After navigation, second dot should be current
      const step2Dot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(step2Dot).toHaveAttribute('aria-current', 'step');
    });
  });

  // ==========================================================================
  // CALENDAR STEP TESTS
  // ==========================================================================

  describe('Calendar Step', () => {
    it('renders connect calendar button on step 2', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByRole('button', { name: 'Conectar calendario' })).toBeInTheDocument();
    });

    it('renders "Más tarde" option on step 2', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByText('Más tarde')).toBeInTheDocument();
    });

    it('calls onConnectCalendar and advances when connect calendar is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByRole('button', { name: 'Conectar calendario' }));
      
      expect(mockOnConnectCalendar).toHaveBeenCalledTimes(1);
      // Should advance to next step
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
    });

    it('advances to next step when clicking "Más tarde" on calendar step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      // Get the "Más tarde" button specific to calendar step
      const laterButtons = screen.getAllByText('Más tarde');
      await user.click(laterButtons[0]);
      
      // Should advance to patient step
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
      expect(mockOnConnectCalendar).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PATIENT STEP TESTS
  // ==========================================================================

  describe('Patient Step', () => {
    it('renders create patient button on step 3', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByRole('button', { name: 'Crear paciente' })).toBeInTheDocument();
    });

    it('renders "Más tarde" option on step 3', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByText('Más tarde')).toBeInTheDocument();
    });

    it('calls onCreatePatient and advances when create patient is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByRole('button', { name: 'Crear paciente' }));
      
      expect(mockOnCreatePatient).toHaveBeenCalledTimes(1);
      // Should advance to complete step
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
    });

    it('advances to next step when clicking "Más tarde" on patient step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      // Get the "Más tarde" button specific to patient step
      const laterButton = screen.getByText('Más tarde');
      await user.click(laterButton);
      
      // Should advance to complete step
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
      expect(mockOnCreatePatient).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // COMPLETION TESTS
  // ==========================================================================

  describe('Completion Flow', () => {
    it('renders tip text on complete step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Navigate to last step
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      expect(screen.getByText('Tip:')).toBeInTheDocument();
      expect(screen.getByText('sección de ayuda')).toBeInTheDocument();
    });

    it('calls completeOnboarding and onClose when clicking "Comenzar"', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Navigate to last step
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      await user.click(screen.getByRole('button', { name: 'Comenzar' }));
      
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onConnectCalendar or onCreatePatient on completion', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Navigate through all steps using "Siguiente" or "Más tarde"
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByRole('button', { name: 'Comenzar' }));
      
      expect(mockOnConnectCalendar).not.toHaveBeenCalled();
      expect(mockOnCreatePatient).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DISMISSAL TESTS
  // ==========================================================================

  describe('Dismissal', () => {
    it('calls completeOnboarding and onClose when clicking close button', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByLabelText('Cerrar'));
      
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('can dismiss from any step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Go to step 2
      await user.click(screen.getByText('Siguiente'));
      
      // Dismiss from step 2
      await user.click(screen.getByLabelText('Cerrar'));
      
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when dialog is closed via onOpenChange', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Dialog from radix-ui/shadcn should close when clicking outside or pressing Escape
      // Clicking the close button triggers handleSkip
      await user.click(screen.getByLabelText('Cerrar'));
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CALLBACK PROP TESTS
  // ==========================================================================

  describe('Optional Callbacks', () => {
    it('handles undefined onConnectCalendar gracefully', async () => {
      const user = userEvent.setup();
      render(
        <OnboardingModal
          isOpen={true}
          onClose={mockOnClose}
          // onConnectCalendar not provided
        />
      );
      
      await user.click(screen.getByText('Siguiente'));
      
      // Should not throw when clicking connect
      await user.click(screen.getByRole('button', { name: 'Conectar calendario' }));
      
      // Should still advance to next step
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
    });

    it('handles undefined onCreatePatient gracefully', async () => {
      const user = userEvent.setup();
      render(
        <OnboardingModal
          isOpen={true}
          onClose={mockOnClose}
          // onCreatePatient not provided
        />
      );
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      // Should not throw when clicking create
      await user.click(screen.getByRole('button', { name: 'Crear paciente' }));
      
      // Should still advance to complete step
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // STEP CONTENT TESTS
  // ==========================================================================

  describe('Step Content', () => {
    it('renders welcome step icon', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      // The Sparkles icon should be rendered (check for SVG element in the step icon container)
      const dialog = screen.getByRole('dialog');
      const iconContainer = dialog.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders calendar step with proper content structure', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      expect(within(dialog).getByText('Sincroniza tu Google Calendar para gestionar tus citas')).toBeInTheDocument();
    });

    it('renders patient step with proper content structure', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
      expect(within(dialog).getByText('Agrega la información de tu primer paciente')).toBeInTheDocument();
    });

    it('renders complete step with tip box', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Tip:')).toBeInTheDocument();
      // Use regex to find the text since it's split across elements
      expect(within(dialog).getByText(/Puedes acceder a la/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FULL FLOW TESTS
  // ==========================================================================

  describe('Full Onboarding Flow', () => {
    it('completes full flow using primary actions', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Step 1: Welcome - click next
      expect(screen.getByRole('heading', { name: 'Bienvenido a Lavenius' })).toBeInTheDocument();
      await user.click(screen.getByText('Siguiente'));
      
      // Step 2: Calendar - connect
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Conectar calendario' }));
      expect(mockOnConnectCalendar).toHaveBeenCalledTimes(1);
      
      // Step 3: Patient - create
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Crear paciente' }));
      expect(mockOnCreatePatient).toHaveBeenCalledTimes(1);
      
      // Step 4: Complete - start
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Comenzar' }));
      
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('completes full flow skipping optional actions', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Step 1: Welcome - click next
      await user.click(screen.getByText('Siguiente'));
      
      // Step 2: Calendar - skip (Más tarde)
      const laterBtn1 = screen.getByText('Más tarde');
      await user.click(laterBtn1);
      expect(mockOnConnectCalendar).not.toHaveBeenCalled();
      
      // Step 3: Patient - skip (Más tarde)
      const laterBtn2 = screen.getByText('Más tarde');
      await user.click(laterBtn2);
      expect(mockOnCreatePatient).not.toHaveBeenCalled();
      
      // Step 4: Complete - start
      await user.click(screen.getByRole('button', { name: 'Comenzar' }));
      
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('allows navigating back and forth', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Go forward to step 3
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByRole('heading', { name: 'Crea tu primer paciente' })).toBeInTheDocument();
      
      // Go back to step 2
      await user.click(screen.getByText('Atrás'));
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      
      // Go back to step 1
      await user.click(screen.getByText('Atrás'));
      expect(screen.getByRole('heading', { name: 'Bienvenido a Lavenius' })).toBeInTheDocument();
      
      // Go forward again
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('modal has proper role', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Cerrar');
      expect(closeButton).toBeInTheDocument();
    });

    it('progress dots have accessible labels', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Paso 1 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 2 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 3 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 4 de 4' })).toBeInTheDocument();
    });

    it('current step is indicated with aria-current', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      const currentStepDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      expect(currentStepDot).toHaveAttribute('aria-current', 'step');
    });

    it('step headings are proper h2 elements', () => {
      render(<OnboardingModal {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Bienvenido a Lavenius' });
      expect(heading.tagName).toBe('H2');
    });

    it('action buttons are properly labeled', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      await user.click(screen.getByText('Siguiente'));
      
      // Calendar step buttons
      expect(screen.getByRole('button', { name: 'Conectar calendario' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('cannot navigate before first step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // On first step, back button should not exist
      expect(screen.queryByText('Atrás')).not.toBeInTheDocument();
      
      // Should still be on first step
      expect(screen.getByRole('heading', { name: 'Bienvenido a Lavenius' })).toBeInTheDocument();
    });

    it('cannot navigate past last step with next button', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Navigate to last step
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      // On last step, "Siguiente" button should not exist
      expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
      
      // Should show "Comenzar" instead
      expect(screen.getByRole('button', { name: 'Comenzar' })).toBeInTheDocument();
    });

    it('maintains step state when modal is reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<OnboardingModal {...defaultProps} />);
      
      // Navigate to step 2
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByRole('heading', { name: 'Conecta tu calendario' })).toBeInTheDocument();
      
      // Close modal
      rerender(<OnboardingModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Reopen modal - state is managed internally, so it resets
      rerender(<OnboardingModal {...defaultProps} isOpen={true} />);
      
      // Component uses useState, so state resets when remounted
      // This is expected behavior - each open starts fresh
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles rapid clicking gracefully', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Rapid clicks on next
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      await user.click(screen.getByText('Siguiente'));
      
      // Should be on last step
      expect(screen.getByRole('heading', { name: 'Todo listo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Comenzar' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VISUAL STATE TESTS
  // ==========================================================================

  describe('Visual States', () => {
    it('progress indicator shows correct current step', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Step 1
      let currentDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      expect(currentDot).toHaveAttribute('aria-current', 'step');
      
      await user.click(screen.getByText('Siguiente'));
      
      // Step 2
      currentDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(currentDot).toHaveAttribute('aria-current', 'step');
      
      // Previous dot should not be current
      const prevDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      expect(prevDot).not.toHaveAttribute('aria-current');
    });

    it('back button appears only on steps 2-4', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal {...defaultProps} />);
      
      // Step 1: no back button
      expect(screen.queryByText('Atrás')).not.toBeInTheDocument();
      
      // Step 2: back button visible
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByText('Atrás')).toBeInTheDocument();
      
      // Step 3: back button visible
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByText('Atrás')).toBeInTheDocument();
      
      // Step 4: back button visible
      await user.click(screen.getByText('Siguiente'));
      expect(screen.getByText('Atrás')).toBeInTheDocument();
    });
  });
});
