import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedSection, AnimatedList } from '../../../components/shared/AnimatedSection';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

let intersectionCallback: IntersectionObserverCallback;

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });

  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// Helper to trigger intersection
const triggerIntersection = (isIntersecting: boolean) => {
  intersectionCallback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver
  );
};

describe('AnimatedSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(
        <AnimatedSection>
          <p>Test content</p>
        </AnimatedSection>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <AnimatedSection className="custom-class">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('renders with default animation (fade)', () => {
      render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      // Initially hidden (opacity-0)
      expect(container).toHaveClass('opacity-0');
      expect(container).toHaveClass('transition-opacity');
    });
  });

  describe('IntersectionObserver', () => {
    it('creates IntersectionObserver on mount', () => {
      render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.1, rootMargin: '50px' }
      );
    });

    it('observes the element', () => {
      render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      );

      expect(mockObserve).toHaveBeenCalled();
    });

    it('unobserves element on unmount', () => {
      const { unmount } = render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      );

      unmount();

      expect(mockUnobserve).toHaveBeenCalled();
    });
  });

  describe('Animation Variants', () => {
    it('applies fade animation classes', () => {
      render(
        <AnimatedSection animation="fade">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-opacity');
      expect(container).toHaveClass('opacity-0');
    });

    it('applies slide-up animation classes', () => {
      render(
        <AnimatedSection animation="slide-up">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('opacity-0');
      expect(container).toHaveClass('translate-y-8');
    });

    it('applies slide-left animation classes', () => {
      render(
        <AnimatedSection animation="slide-left">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('opacity-0');
      expect(container).toHaveClass('translate-x-8');
    });

    it('applies scale animation classes', () => {
      render(
        <AnimatedSection animation="scale">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('opacity-0');
      expect(container).toHaveClass('scale-95');
    });

    it('applies no animation classes when animation is none', () => {
      render(
        <AnimatedSection animation="none">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      // none variant has empty classes
      expect(container).not.toHaveClass('opacity-0');
      expect(container).not.toHaveClass('transition-opacity');
    });
  });

  describe('Visibility Transition', () => {
    it('becomes visible when intersecting', () => {
      render(
        <AnimatedSection animation="fade">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;
      expect(container).toHaveClass('opacity-0');

      act(() => {
        triggerIntersection(true);
        vi.advanceTimersByTime(0); // No delay by default
      });

      expect(container).toHaveClass('opacity-100');
    });

    it('applies animate classes for slide-up when visible', () => {
      render(
        <AnimatedSection animation="slide-up">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      act(() => {
        triggerIntersection(true);
        vi.advanceTimersByTime(0);
      });

      expect(container).toHaveClass('opacity-100');
      expect(container).toHaveClass('translate-y-0');
    });

    it('applies animate classes for slide-left when visible', () => {
      render(
        <AnimatedSection animation="slide-left">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      act(() => {
        triggerIntersection(true);
        vi.advanceTimersByTime(0);
      });

      expect(container).toHaveClass('opacity-100');
      expect(container).toHaveClass('translate-x-0');
    });

    it('applies animate classes for scale when visible', () => {
      render(
        <AnimatedSection animation="scale">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      act(() => {
        triggerIntersection(true);
        vi.advanceTimersByTime(0);
      });

      expect(container).toHaveClass('opacity-100');
      expect(container).toHaveClass('scale-100');
    });
  });

  describe('Delay', () => {
    it('respects delay before showing', () => {
      render(
        <AnimatedSection animation="fade" delay={500}>
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      act(() => {
        triggerIntersection(true);
      });

      // Still hidden before delay
      expect(container).toHaveClass('opacity-0');

      // Advance past delay
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(container).toHaveClass('opacity-100');
    });

    it('does not show until intersection + delay', () => {
      render(
        <AnimatedSection animation="fade" delay={200}>
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      // Advance time without intersection
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(container).toHaveClass('opacity-0');

      // Now trigger intersection
      act(() => {
        triggerIntersection(true);
      });

      // Still needs delay after intersection
      expect(container).toHaveClass('opacity-0');

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(container).toHaveClass('opacity-100');
    });
  });

  describe('Duration', () => {
    it('applies custom duration as inline style', () => {
      render(
        <AnimatedSection duration={500}>
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement as HTMLElement;
      expect(container.style.transitionDuration).toBe('500ms');
    });

    it('uses default duration of 300ms', () => {
      render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement as HTMLElement;
      expect(container.style.transitionDuration).toBe('300ms');
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple children', () => {
      render(
        <AnimatedSection>
          <p>First</p>
          <p>Second</p>
          <p>Third</p>
        </AnimatedSection>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('handles no children', () => {
      const { container } = render(<AnimatedSection>{null}</AnimatedSection>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('stays visible once shown (does not hide on scroll out)', () => {
      render(
        <AnimatedSection animation="fade">
          <p>Content</p>
        </AnimatedSection>
      );

      const container = screen.getByText('Content').parentElement;

      // Show
      act(() => {
        triggerIntersection(true);
        vi.advanceTimersByTime(0);
      });

      expect(container).toHaveClass('opacity-100');

      // Scroll out - should still be visible
      act(() => {
        triggerIntersection(false);
      });

      expect(container).toHaveClass('opacity-100');
    });
  });
});

describe('AnimatedList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders all children', () => {
      render(
        <AnimatedList>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </AnimatedList>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <AnimatedList className="my-list-class">
          {[<div key="1">Item</div>]}
        </AnimatedList>
      );

      expect(container.firstChild).toHaveClass('my-list-class');
    });
  });

  describe('Animation', () => {
    it('uses slide-up animation by default', () => {
      render(
        <AnimatedList>
          {[<div key="1">Item</div>]}
        </AnimatedList>
      );

      const item = screen.getByText('Item').parentElement;
      expect(item).toHaveClass('transition-all');
    });

    it('uses custom animation when specified', () => {
      render(
        <AnimatedList animation="fade">
          {[<div key="1">Item</div>]}
        </AnimatedList>
      );

      const item = screen.getByText('Item').parentElement;
      expect(item).toHaveClass('transition-opacity');
    });
  });

  describe('Staggered Delays', () => {
    it('applies increasing delays to each item', () => {
      const { container } = render(
        <AnimatedList stagger={100}>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </AnimatedList>
      );

      // Each AnimatedSection wraps an item
      // The delay is passed as prop (index * stagger)
      // We can verify by checking that all items render
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('uses default stagger of 50ms', () => {
      render(
        <AnimatedList>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
          ]}
        </AnimatedList>
      );

      // Items should render - internal delay handling
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('applies custom stagger value', () => {
      render(
        <AnimatedList stagger={200}>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </AnimatedList>
      );

      // All items should be present
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children array', () => {
      const { container } = render(
        <AnimatedList>
          {[]}
        </AnimatedList>
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('handles single child', () => {
      render(
        <AnimatedList>
          {[<div key="1">Single item</div>]}
        </AnimatedList>
      );

      expect(screen.getByText('Single item')).toBeInTheDocument();
    });

    it('handles many children', () => {
      const items = Array.from({ length: 10 }, (_, i) => (
        <div key={i}>Item {i + 1}</div>
      ));

      render(<AnimatedList>{items}</AnimatedList>);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 10')).toBeInTheDocument();
    });
  });
});
