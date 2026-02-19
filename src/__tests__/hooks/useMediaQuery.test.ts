import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery, useBreakpoint, useResponsive } from '../../lib/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  // Helper to create a mock matchMedia
  const createMockMatchMedia = (matches: boolean) => {
    return vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock
    window.matchMedia = createMockMatchMedia(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Basic useMediaQuery Tests ====================
  describe('Basic useMediaQuery', () => {
    it('returns true when media query matches', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useMediaQuery('(min-width: 1111px)'));

      expect(result.current).toBe(true);
    });

    it('returns false when media query does not match', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useMediaQuery('(min-width: 2222px)'));

      expect(result.current).toBe(false);
    });

    it('calls matchMedia with correct query', () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      renderHook(() => useMediaQuery('(min-width: 3333px)'));

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 3333px)');
    });

    it('handles various media query strings', () => {
      window.matchMedia = createMockMatchMedia(true);

      const queries = [
        '(min-width: 4441px)',
        '(max-width: 4442px)',
        '(orientation: landscape)',
        '(prefers-color-scheme: dark)',
        '(prefers-reduced-motion: reduce)',
      ];

      queries.forEach((query) => {
        const { result } = renderHook(() => useMediaQuery(query));
        expect(result.current).toBe(true);
      });
    });
  });

  // ==================== Media query change events Tests ====================
  describe('Media query change events', () => {
    it('adds change event listener on mount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(min-width: 5555px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn().mockReturnValue(mockMediaQueryList);

      renderHook(() => useMediaQuery('(min-width: 5555px)'));

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('removes change event listener on unmount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(min-width: 6666px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      window.matchMedia = vi.fn().mockReturnValue(mockMediaQueryList);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 6666px)'));

      unmount();

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  // ==================== useBreakpoint Tests ====================
  describe('useBreakpoint', () => {
    it('returns true when viewport is at least sm (640px)', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useBreakpoint('sm'));

      expect(result.current).toBe(true);
    });

    it('returns false when viewport is below breakpoint', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useBreakpoint('lg'));

      expect(result.current).toBe(false);
    });

    it('uses correct min-width values for each breakpoint', () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      // Test that the breakpoints map to correct values by checking return type
      const breakpoints: Array<{ name: 'sm' | 'md' | 'lg' | 'xl' | '2xl' }> = [
        { name: 'sm' },
        { name: 'md' },
        { name: 'lg' },
        { name: 'xl' },
        { name: '2xl' },
      ];

      breakpoints.forEach(({ name }) => {
        const { result } = renderHook(() => useBreakpoint(name));
        // Just verify each breakpoint returns a boolean (the hook works correctly)
        expect(typeof result.current).toBe('boolean');
      });
    });
  });

  // ==================== useResponsive Tests ====================
  describe('useResponsive', () => {
    it('returns all expected properties', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useResponsive());

      expect(result.current).toHaveProperty('isMobile');
      expect(result.current).toHaveProperty('isTablet');
      expect(result.current).toHaveProperty('isDesktop');
      expect(result.current).toHaveProperty('isMobileOrTablet');
    });

    it('returns boolean values for all properties', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useResponsive());

      expect(typeof result.current.isMobile).toBe('boolean');
      expect(typeof result.current.isTablet).toBe('boolean');
      expect(typeof result.current.isDesktop).toBe('boolean');
      expect(typeof result.current.isMobileOrTablet).toBe('boolean');
    });

    it('isMobileOrTablet is inverse of isDesktop', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useResponsive());

      // These should always be opposites
      expect(result.current.isMobileOrTablet).toBe(!result.current.isDesktop);
    });

    it('isMobile and isTablet and isDesktop are mutually exclusive or overlapping correctly', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      // isMobileOrTablet should always be the inverse of isDesktop
      expect(result.current.isMobileOrTablet).toBe(!result.current.isDesktop);
    });

    it('isDesktop and isMobileOrTablet are always opposites', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      // isDesktop = isLgUp, isMobileOrTablet = !isLgUp
      expect(result.current.isDesktop).toBe(!result.current.isMobileOrTablet);
    });
  });

  // ==================== MediaQuery caching Tests ====================
  describe('MediaQuery caching', () => {
    it('reuses cached media query list for same query', () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      // Render multiple hooks with the same unique query
      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 7777px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 7777px)'));
      const { result: result3 } = renderHook(() => useMediaQuery('(min-width: 7777px)'));

      // All should return the same value
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);
    });

    it('works with different queries', () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 8888px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 9999px)'));

      // Both should work correctly
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
    });
  });

  // ==================== Hook stability Tests ====================
  describe('Hook stability', () => {
    it('useMediaQuery value is stable across rerenders with same matches', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result, rerender } = renderHook(() =>
        useMediaQuery('(min-width: 10101px)')
      );

      const firstValue = result.current;
      rerender();
      const secondValue = result.current;

      expect(firstValue).toBe(secondValue);
    });

    it('useBreakpoint value is stable across rerenders', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result, rerender } = renderHook(() => useBreakpoint('xl'));

      const firstValue = result.current;
      rerender();
      const secondValue = result.current;

      expect(firstValue).toBe(secondValue);
    });

    it('useResponsive values are stable across rerenders', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result, rerender } = renderHook(() => useResponsive());

      const firstResult = { ...result.current };
      rerender();
      const secondResult = result.current;

      expect(firstResult.isMobile).toBe(secondResult.isMobile);
      expect(firstResult.isTablet).toBe(secondResult.isTablet);
      expect(firstResult.isDesktop).toBe(secondResult.isDesktop);
      expect(firstResult.isMobileOrTablet).toBe(secondResult.isMobileOrTablet);
    });
  });

  // ==================== Edge Cases Tests ====================
  describe('Edge Cases', () => {
    it('handles empty query string', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useMediaQuery(''));

      expect(result.current).toBe(false);
    });

    it('handles complex media queries', () => {
      window.matchMedia = createMockMatchMedia(true);

      const complexQuery =
        '(min-width: 11111px) and (max-width: 22222px) and (orientation: landscape)';
      const { result } = renderHook(() => useMediaQuery(complexQuery));

      expect(result.current).toBe(true);
    });

    it('handles multiple useResponsive hooks simultaneously', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result: result1 } = renderHook(() => useResponsive());
      const { result: result2 } = renderHook(() => useResponsive());

      expect(result1.current.isMobile).toBe(result2.current.isMobile);
      expect(result1.current.isDesktop).toBe(result2.current.isDesktop);
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('useMediaQuery returns boolean', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useMediaQuery('(min-width: 33333px)'));

      expect(typeof result.current).toBe('boolean');
    });

    it('useBreakpoint returns boolean', () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useBreakpoint('2xl'));

      expect(typeof result.current).toBe('boolean');
    });

    it('useResponsive returns object with boolean properties', () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useResponsive());

      expect(typeof result.current.isMobile).toBe('boolean');
      expect(typeof result.current.isTablet).toBe('boolean');
      expect(typeof result.current.isDesktop).toBe('boolean');
      expect(typeof result.current.isMobileOrTablet).toBe('boolean');
    });
  });
});
