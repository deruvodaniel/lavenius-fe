import { useState, useEffect } from 'react';

/**
 * Hook for responsive breakpoint detection
 * Uses the same breakpoints as Tailwind CSS
 */

// Tailwind breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if the viewport matches a media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Check if viewport is at least the given breakpoint
 * e.g., useBreakpoint('md') returns true if viewport >= 768px
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

/**
 * Convenient hook for common responsive checks
 */
export function useResponsive() {
  const isMobile = !useBreakpoint('md');  // < 768px
  const isTablet = useBreakpoint('md') && !useBreakpoint('lg');  // 768-1023px
  const isDesktop = useBreakpoint('lg');  // >= 1024px
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet: isMobile || isTablet,
  };
}
