import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook to display error toasts from store errors
 * Automatically clears error after displaying
 * 
 * @example
 * ```tsx
 * const { error, clearError } = usePatients();
 * useErrorToast(error, clearError);
 * ```
 */
export const useErrorToast = (
  error: string | null,
  clearError?: () => void
) => {
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError?.();
    }
  }, [error, clearError]);
};
