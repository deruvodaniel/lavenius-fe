import { useState, useEffect, useSyncExternalStore } from 'react';

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

// Cache for media query lists to avoid recreating them
const mediaQueryCache = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  
  if (!mediaQueryCache.has(query)) {
    mediaQueryCache.set(query, window.matchMedia(query));
  }
  return mediaQueryCache.get(query)!;
}

/**
 * Check if the viewport matches a media query
 * Uses useSyncExternalStore for safe concurrent rendering
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = getMediaQueryList(query);
    if (!mql) return () => {};
    
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => {
    const mql = getMediaQueryList(query);
    return mql ? mql.matches : false;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
 * All breakpoint checks are made with stable hooks
 */
export function useResponsive() {
  const isMdUp = useBreakpoint('md');   // >= 768px
  const isLgUp = useBreakpoint('lg');   // >= 1024px
  
  return {
    isMobile: !isMdUp,                  // < 768px
    isTablet: isMdUp && !isLgUp,        // 768-1023px
    isDesktop: isLgUp,                  // >= 1024px
    isMobileOrTablet: !isLgUp,          // < 1024px
  };
}
