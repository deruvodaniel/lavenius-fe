import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';

// ============================================================================
// TESTS
// ============================================================================

describe('OnboardingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the correct number of progress dots', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(4);
    });

    it('renders 3 dots when totalSteps is 3', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={3} />);
      
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(3);
    });

    it('renders 5 dots when totalSteps is 5', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={5} />);
      
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(5);
    });

    it('renders single dot when totalSteps is 1', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={1} />);
      
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(1);
    });

    it('renders nothing when totalSteps is 0', () => {
      const { container } = render(<OnboardingProgress currentStep={0} totalSteps={0} />);
      
      const dots = container.querySelectorAll('button');
      expect(dots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // PROGRESS INDICATOR TESTS
  // ==========================================================================

  describe('Progress Indication', () => {
    it('marks first step as current when currentStep is 0', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const firstDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      expect(firstDot).toHaveAttribute('aria-current', 'step');
    });

    it('marks second step as current when currentStep is 1', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={4} />);
      
      const secondDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(secondDot).toHaveAttribute('aria-current', 'step');
    });

    it('marks third step as current when currentStep is 2', () => {
      render(<OnboardingProgress currentStep={2} totalSteps={4} />);
      
      const thirdDot = screen.getByRole('button', { name: 'Paso 3 de 4' });
      expect(thirdDot).toHaveAttribute('aria-current', 'step');
    });

    it('marks last step as current when currentStep equals totalSteps - 1', () => {
      render(<OnboardingProgress currentStep={3} totalSteps={4} />);
      
      const lastDot = screen.getByRole('button', { name: 'Paso 4 de 4' });
      expect(lastDot).toHaveAttribute('aria-current', 'step');
    });

    it('only marks one dot as current at a time', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      const currentDots = dots.filter(dot => dot.getAttribute('aria-current') === 'step');
      
      expect(currentDots).toHaveLength(1);
    });

    it('previous steps do not have aria-current', () => {
      render(<OnboardingProgress currentStep={2} totalSteps={4} />);
      
      const firstDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      const secondDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      
      expect(firstDot).not.toHaveAttribute('aria-current');
      expect(secondDot).not.toHaveAttribute('aria-current');
    });

    it('future steps do not have aria-current', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const secondDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      const thirdDot = screen.getByRole('button', { name: 'Paso 3 de 4' });
      const fourthDot = screen.getByRole('button', { name: 'Paso 4 de 4' });
      
      expect(secondDot).not.toHaveAttribute('aria-current');
      expect(thirdDot).not.toHaveAttribute('aria-current');
      expect(fourthDot).not.toHaveAttribute('aria-current');
    });
  });

  // ==========================================================================
  // VISUAL STYLING TESTS
  // ==========================================================================

  describe('Visual Styling', () => {
    it('current step dot has expanded width', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={4} />);
      
      const currentDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(currentDot).toHaveClass('w-6');
    });

    it('current step dot has primary color', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={4} />);
      
      const currentDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(currentDot).toHaveClass('bg-indigo-600');
    });

    it('completed steps have secondary color', () => {
      render(<OnboardingProgress currentStep={2} totalSteps={4} />);
      
      const completedDot1 = screen.getByRole('button', { name: 'Paso 1 de 4' });
      const completedDot2 = screen.getByRole('button', { name: 'Paso 2 de 4' });
      
      expect(completedDot1).toHaveClass('bg-indigo-400');
      expect(completedDot2).toHaveClass('bg-indigo-400');
    });

    it('future steps have neutral color', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const futureDot = screen.getByRole('button', { name: 'Paso 2 de 4' });
      expect(futureDot).toHaveClass('bg-gray-300');
    });

    it('non-current dots have standard width', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={4} />);
      
      const prevDot = screen.getByRole('button', { name: 'Paso 1 de 4' });
      const nextDot = screen.getByRole('button', { name: 'Paso 3 de 4' });
      
      expect(prevDot).toHaveClass('w-2');
      expect(nextDot).toHaveClass('w-2');
    });

    it('all dots have rounded-full class', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      dots.forEach(dot => {
        expect(dot).toHaveClass('rounded-full');
      });
    });

    it('all dots have transition classes for smooth animation', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      dots.forEach(dot => {
        expect(dot).toHaveClass('transition-all');
        expect(dot).toHaveClass('duration-300');
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('all dots have aria-label with step information', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      expect(screen.getByRole('button', { name: 'Paso 1 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 2 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 3 de 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 4 de 4' })).toBeInTheDocument();
    });

    it('aria-label reflects correct step number', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={3} />);
      
      expect(screen.getByRole('button', { name: 'Paso 1 de 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 2 de 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Paso 3 de 3' })).toBeInTheDocument();
    });

    it('current step is indicated via aria-current="step"', () => {
      render(<OnboardingProgress currentStep={2} totalSteps={4} />);
      
      const currentDot = screen.getByRole('button', { name: 'Paso 3 de 4' });
      expect(currentDot).toHaveAttribute('aria-current', 'step');
    });

    it('non-current steps do not have aria-current attribute', () => {
      render(<OnboardingProgress currentStep={1} totalSteps={3} />);
      
      const firstDot = screen.getByRole('button', { name: 'Paso 1 de 3' });
      const thirdDot = screen.getByRole('button', { name: 'Paso 3 de 3' });
      
      expect(firstDot.getAttribute('aria-current')).toBeNull();
      expect(thirdDot.getAttribute('aria-current')).toBeNull();
    });

    it('dots are button elements for proper semantics', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      dots.forEach(dot => {
        expect(dot.tagName).toBe('BUTTON');
      });
    });

    it('buttons have type="button" to prevent form submission', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const dots = screen.getAllByRole('button');
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('type', 'button');
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles currentStep equal to totalSteps (last step)', () => {
      render(<OnboardingProgress currentStep={4} totalSteps={5} />);
      
      const lastDot = screen.getByRole('button', { name: 'Paso 5 de 5' });
      expect(lastDot).toHaveAttribute('aria-current', 'step');
    });

    it('handles large number of steps', () => {
      render(<OnboardingProgress currentStep={5} totalSteps={10} />);
      
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(10);
      
      const currentDot = screen.getByRole('button', { name: 'Paso 6 de 10' });
      expect(currentDot).toHaveAttribute('aria-current', 'step');
    });

    it('handles currentStep of 0 with single step', () => {
      render(<OnboardingProgress currentStep={0} totalSteps={1} />);
      
      const dot = screen.getByRole('button', { name: 'Paso 1 de 1' });
      expect(dot).toHaveAttribute('aria-current', 'step');
      expect(dot).toHaveClass('bg-indigo-600');
    });

    it('correctly shows all steps as completed except current on last step', () => {
      render(<OnboardingProgress currentStep={3} totalSteps={4} />);
      
      // Steps 1, 2, 3 should be completed (indigo-400)
      const step1 = screen.getByRole('button', { name: 'Paso 1 de 4' });
      const step2 = screen.getByRole('button', { name: 'Paso 2 de 4' });
      const step3 = screen.getByRole('button', { name: 'Paso 3 de 4' });
      const step4 = screen.getByRole('button', { name: 'Paso 4 de 4' });
      
      expect(step1).toHaveClass('bg-indigo-400');
      expect(step2).toHaveClass('bg-indigo-400');
      expect(step3).toHaveClass('bg-indigo-400');
      expect(step4).toHaveClass('bg-indigo-600'); // Current step
    });
  });

  // ==========================================================================
  // LAYOUT TESTS
  // ==========================================================================

  describe('Layout', () => {
    it('container has flex layout with centered items', () => {
      const { container } = render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('container has gap between dots', () => {
      const { container } = render(<OnboardingProgress currentStep={0} totalSteps={4} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('gap-2');
    });
  });
});
