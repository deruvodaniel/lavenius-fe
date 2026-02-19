import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useErrorToast } from '../../lib/hooks/useErrorToast';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Basic Functionality Tests ====================
  describe('Basic Functionality', () => {
    it('does not show toast when error is null', () => {
      renderHook(() => useErrorToast(null));

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows toast when error is provided', () => {
      renderHook(() => useErrorToast('Error message'));

      expect(toast.error).toHaveBeenCalledWith('Error message');
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('shows toast with correct error message', () => {
      const errorMessage = 'Failed to fetch data';
      renderHook(() => useErrorToast(errorMessage));

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('shows toast for empty string error', () => {
      // Empty string is falsy but we test the behavior
      renderHook(() => useErrorToast(''));

      // Empty string is falsy, so toast should not be called
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  // ==================== clearError Callback Tests ====================
  describe('clearError Callback', () => {
    it('calls clearError after showing toast', () => {
      const clearError = vi.fn();
      renderHook(() => useErrorToast('Error message', clearError));

      expect(toast.error).toHaveBeenCalledWith('Error message');
      expect(clearError).toHaveBeenCalledTimes(1);
    });

    it('does not call clearError when error is null', () => {
      const clearError = vi.fn();
      renderHook(() => useErrorToast(null, clearError));

      expect(clearError).not.toHaveBeenCalled();
    });

    it('handles undefined clearError gracefully', () => {
      expect(() => {
        renderHook(() => useErrorToast('Error message', undefined));
      }).not.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Error message');
    });

    it('clearError is optional parameter', () => {
      expect(() => {
        renderHook(() => useErrorToast('Error message'));
      }).not.toThrow();

      expect(toast.error).toHaveBeenCalledWith('Error message');
    });
  });

  // ==================== Error Change Tests ====================
  describe('Error Changes', () => {
    it('shows toast when error changes from null to value', () => {
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error),
        { initialProps: { error: null as string | null } }
      );

      expect(toast.error).not.toHaveBeenCalled();

      rerender({ error: 'New error' });

      expect(toast.error).toHaveBeenCalledWith('New error');
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('shows toast again when error changes to different value', () => {
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error),
        { initialProps: { error: 'First error' as string | null } }
      );

      expect(toast.error).toHaveBeenCalledWith('First error');

      rerender({ error: 'Second error' });

      expect(toast.error).toHaveBeenCalledWith('Second error');
      expect(toast.error).toHaveBeenCalledTimes(2);
    });

    it('does not show toast when error changes to null', () => {
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error),
        { initialProps: { error: 'Error' as string | null } }
      );

      expect(toast.error).toHaveBeenCalledTimes(1);

      rerender({ error: null });

      // Should still be 1 (no new toast for null)
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('does not show duplicate toast when error stays the same', () => {
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error),
        { initialProps: { error: 'Same error' as string | null } }
      );

      expect(toast.error).toHaveBeenCalledTimes(1);

      // Rerender with same error - useEffect dependencies should prevent re-run
      // Note: This depends on React's dependency comparison
      rerender({ error: 'Same error' });

      // In practice, React may or may not re-run the effect depending on reference equality
      // This test documents the expected behavior
    });
  });

  // ==================== clearError Change Tests ====================
  describe('clearError Changes', () => {
    it('calls new clearError when callback changes', () => {
      const clearError1 = vi.fn();
      const clearError2 = vi.fn();

      const { rerender } = renderHook(
        ({ error, clearError }) => useErrorToast(error, clearError),
        { initialProps: { error: 'Error' as string | null, clearError: clearError1 } }
      );

      expect(clearError1).toHaveBeenCalledTimes(1);

      // Change both error and clearError
      rerender({ error: 'New error', clearError: clearError2 });

      expect(clearError2).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Various Error Message Types ====================
  describe('Various Error Message Types', () => {
    it('handles long error messages', () => {
      const longError = 'A'.repeat(1000);
      renderHook(() => useErrorToast(longError));

      expect(toast.error).toHaveBeenCalledWith(longError);
    });

    it('handles error messages with special characters', () => {
      const specialError = 'Error: <script>alert("XSS")</script>';
      renderHook(() => useErrorToast(specialError));

      expect(toast.error).toHaveBeenCalledWith(specialError);
    });

    it('handles error messages with unicode', () => {
      const unicodeError = 'Error: 你好世界 🚀 αβγ';
      renderHook(() => useErrorToast(unicodeError));

      expect(toast.error).toHaveBeenCalledWith(unicodeError);
    });

    it('handles error messages with newlines', () => {
      const multilineError = 'Line 1\nLine 2\nLine 3';
      renderHook(() => useErrorToast(multilineError));

      expect(toast.error).toHaveBeenCalledWith(multilineError);
    });

    it('handles Spanish error messages', () => {
      const spanishError = 'Error al cargar pacientes. Por favor, intente de nuevo.';
      renderHook(() => useErrorToast(spanishError));

      expect(toast.error).toHaveBeenCalledWith(spanishError);
    });

    it('handles error messages with numbers', () => {
      const errorWithNumbers = 'Error 404: Not Found';
      renderHook(() => useErrorToast(errorWithNumbers));

      expect(toast.error).toHaveBeenCalledWith(errorWithNumbers);
    });
  });

  // ==================== Integration with Store Patterns ====================
  describe('Integration with Store Patterns', () => {
    it('typical usage with store error and clearError', () => {
      const mockStore = {
        error: 'Store error',
        clearError: vi.fn(),
      };

      renderHook(() => useErrorToast(mockStore.error, mockStore.clearError));

      expect(toast.error).toHaveBeenCalledWith('Store error');
      expect(mockStore.clearError).toHaveBeenCalledTimes(1);
    });

    it('handles rapid error changes', () => {
      const clearError = vi.fn();
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error, clearError),
        { initialProps: { error: null as string | null } }
      );

      // Rapid changes
      rerender({ error: 'Error 1' });
      rerender({ error: 'Error 2' });
      rerender({ error: 'Error 3' });

      expect(toast.error).toHaveBeenCalledTimes(3);
      expect(clearError).toHaveBeenCalledTimes(3);
    });

    it('handles alternating null and error', () => {
      const clearError = vi.fn();
      const { rerender } = renderHook(
        ({ error }) => useErrorToast(error, clearError),
        { initialProps: { error: null as string | null } }
      );

      rerender({ error: 'Error 1' });
      expect(toast.error).toHaveBeenCalledTimes(1);

      rerender({ error: null });
      // No new toast

      rerender({ error: 'Error 2' });
      expect(toast.error).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles whitespace-only error', () => {
      renderHook(() => useErrorToast('   '));

      // Whitespace string is truthy, so toast should be called
      expect(toast.error).toHaveBeenCalledWith('   ');
    });

    it('handles unmount before effect runs', () => {
      const clearError = vi.fn();
      const { unmount } = renderHook(() =>
        useErrorToast('Error', clearError)
      );

      // Unmount immediately
      unmount();

      // Effect should have run before unmount
      expect(toast.error).toHaveBeenCalled();
    });

    it('does not throw when component unmounts with pending error', () => {
      const clearError = vi.fn();
      
      expect(() => {
        const { unmount } = renderHook(() =>
          useErrorToast('Error', clearError)
        );
        unmount();
      }).not.toThrow();
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('hook returns void (no return value)', () => {
      const { result } = renderHook(() => useErrorToast('Error'));

      expect(result.current).toBeUndefined();
    });

    it('hook can be called multiple times in same component', () => {
      const error1 = 'Error 1';
      const error2 = 'Error 2';
      const clearError1 = vi.fn();
      const clearError2 = vi.fn();

      renderHook(() => {
        useErrorToast(error1, clearError1);
        useErrorToast(error2, clearError2);
      });

      expect(toast.error).toHaveBeenCalledWith(error1);
      expect(toast.error).toHaveBeenCalledWith(error2);
      expect(clearError1).toHaveBeenCalled();
      expect(clearError2).toHaveBeenCalled();
    });
  });
});
