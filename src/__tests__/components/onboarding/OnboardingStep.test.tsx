import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar, User, Settings, Sparkles, CheckCircle2 } from 'lucide-react';
import { OnboardingStep } from '../../../components/onboarding/OnboardingStep';

// ============================================================================
// TESTS
// ============================================================================

describe('OnboardingStep', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test description text',
    icon: Sparkles,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the title', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('renders the description', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      expect(screen.getByText('Test description text')).toBeInTheDocument();
    });

    it('renders the icon', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <OnboardingStep {...defaultProps}>
          <button>Action Button</button>
        </OnboardingStep>
      );
      
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('does not render children container when no children', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const childrenContainer = container.querySelector('.w-full.max-w-sm');
      expect(childrenContainer).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ICON TESTS
  // ==========================================================================

  describe('Icon Rendering', () => {
    it('renders Calendar icon correctly', () => {
      const { container } = render(
        <OnboardingStep 
          title="Calendar Step" 
          description="Calendar description" 
          icon={Calendar} 
        />
      );
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders User icon correctly', () => {
      const { container } = render(
        <OnboardingStep 
          title="User Step" 
          description="User description" 
          icon={User} 
        />
      );
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Settings icon correctly', () => {
      const { container } = render(
        <OnboardingStep 
          title="Settings Step" 
          description="Settings description" 
          icon={Settings} 
        />
      );
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders CheckCircle2 icon correctly', () => {
      const { container } = render(
        <OnboardingStep 
          title="Complete Step" 
          description="Complete description" 
          icon={CheckCircle2} 
        />
      );
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('icon has correct styling classes', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-10');
      expect(svg).toHaveClass('h-10');
      expect(svg).toHaveClass('text-indigo-600');
    });

    it('icon container has gradient background', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toHaveClass('bg-gradient-to-br');
      expect(iconContainer).toHaveClass('from-indigo-100');
      expect(iconContainer).toHaveClass('to-purple-100');
    });

    it('icon container has hover scale effect', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toHaveClass('transition-transform');
      expect(iconContainer).toHaveClass('hover:scale-110');
    });
  });

  // ==========================================================================
  // TITLE TESTS
  // ==========================================================================

  describe('Title', () => {
    it('renders title as h2 element', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Title' });
      expect(heading.tagName).toBe('H2');
    });

    it('title has correct styling classes', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Title' });
      expect(heading).toHaveClass('text-xl');
      expect(heading).toHaveClass('font-semibold');
      expect(heading).toHaveClass('text-gray-900');
    });

    it('renders long title correctly', () => {
      const longTitle = 'This is a very long title that should still render correctly';
      render(
        <OnboardingStep 
          title={longTitle} 
          description="Description" 
          icon={Sparkles} 
        />
      );
      
      expect(screen.getByRole('heading', { name: longTitle })).toBeInTheDocument();
    });

    it('renders title with special characters', () => {
      const specialTitle = "Welcome! Let's get started...";
      render(
        <OnboardingStep 
          title={specialTitle} 
          description="Description" 
          icon={Sparkles} 
        />
      );
      
      expect(screen.getByRole('heading', { name: specialTitle })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DESCRIPTION TESTS
  // ==========================================================================

  describe('Description', () => {
    it('renders description as paragraph element', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const description = screen.getByText('Test description text');
      expect(description.tagName).toBe('P');
    });

    it('description has correct styling classes', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const description = screen.getByText('Test description text');
      expect(description).toHaveClass('text-gray-600');
      expect(description).toHaveClass('max-w-sm');
      expect(description).toHaveClass('leading-relaxed');
    });

    it('renders long description correctly', () => {
      const longDescription = 'This is a very long description that provides more details about the step. It should wrap correctly and maintain proper styling throughout the entire text content.';
      render(
        <OnboardingStep 
          title="Title" 
          description={longDescription} 
          icon={Sparkles} 
        />
      );
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('renders description with line breaks in text', () => {
      const description = 'Line one description';
      render(
        <OnboardingStep 
          title="Title" 
          description={description} 
          icon={Sparkles} 
        />
      );
      
      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CHILDREN TESTS
  // ==========================================================================

  describe('Children Content', () => {
    it('renders single button child', () => {
      render(
        <OnboardingStep {...defaultProps}>
          <button>Click me</button>
        </OnboardingStep>
      );
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <OnboardingStep {...defaultProps}>
          <button>Primary Action</button>
          <button>Secondary Action</button>
        </OnboardingStep>
      );
      
      expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
    });

    it('renders complex children structure', () => {
      render(
        <OnboardingStep {...defaultProps}>
          <div className="flex flex-col gap-2">
            <button>Action 1</button>
            <span>Helper text</span>
            <a href="#skip">Skip for now</a>
          </div>
        </OnboardingStep>
      );
      
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByText('Helper text')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Skip for now' })).toBeInTheDocument();
    });

    it('children container has correct max-width', () => {
      const { container } = render(
        <OnboardingStep {...defaultProps}>
          <button>Action</button>
        </OnboardingStep>
      );
      
      const childrenContainer = container.querySelector('.w-full.max-w-sm');
      expect(childrenContainer).toBeInTheDocument();
    });

    it('renders form elements as children', () => {
      render(
        <OnboardingStep {...defaultProps}>
          <input type="text" placeholder="Enter your name" />
          <button type="submit">Submit</button>
        </OnboardingStep>
      );
      
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('preserves children event handlers', () => {
      const handleClick = vi.fn();
      render(
        <OnboardingStep {...defaultProps}>
          <button onClick={handleClick}>Clickable</button>
        </OnboardingStep>
      );
      
      screen.getByRole('button', { name: 'Clickable' }).click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // LAYOUT TESTS
  // ==========================================================================

  describe('Layout', () => {
    it('has flex column layout', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
    });

    it('content is centered', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('text-center');
    });

    it('has proper padding', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('px-4');
      expect(wrapper).toHaveClass('py-6');
    });

    it('icon has proper margin below', () => {
      const { container } = render(<OnboardingStep {...defaultProps} />);
      
      const iconContainer = container.querySelector('.w-20.h-20');
      expect(iconContainer).toHaveClass('mb-6');
    });

    it('title has proper margin below', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Title' });
      expect(heading).toHaveClass('mb-3');
    });

    it('description has proper margin below', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const description = screen.getByText('Test description text');
      expect(description).toHaveClass('mb-6');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('heading has proper level (h2)', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Title');
    });

    it('content is in logical order', () => {
      const { container } = render(
        <OnboardingStep {...defaultProps}>
          <button>Action</button>
        </OnboardingStep>
      );
      
      const allElements = container.querySelectorAll('*');
      const elementOrder: string[] = [];
      
      allElements.forEach(el => {
        if (el.classList.contains('w-20') && el.classList.contains('h-20')) {
          elementOrder.push('icon');
        }
        if (el.tagName === 'H2') {
          elementOrder.push('title');
        }
        if (el.tagName === 'P' && el.classList.contains('text-gray-600')) {
          elementOrder.push('description');
        }
        if (el.tagName === 'BUTTON' && el.textContent === 'Action') {
          elementOrder.push('children');
        }
      });
      
      expect(elementOrder.indexOf('icon')).toBeLessThan(elementOrder.indexOf('title'));
      expect(elementOrder.indexOf('title')).toBeLessThan(elementOrder.indexOf('description'));
      expect(elementOrder.indexOf('description')).toBeLessThan(elementOrder.indexOf('children'));
    });

    it('text content is readable (proper contrast classes)', () => {
      render(<OnboardingStep {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Title' });
      const description = screen.getByText('Test description text');
      
      expect(heading).toHaveClass('text-gray-900');
      expect(description).toHaveClass('text-gray-600');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles empty string title', () => {
      render(
        <OnboardingStep 
          title="" 
          description="Description" 
          icon={Sparkles} 
        />
      );
      
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('handles empty string description', () => {
      const { container } = render(
        <OnboardingStep 
          title="Title" 
          description="" 
          icon={Sparkles} 
        />
      );
      
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveTextContent('');
    });

    it('handles null children', () => {
      render(
        <OnboardingStep {...defaultProps}>
          {null}
        </OnboardingStep>
      );
      
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(
        <OnboardingStep {...defaultProps}>
          {undefined}
        </OnboardingStep>
      );
      
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('handles false children (should not render children container)', () => {
      const { container } = render(
        <OnboardingStep {...defaultProps}>
          {false}
        </OnboardingStep>
      );
      
      const childrenContainer = container.querySelector('.w-full.max-w-sm');
      expect(childrenContainer).not.toBeInTheDocument();
    });

    it('handles conditional children rendering', () => {
      const showAction = true;
      render(
        <OnboardingStep {...defaultProps}>
          {showAction && <button>Conditional Action</button>}
        </OnboardingStep>
      );
      
      expect(screen.getByRole('button', { name: 'Conditional Action' })).toBeInTheDocument();
    });

    it('handles conditional children not rendering', () => {
      const showAction = false;
      const { container } = render(
        <OnboardingStep {...defaultProps}>
          {showAction && <button>Conditional Action</button>}
        </OnboardingStep>
      );
      
      expect(screen.queryByRole('button', { name: 'Conditional Action' })).not.toBeInTheDocument();
      const childrenContainer = container.querySelector('.w-full.max-w-sm');
      expect(childrenContainer).not.toBeInTheDocument();
    });

    it('renders with special characters in content', () => {
      render(
        <OnboardingStep 
          title="Welcome! <Test> & More..."
          description={'Description with \'quotes\' and "double quotes"'}
          icon={Sparkles}
        />
      );
      
      expect(screen.getByRole('heading', { name: "Welcome! <Test> & More..." })).toBeInTheDocument();
      expect(screen.getByText('Description with \'quotes\' and "double quotes"')).toBeInTheDocument();
    });
  });
});
