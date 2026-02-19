import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplePagination } from '../../../components/shared/SimplePagination';

describe('SimplePagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders pagination controls', () => {
      render(<SimplePagination {...defaultProps} />);

      // Should have prev/next buttons
      expect(screen.getByRole('button', { name: /página anterior/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /página siguiente/i })).toBeInTheDocument();
    });

    it('shows current page info in "X / Y" format', () => {
      render(<SimplePagination {...defaultProps} currentPage={2} />);

      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('shows item range info in "X-Y de Z" format', () => {
      render(<SimplePagination {...defaultProps} currentPage={1} />);

      expect(screen.getByText('1-10 de 50')).toBeInTheDocument();
    });

    it('shows correct item range on middle pages', () => {
      render(<SimplePagination {...defaultProps} currentPage={3} />);

      expect(screen.getByText('21-30 de 50')).toBeInTheDocument();
    });

    it('shows correct item range on last page with partial items', () => {
      render(
        <SimplePagination
          {...defaultProps}
          currentPage={5}
          totalItems={47}
        />
      );

      // Page 5: items 41-47 (only 7 items on last page)
      expect(screen.getByText('41-47 de 47')).toBeInTheDocument();
    });

    it('renders previous button with ChevronLeft icon', () => {
      render(<SimplePagination {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      expect(prevButton).toBeInTheDocument();
      expect(prevButton.querySelector('svg')).toBeInTheDocument();
    });

    it('renders next button with ChevronRight icon', () => {
      render(<SimplePagination {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /página siguiente/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onPageChange with previous page when prev button clicked', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /página anterior/i }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with next page when next button clicked', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={2}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /página siguiente/i }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('disables previous button on first page', () => {
      render(<SimplePagination {...defaultProps} currentPage={1} />);

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      expect(prevButton).toBeDisabled();
    });

    it('enables previous button on pages after first', () => {
      render(<SimplePagination {...defaultProps} currentPage={2} />);

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<SimplePagination {...defaultProps} currentPage={5} />);

      const nextButton = screen.getByRole('button', { name: /página siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables next button on pages before last', () => {
      render(<SimplePagination {...defaultProps} currentPage={4} />);

      const nextButton = screen.getByRole('button', { name: /página siguiente/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('does not call onPageChange when disabled prev button is clicked', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      await user.click(prevButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not call onPageChange when disabled next button is clicked', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /página siguiente/i });
      await user.click(nextButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('returns null when totalPages is 1 (no pagination needed)', () => {
      const { container } = render(
        <SimplePagination
          {...defaultProps}
          totalPages={1}
          totalItems={5}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 0', () => {
      const { container } = render(
        <SimplePagination
          {...defaultProps}
          totalPages={0}
          totalItems={0}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles many pages correctly', () => {
      render(
        <SimplePagination
          {...defaultProps}
          currentPage={50}
          totalPages={100}
          totalItems={1000}
        />
      );

      expect(screen.getByText('50 / 100')).toBeInTheDocument();
      expect(screen.getByText('491-500 de 1000')).toBeInTheDocument();
    });

    it('handles two pages correctly', () => {
      render(
        <SimplePagination
          {...defaultProps}
          totalPages={2}
          totalItems={15}
          currentPage={1}
        />
      );

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByText('1-10 de 15')).toBeInTheDocument();
    });

    it('handles last page with exact item count', () => {
      render(
        <SimplePagination
          {...defaultProps}
          currentPage={5}
          totalItems={50}
        />
      );

      expect(screen.getByText('41-50 de 50')).toBeInTheDocument();
    });
  });

  describe('Custom Labels (i18n)', () => {
    it('uses custom "of" label', () => {
      render(
        <SimplePagination
          {...defaultProps}
          labels={{ of: 'of' }}
        />
      );

      expect(screen.getByText('1-10 of 50')).toBeInTheDocument();
    });

    it('uses custom previous page label', () => {
      render(
        <SimplePagination
          {...defaultProps}
          labels={{ previousPage: 'Previous page' }}
        />
      );

      expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    });

    it('uses custom next page label', () => {
      render(
        <SimplePagination
          {...defaultProps}
          labels={{ nextPage: 'Next page' }}
        />
      );

      expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    });

    it('uses all custom labels together', () => {
      render(
        <SimplePagination
          {...defaultProps}
          labels={{
            of: 'of',
            previousPage: 'Previous',
            nextPage: 'Next',
          }}
        />
      );

      expect(screen.getByText('1-10 of 50')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('uses default labels when not provided', () => {
      render(<SimplePagination {...defaultProps} />);

      expect(screen.getByText('1-10 de 50')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels on navigation buttons', () => {
      render(<SimplePagination {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      const nextButton = screen.getByRole('button', { name: /página siguiente/i });

      expect(prevButton).toHaveAttribute('aria-label', 'Página anterior');
      expect(nextButton).toHaveAttribute('aria-label', 'Página siguiente');
    });

    it('buttons are keyboard accessible', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /página siguiente/i });
      nextButton.focus();
      expect(nextButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('can navigate using Tab key', async () => {
      const user = userEvent.setup();

      render(<SimplePagination {...defaultProps} currentPage={3} />);

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      const nextButton = screen.getByRole('button', { name: /página siguiente/i });

      // Tab to first button
      await user.tab();
      expect(prevButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(nextButton).toHaveFocus();
    });

    it('disabled buttons are still focusable but not actionable', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <SimplePagination
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      const prevButton = screen.getByRole('button', { name: /página anterior/i });
      prevButton.focus();

      await user.keyboard('{Enter}');
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('renders with proper semantic structure', () => {
      const { container } = render(<SimplePagination {...defaultProps} />);

      // Main container
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-between');
    });
  });

  describe('Styling', () => {
    it('applies border-t styling', () => {
      const { container } = render(<SimplePagination {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('border-t');
      expect(wrapper).toHaveClass('border-gray-100');
    });

    it('applies proper padding', () => {
      const { container } = render(<SimplePagination {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('pt-4');
    });

    it('buttons have proper size classes', () => {
      render(<SimplePagination {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('h-8');
        expect(button).toHaveClass('w-8');
      });
    });

    it('page info text has proper styling', () => {
      render(<SimplePagination {...defaultProps} />);

      const pageInfo = screen.getByText('1 / 5');
      expect(pageInfo).toHaveClass('text-sm');
      expect(pageInfo).toHaveClass('text-gray-600');
    });

    it('item range text has proper styling', () => {
      render(<SimplePagination {...defaultProps} />);

      const itemRange = screen.getByText('1-10 de 50');
      expect(itemRange).toHaveClass('text-sm');
      expect(itemRange).toHaveClass('text-gray-500');
    });
  });
});
