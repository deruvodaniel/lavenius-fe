import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../../../components/shared/EmptyState';
import { FileText, Users, Calendar, Search, Plus } from 'lucide-react';

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders title correctly', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items found"
          description="There are no items to display"
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'No items found' })).toBeInTheDocument();
    });

    it('renders description correctly', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items found"
          description="Try adding some items to get started"
        />
      );

      expect(screen.getByText('Try adding some items to get started')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No documents"
          description="No documents available"
        />
      );

      // The icon is rendered inside a container div
      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      
      // Check that SVG icon is rendered
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('renders without action button when action is not provided', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="No items to display"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders action button when action is provided', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="No items to display"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders with default variant styling', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description text"
        />
      );

      // Default variant has larger padding (py-16)
      const container = screen.getByRole('heading', { level: 3 }).closest('div');
      expect(container).toHaveClass('py-16');
    });

    it('renders with subtle variant styling', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description text"
          variant="subtle"
        />
      );

      // Subtle variant has smaller padding (py-12)
      const container = screen.getByRole('heading', { level: 3 }).closest('div');
      expect(container).toHaveClass('py-12');
    });

    it('applies correct icon size for default variant', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
        />
      );

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('w-20', 'h-20');
      
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toHaveClass('w-10', 'h-10');
    });

    it('applies correct icon size for subtle variant', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          variant="subtle"
        />
      );

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('w-16', 'h-16');
      
      const svgIcon = iconContainer?.querySelector('svg');
      expect(svgIcon).toHaveClass('w-8', 'h-8');
    });

    it('applies gradient background for default variant', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
        />
      );

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('bg-gradient-to-br');
    });

    it('applies solid gray background for subtle variant', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          variant="subtle"
        />
      );

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('bg-gray-100');
    });
  });

  describe('Different Icons', () => {
    it('renders with Users icon', () => {
      render(
        <EmptyState
          icon={Users}
          title="No patients"
          description="Add your first patient"
        />
      );

      const svgIcon = document.querySelector('.rounded-full svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('renders with Calendar icon', () => {
      render(
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="Schedule your first appointment"
        />
      );

      const svgIcon = document.querySelector('.rounded-full svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('renders with Search icon', () => {
      render(
        <EmptyState
          icon={Search}
          title="No results"
          description="Try adjusting your search"
        />
      );

      const svgIcon = document.querySelector('.rounded-full svg');
      expect(svgIcon).toBeInTheDocument();
    });

    it('renders with Plus icon', () => {
      render(
        <EmptyState
          icon={Plus}
          title="Get started"
          description="Create your first item"
        />
      );

      const svgIcon = document.querySelector('.rounded-full svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('calls onClick when action button is clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Add your first item"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Item' }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders action button with correct label', () => {
      render(
        <EmptyState
          icon={Users}
          title="No patients"
          description="Get started by adding a patient"
          action={{
            label: 'Add Patient',
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Add Patient' })).toBeInTheDocument();
    });

    it('action button has proper styling classes', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          action={{
            label: 'Click me',
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toHaveClass('bg-indigo-600');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('rounded-lg');
    });

    it('does not render action button when action prop is undefined', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="No items to show"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles multiple rapid clicks correctly', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          action={{
            label: 'Click me',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Click me' });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure with h3', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Try uploading some documents"
        />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No documents found');
    });

    it('action button is focusable', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          action={{
            label: 'Add Item',
            onClick: vi.fn(),
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('action button is keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          icon={FileText}
          title="No items"
          description="Description"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      button.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('has semantic text structure', () => {
      render(
        <EmptyState
          icon={FileText}
          title="Empty State Title"
          description="This is the description paragraph"
        />
      );

      // Title is in an h3
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading.tagName).toBe('H3');

      // Description is in a p tag
      const description = screen.getByText('This is the description paragraph');
      expect(description.tagName).toBe('P');
    });

    it('provides visual context through icon', () => {
      render(
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="You have no upcoming appointments"
        />
      );

      // Icon container exists and is visible
      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toBeVisible();
    });
  });

  describe('Content Layout', () => {
    it('centers content horizontally', () => {
      render(
        <EmptyState
          icon={FileText}
          title="Centered content"
          description="This content should be centered"
        />
      );

      const container = screen.getByRole('heading', { level: 3 }).closest('div');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('text-center');
    });

    it('has flex column layout', () => {
      render(
        <EmptyState
          icon={FileText}
          title="Flex layout"
          description="Vertically stacked items"
        />
      );

      const container = screen.getByRole('heading', { level: 3 }).closest('div');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-col');
    });

    it('constrains description width', () => {
      render(
        <EmptyState
          icon={FileText}
          title="Title"
          description="A longer description that should be constrained to a max width for better readability"
        />
      );

      const description = screen.getByText(/A longer description/);
      expect(description).toHaveClass('max-w-sm');
    });
  });

  describe('Edge Cases', () => {
    it('renders with very long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines in the component';

      render(
        <EmptyState
          icon={FileText}
          title={longTitle}
          description="Short description"
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: longTitle })).toBeInTheDocument();
    });

    it('renders with very long description', () => {
      const longDescription = 'This is a very long description that contains a lot of text and might need to wrap to multiple lines. It should still be displayed correctly and maintain proper styling within the max-width constraint.';

      render(
        <EmptyState
          icon={FileText}
          title="Title"
          description={longDescription}
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('renders with very long action label', () => {
      render(
        <EmptyState
          icon={FileText}
          title="Title"
          description="Description"
          action={{
            label: 'This is a very long button label that might need special handling',
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByRole('button', { name: /This is a very long button label/ })).toBeInTheDocument();
    });

    it('renders with special characters in text', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items & results"
          description="Try searching with <different> keywords"
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'No items & results' })).toBeInTheDocument();
      expect(screen.getByText(/Try searching with <different> keywords/)).toBeInTheDocument();
    });

    it('renders with emoji in text', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No items yet!"
          description="Add your first item to get started"
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: /No items yet!/ })).toBeInTheDocument();
    });
  });
});
