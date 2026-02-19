import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sparkles, AlertTriangle, Info } from 'lucide-react';
import { TipBanner } from '../../../components/onboarding/TipBanner';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.tip.dismiss': 'Descartar tip',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useOnboarding hook
const mockDismissTip = vi.fn();
const mockShouldShowTip = vi.fn();

vi.mock('@/lib/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    shouldShowTip: mockShouldShowTip,
    dismissTip: mockDismissTip,
  }),
}));

// ============================================================================
// TESTS
// ============================================================================

describe('TipBanner', () => {
  const defaultProps = {
    tipId: 'test-tip',
    title: 'Test Tip Title',
    description: 'This is a test tip description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShouldShowTip.mockReturnValue(true);
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders when shouldShowTip returns true', () => {
      mockShouldShowTip.mockReturnValue(true);
      render(<TipBanner {...defaultProps} />);
      
      expect(screen.getByText('Test Tip Title')).toBeInTheDocument();
      expect(screen.getByText('This is a test tip description')).toBeInTheDocument();
    });

    it('does not render when shouldShowTip returns false', () => {
      mockShouldShowTip.mockReturnValue(false);
      render(<TipBanner {...defaultProps} />);
      
      expect(screen.queryByText('Test Tip Title')).not.toBeInTheDocument();
      expect(screen.queryByText('This is a test tip description')).not.toBeInTheDocument();
    });

    it('calls shouldShowTip with correct tipId', () => {
      render(<TipBanner {...defaultProps} tipId="custom-tip-id" />);
      
      expect(mockShouldShowTip).toHaveBeenCalledWith('custom-tip-id');
    });

    it('renders title in h4 element', () => {
      render(<TipBanner {...defaultProps} />);
      
      const title = screen.getByText('Test Tip Title');
      expect(title.tagName).toBe('H4');
    });

    it('renders description in p element', () => {
      render(<TipBanner {...defaultProps} />);
      
      const description = screen.getByText('This is a test tip description');
      expect(description.tagName).toBe('P');
    });

    it('renders default icon for info variant', () => {
      const { container } = render(<TipBanner {...defaultProps} variant="info" />);
      
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VARIANT TESTS
  // ==========================================================================

  describe('Variants', () => {
    describe('Info Variant (Default)', () => {
      it('applies info styling by default', () => {
        const { container } = render(<TipBanner {...defaultProps} />);
        
        const banner = container.firstChild;
        expect(banner).toHaveClass('bg-blue-50');
        expect(banner).toHaveClass('border-blue-200');
      });

      it('icon has info color', () => {
        const { container } = render(<TipBanner {...defaultProps} variant="info" />);
        
        // The color class is on the SVG itself (Icon component)
        const iconContainer = container.querySelector('.flex-shrink-0.mt-0\\.5');
        const icon = iconContainer?.querySelector('svg');
        expect(icon).toHaveClass('text-blue-500');
      });

      it('title has info color', () => {
        render(<TipBanner {...defaultProps} variant="info" />);
        
        const title = screen.getByText('Test Tip Title');
        expect(title).toHaveClass('text-blue-900');
      });

      it('description has info color', () => {
        render(<TipBanner {...defaultProps} variant="info" />);
        
        const description = screen.getByText('This is a test tip description');
        expect(description).toHaveClass('text-blue-700');
      });
    });

    describe('Warning Variant', () => {
      it('applies warning styling', () => {
        const { container } = render(<TipBanner {...defaultProps} variant="warning" />);
        
        const banner = container.firstChild;
        expect(banner).toHaveClass('bg-amber-50');
        expect(banner).toHaveClass('border-amber-200');
      });

      it('icon has warning color', () => {
        const { container } = render(<TipBanner {...defaultProps} variant="warning" />);
        
        // The color class is on the SVG itself (Icon component)
        const iconContainer = container.querySelector('.flex-shrink-0.mt-0\\.5');
        const icon = iconContainer?.querySelector('svg');
        expect(icon).toHaveClass('text-amber-500');
      });

      it('title has warning color', () => {
        render(<TipBanner {...defaultProps} variant="warning" />);
        
        const title = screen.getByText('Test Tip Title');
        expect(title).toHaveClass('text-amber-900');
      });

      it('description has warning color', () => {
        render(<TipBanner {...defaultProps} variant="warning" />);
        
        const description = screen.getByText('This is a test tip description');
        expect(description).toHaveClass('text-amber-700');
      });
    });

    describe('Success Variant', () => {
      it('applies success styling', () => {
        const { container } = render(<TipBanner {...defaultProps} variant="success" />);
        
        const banner = container.firstChild;
        expect(banner).toHaveClass('bg-green-50');
        expect(banner).toHaveClass('border-green-200');
      });

      it('icon has success color', () => {
        const { container } = render(<TipBanner {...defaultProps} variant="success" />);
        
        // The color class is on the SVG itself (Icon component)
        const iconContainer = container.querySelector('.flex-shrink-0.mt-0\\.5');
        const icon = iconContainer?.querySelector('svg');
        expect(icon).toHaveClass('text-green-500');
      });

      it('title has success color', () => {
        render(<TipBanner {...defaultProps} variant="success" />);
        
        const title = screen.getByText('Test Tip Title');
        expect(title).toHaveClass('text-green-900');
      });

      it('description has success color', () => {
        render(<TipBanner {...defaultProps} variant="success" />);
        
        const description = screen.getByText('This is a test tip description');
        expect(description).toHaveClass('text-green-700');
      });
    });
  });

  // ==========================================================================
  // CUSTOM ICON TESTS
  // ==========================================================================

  describe('Custom Icon', () => {
    it('renders custom icon when provided', () => {
      const { container } = render(
        <TipBanner {...defaultProps} icon={Sparkles} />
      );
      
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('uses custom icon instead of default', () => {
      const { container } = render(
        <TipBanner {...defaultProps} icon={AlertTriangle} variant="info" />
      );
      
      // Should have an SVG (the custom icon)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('custom icon inherits variant color', () => {
      const { container } = render(
        <TipBanner {...defaultProps} icon={Info} variant="warning" />
      );
      
      // The color class is on the SVG itself (Icon component)
      const iconContainer = container.querySelector('.flex-shrink-0.mt-0\\.5');
      const icon = iconContainer?.querySelector('svg');
      expect(icon).toHaveClass('text-amber-500');
    });
  });

  // ==========================================================================
  // ACTION BUTTON TESTS
  // ==========================================================================

  describe('Action Button', () => {
    it('renders action button when action prop provided', () => {
      const handleAction = vi.fn();
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Learn More', onClick: handleAction }}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument();
    });

    it('does not render action button when action prop not provided', () => {
      render(<TipBanner {...defaultProps} />);
      
      // Only the dismiss button should exist
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveAttribute('aria-label', 'Descartar tip');
    });

    it('calls onClick when action button is clicked', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Take Action', onClick: handleAction }}
        />
      );
      
      await user.click(screen.getByRole('button', { name: 'Take Action' }));
      
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('action button has correct styling for info variant', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          variant="info"
          action={{ label: 'Action', onClick: vi.fn() }}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Action' });
      expect(actionButton).toHaveClass('text-blue-700');
      expect(actionButton).toHaveClass('hover:text-blue-900');
    });

    it('action button has correct styling for warning variant', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          variant="warning"
          action={{ label: 'Action', onClick: vi.fn() }}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Action' });
      expect(actionButton).toHaveClass('text-amber-700');
      expect(actionButton).toHaveClass('hover:text-amber-900');
    });

    it('action button has correct styling for success variant', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          variant="success"
          action={{ label: 'Action', onClick: vi.fn() }}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Action' });
      expect(actionButton).toHaveClass('text-green-700');
      expect(actionButton).toHaveClass('hover:text-green-900');
    });
  });

  // ==========================================================================
  // DISMISS FUNCTIONALITY TESTS
  // ==========================================================================

  describe('Dismiss Functionality', () => {
    it('renders dismiss button by default', () => {
      render(<TipBanner {...defaultProps} />);
      
      expect(screen.getByLabelText('Descartar tip')).toBeInTheDocument();
    });

    it('renders dismiss button when dismissible is true', () => {
      render(<TipBanner {...defaultProps} dismissible={true} />);
      
      expect(screen.getByLabelText('Descartar tip')).toBeInTheDocument();
    });

    it('does not render dismiss button when dismissible is false', () => {
      render(<TipBanner {...defaultProps} dismissible={false} />);
      
      expect(screen.queryByLabelText('Descartar tip')).not.toBeInTheDocument();
    });

    it('calls dismissTip with tipId when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      render(<TipBanner {...defaultProps} tipId="my-tip" />);
      
      await user.click(screen.getByLabelText('Descartar tip'));
      
      expect(mockDismissTip).toHaveBeenCalledTimes(1);
      expect(mockDismissTip).toHaveBeenCalledWith('my-tip');
    });

    it('dismiss button has X icon', () => {
      render(<TipBanner {...defaultProps} />);
      
      const dismissButton = screen.getByLabelText('Descartar tip');
      expect(dismissButton.querySelector('svg')).toBeInTheDocument();
    });

    it('dismiss button has correct styling for info variant', () => {
      render(<TipBanner {...defaultProps} variant="info" />);
      
      const dismissButton = screen.getByLabelText('Descartar tip');
      expect(dismissButton).toHaveClass('text-blue-400');
      expect(dismissButton).toHaveClass('hover:text-blue-600');
    });

    it('dismiss button has correct styling for warning variant', () => {
      render(<TipBanner {...defaultProps} variant="warning" />);
      
      const dismissButton = screen.getByLabelText('Descartar tip');
      expect(dismissButton).toHaveClass('text-amber-400');
      expect(dismissButton).toHaveClass('hover:text-amber-600');
    });

    it('dismiss button has correct styling for success variant', () => {
      render(<TipBanner {...defaultProps} variant="success" />);
      
      const dismissButton = screen.getByLabelText('Descartar tip');
      expect(dismissButton).toHaveClass('text-green-400');
      expect(dismissButton).toHaveClass('hover:text-green-600');
    });
  });

  // ==========================================================================
  // CUSTOM CLASS NAME TESTS
  // ==========================================================================

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <TipBanner {...defaultProps} className="my-custom-class" />
      );
      
      const banner = container.firstChild;
      expect(banner).toHaveClass('my-custom-class');
    });

    it('preserves default classes when adding custom className', () => {
      const { container } = render(
        <TipBanner {...defaultProps} className="my-custom-class" />
      );
      
      const banner = container.firstChild;
      expect(banner).toHaveClass('border');
      expect(banner).toHaveClass('rounded-lg');
      expect(banner).toHaveClass('p-4');
      expect(banner).toHaveClass('my-custom-class');
    });

    it('handles empty className', () => {
      const { container } = render(
        <TipBanner {...defaultProps} className="" />
      );
      
      const banner = container.firstChild;
      expect(banner).toHaveClass('border');
      expect(banner).toHaveClass('rounded-lg');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('dismiss button has aria-label', () => {
      render(<TipBanner {...defaultProps} />);
      
      const dismissButton = screen.getByLabelText('Descartar tip');
      expect(dismissButton).toHaveAttribute('aria-label', 'Descartar tip');
    });

    it('title is in h4 element for proper heading hierarchy', () => {
      render(<TipBanner {...defaultProps} />);
      
      const title = screen.getByText('Test Tip Title');
      expect(title.tagName).toBe('H4');
    });

    it('action button is properly accessible', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Go to Settings', onClick: vi.fn() }}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Go to Settings' })).toBeInTheDocument();
    });

    it('has proper color contrast classes', () => {
      render(<TipBanner {...defaultProps} />);
      
      const title = screen.getByText('Test Tip Title');
      const description = screen.getByText('This is a test tip description');
      
      // Info variant uses high contrast colors
      expect(title).toHaveClass('text-blue-900');
      expect(description).toHaveClass('text-blue-700');
    });

    it('icon is decorative (inside container)', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const iconContainer = container.querySelector('.flex-shrink-0.mt-0\\.5');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LAYOUT TESTS
  // ==========================================================================

  describe('Layout', () => {
    it('has border and rounded corners', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const banner = container.firstChild;
      expect(banner).toHaveClass('border');
      expect(banner).toHaveClass('rounded-lg');
    });

    it('has padding', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const banner = container.firstChild;
      expect(banner).toHaveClass('p-4');
    });

    it('uses flex layout with gap', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const innerFlex = container.querySelector('.flex.gap-3');
      expect(innerFlex).toBeInTheDocument();
    });

    it('icon container is flex-shrink-0', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });

    it('content area is flex-1', () => {
      const { container } = render(<TipBanner {...defaultProps} />);
      
      const contentArea = container.querySelector('.flex-1.min-w-0');
      expect(contentArea).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles long title text', () => {
      const longTitle = 'This is a very long tip title that should still render correctly without breaking the layout of the component';
      render(<TipBanner {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles long description text', () => {
      const longDescription = 'This is a very long description that provides detailed information about the tip. It should wrap correctly and maintain proper styling throughout the entire text content. The layout should remain intact.';
      render(<TipBanner {...defaultProps} description={longDescription} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<TipBanner {...defaultProps} title="Tip: Use <code> & 'quotes'" />);
      
      expect(screen.getByText("Tip: Use <code> & 'quotes'")).toBeInTheDocument();
    });

    it('handles special characters in description', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          description={'Description with \'single\' and "double" quotes & <special> chars'}
        />
      );
      
      expect(screen.getByText('Description with \'single\' and "double" quotes & <special> chars')).toBeInTheDocument();
    });

    it('handles empty title', () => {
      render(<TipBanner {...defaultProps} title="" />);
      
      const title = screen.getByRole('heading', { level: 4 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('');
    });

    it('handles empty description', () => {
      const { container } = render(<TipBanner {...defaultProps} description="" />);
      
      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('');
    });

    it('handles both action and dismissible together', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Action', onClick: handleAction }}
          dismissible={true}
        />
      );
      
      // Both buttons should be present
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      expect(screen.getByLabelText('Descartar tip')).toBeInTheDocument();
      
      // Action button should work
      await user.click(screen.getByRole('button', { name: 'Action' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
      
      // Dismiss button should work
      await user.click(screen.getByLabelText('Descartar tip'));
      expect(mockDismissTip).toHaveBeenCalledTimes(1);
    });

    it('handles non-dismissible with action', () => {
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Action', onClick: vi.fn() }}
          dismissible={false}
        />
      );
      
      // Action button should be present
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      // Dismiss button should not be present
      expect(screen.queryByLabelText('Descartar tip')).not.toBeInTheDocument();
    });

    it('returns null early without rendering anything when tip is dismissed', () => {
      mockShouldShowTip.mockReturnValue(false);
      
      const { container } = render(<TipBanner {...defaultProps} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('action and dismiss can be used independently', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Click Me', onClick: handleAction }}
        />
      );
      
      // Click action first
      await user.click(screen.getByRole('button', { name: 'Click Me' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(mockDismissTip).not.toHaveBeenCalled();
      
      // Then click dismiss
      await user.click(screen.getByLabelText('Descartar tip'));
      expect(mockDismissTip).toHaveBeenCalledTimes(1);
      expect(handleAction).toHaveBeenCalledTimes(1); // Should not change
    });

    it('clicking dismiss does not trigger action', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Action', onClick: handleAction }}
        />
      );
      
      await user.click(screen.getByLabelText('Descartar tip'));
      
      expect(mockDismissTip).toHaveBeenCalledTimes(1);
      expect(handleAction).not.toHaveBeenCalled();
    });

    it('clicking action does not trigger dismiss', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TipBanner 
          {...defaultProps} 
          action={{ label: 'Action', onClick: handleAction }}
        />
      );
      
      await user.click(screen.getByRole('button', { name: 'Action' }));
      
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(mockDismissTip).not.toHaveBeenCalled();
    });
  });
});
