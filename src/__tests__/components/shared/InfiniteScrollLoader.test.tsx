import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef, RefObject } from 'react';
import { InfiniteScrollLoader } from '../../../components/shared/InfiniteScrollLoader';

// Helper to create a mock ref
const createMockRef = (): RefObject<HTMLDivElement | null> => {
  return createRef<HTMLDivElement>();
};

describe('InfiniteScrollLoader', () => {
  describe('Rendering', () => {
    it('renders nothing when hasMore is false', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={false}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when hasMore is true', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('attaches ref to the container div', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(ref.current).toBe(container.firstChild);
    });
  });

  describe('Loading State', () => {
    it('shows loading animation when isLoading is true', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      // Should show the bouncing dots
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('displays default loading text', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(screen.getByText('Cargando más...')).toBeInTheDocument();
    });

    it('displays custom loading text', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
          loadingText="Cargando pacientes..."
        />
      );

      expect(screen.getByText('Cargando pacientes...')).toBeInTheDocument();
    });

    it('shows empty spacer when not loading', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      // Should have a spacer div with h-4
      const spacer = container.querySelector('.h-4');
      expect(spacer).toBeInTheDocument();
    });

    it('does not show loading animation when not loading', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(0);
    });

    it('does not show loading text when not loading', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(screen.queryByText('Cargando más...')).not.toBeInTheDocument();
    });
  });

  describe('Bouncing Dots Animation', () => {
    it('renders three bouncing dots', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('dots have staggered animation delays', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const dots = container.querySelectorAll('.animate-bounce');

      expect((dots[0] as HTMLElement).style.animationDelay).toBe('0ms');
      expect((dots[1] as HTMLElement).style.animationDelay).toBe('150ms');
      expect((dots[2] as HTMLElement).style.animationDelay).toBe('300ms');
    });

    it('dots have correct styling', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const dots = container.querySelectorAll('.animate-bounce');

      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-2');
        expect(dot).toHaveClass('h-2');
        expect(dot).toHaveClass('bg-indigo-600');
        expect(dot).toHaveClass('rounded-full');
      });
    });
  });

  describe('Styling', () => {
    it('container has centered text', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toHaveClass('text-center');
    });

    it('container has vertical padding', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toHaveClass('py-6');
    });

    it('loading text has correct styling', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const loadingText = screen.getByText('Cargando más...');
      expect(loadingText).toHaveClass('text-sm');
      expect(loadingText).toHaveClass('text-gray-500');
    });

    it('loading content is flexbox centered', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const loadingContent = container.querySelector('.flex.flex-col');
      expect(loadingContent).toHaveClass('items-center');
      expect(loadingContent).toHaveClass('gap-3');
    });

    it('dots container has inline-flex layout', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const dotsContainer = container.querySelector('.inline-flex');
      expect(dotsContainer).toHaveClass('items-center');
      expect(dotsContainer).toHaveClass('gap-2');
    });
  });

  describe('Conditional Rendering', () => {
    it('returns null immediately when hasMore is false and isLoading is true', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={false}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when hasMore is false and isLoading is false', () => {
      const ref = createMockRef();
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={false}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when hasMore is true regardless of isLoading', () => {
      const ref = createMockRef();

      const { rerender, container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeInTheDocument();

      rerender(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty loadingText', () => {
      const ref = createMockRef();
      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
          loadingText=""
        />
      );

      // Should render but with empty text
      const loadingParagraph = document.querySelector('p.text-sm');
      expect(loadingParagraph).toBeInTheDocument();
      expect(loadingParagraph?.textContent).toBe('');
    });

    it('handles long loadingText', () => {
      const ref = createMockRef();
      const longText = 'Cargando más elementos, por favor espere un momento...';

      render(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
          loadingText={longText}
        />
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles ref that starts as null', () => {
      const ref = { current: null };
      const { container } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      // After render, ref should point to the element
      expect(ref.current).toBe(container.firstChild);
    });
  });

  describe('Integration with IntersectionObserver Pattern', () => {
    it('provides a stable ref target for IntersectionObserver', () => {
      const ref = createMockRef();

      const { rerender } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      const initialRef = ref.current;

      // Rerender with loading state change
      rerender(
        <InfiniteScrollLoader
          isLoading={true}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      // Ref should still point to the same element
      expect(ref.current).toBe(initialRef);
    });

    it('ref becomes null when hasMore becomes false', () => {
      const ref = createMockRef();

      const { rerender } = render(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={true}
          loadMoreRef={ref}
        />
      );

      expect(ref.current).not.toBeNull();

      rerender(
        <InfiniteScrollLoader
          isLoading={false}
          hasMore={false}
          loadMoreRef={ref}
        />
      );

      // Component returns null, so ref is no longer attached
      expect(ref.current).toBeNull();
    });
  });
});
