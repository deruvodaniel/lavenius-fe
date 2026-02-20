import { useEffect, useRef, useCallback } from 'react';

/**
 * Focusable element selectors for focus trap
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Callback when Escape key is pressed */
  onEscape?: () => void;
  /** Whether to restore focus to the previously focused element on unmount */
  restoreFocus?: boolean;
  /** Initial element to focus (selector or ref) */
  initialFocus?: string | React.RefObject<HTMLElement>;
}

/**
 * useFocusTrap - Hook for trapping focus within a container
 * 
 * Features:
 * - Traps Tab/Shift+Tab navigation within the container
 * - Handles Escape key to dismiss
 * - Restores focus to previously focused element on unmount
 * - Supports initial focus element
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *     restoreFocus: true,
 *   });
 * 
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button>First focusable</button>
 *       <button>Last focusable</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  restoreFocus = true,
  initialFocus,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter(el => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  /**
   * Handle keyboard navigation for focus trap
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;

    // Handle Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onEscape?.();
      return;
    }

    // Handle Tab key for focus trap
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forwards)
      else {
        if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isActive, onEscape, getFocusableElements]);

  /**
   * Set initial focus when trap becomes active
   */
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Determine initial focus target
    let focusTarget: HTMLElement | null = null;

    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        focusTarget = containerRef.current.querySelector<HTMLElement>(initialFocus);
      } else if (initialFocus.current) {
        focusTarget = initialFocus.current;
      }
    }

    // Fallback to first focusable element
    if (!focusTarget) {
      const focusableElements = getFocusableElements();
      focusTarget = focusableElements[0] || containerRef.current;
    }

    // Set focus with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      focusTarget?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isActive, initialFocus, getFocusableElements]);

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, handleKeyDown]);

  /**
   * Restore focus when trap becomes inactive
   */
  useEffect(() => {
    if (isActive) return;
    
    if (restoreFocus && previouslyFocusedRef.current) {
      // Small delay to ensure the drawer/modal has closed
      const timeoutId = setTimeout(() => {
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, restoreFocus]);

  return containerRef;
}

export type { UseFocusTrapOptions };
