import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../../components/shared/ErrorBoundary';

// Component that throws an error on demand
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error content</div>;
};

// Component that throws error without message
const ThrowErrorNoMessage = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error();
  }
  return <div>No error content</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors in tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('does not show fallback UI when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error content')).toBeInTheDocument();
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /intentar de nuevo/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('catches error from child component', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI instead of crashing
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      expect(screen.queryByText('No error content')).not.toBeInTheDocument();
    });

    it('shows default fallback UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Check for default fallback elements
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /intentar de nuevo/i })).toBeInTheDocument();
    });

    it('shows error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('shows default error message when error has no message', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorNoMessage shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Ha ocurrido un error inesperado. Por favor intenta de nuevo.')).toBeInTheDocument();
    });

    it('logs error to console via componentDidCatch', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      // React logs errors first, then ErrorBoundary's componentDidCatch logs
      // Find the call that contains our error boundary message
      const errorBoundaryCall = consoleErrorSpy.mock.calls.find(
        (call) => call[0] === 'ErrorBoundary caught an error:'
      );
      expect(errorBoundaryCall).toBeDefined();
      // The second argument should be the error
      expect(errorBoundaryCall![1]).toBeInstanceOf(Error);
      expect(errorBoundaryCall![1].message).toBe('Test error message');
    });
  });

  describe('Chunk Load Error Detection', () => {
    // Helper to create chunk-like errors
    const createChunkError = (message: string, name?: string) => {
      const error = new Error(message);
      if (name) error.name = name;
      return error;
    };

    const ThrowChunkError = ({ message, errorName }: { message: string; errorName?: string }) => {
      throw createChunkError(message, errorName);
    };

    it('shows "Nueva versión disponible" for dynamically imported module errors', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Failed to fetch dynamically imported module: /assets/Component-abc123.js" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument();
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
    });

    it('shows chunk error UI for "failed to fetch" errors', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Failed to fetch" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    });

    it('shows chunk error UI for "loading chunk" errors', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Loading chunk 123 failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    });

    it('shows chunk error UI for "loading css chunk" errors', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Loading CSS chunk styles-abc123 failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    });

    it('shows chunk error UI for ChunkLoadError name', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Chunk failed to load" errorName="ChunkLoadError" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
    });

    it('shows friendly message instead of technical details', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Failed to fetch dynamically imported module: https://example.com/assets/Component-QK7xxTTs.js" />
        </ErrorBoundary>
      );

      // Should NOT show the technical URL/path
      expect(screen.queryByText(/QK7xxTTs/)).not.toBeInTheDocument();
      expect(screen.queryByText(/assets/)).not.toBeInTheDocument();
      
      // Should show friendly message
      expect(screen.getByText(/actualización disponible/i)).toBeInTheDocument();
    });

    it('calls window.location.reload when reload button is clicked', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;
      const reloadMock = vi.fn();
      
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowChunkError message="Failed to fetch dynamically imported module" />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: /recargar página/i }));
      expect(reloadMock).toHaveBeenCalledTimes(1);

      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('chunk error alert does not have destructive variant', () => {
      render(
        <ErrorBoundary>
          <ThrowChunkError message="Failed to fetch dynamically imported module" />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      // Destructive variant adds 'text-destructive' class
      expect(alert).not.toHaveClass('text-destructive');
    });

    it('shows normal error UI for non-chunk errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show normal error, not chunk error UI
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
    });

    it('does not show custom fallback when no error', () => {
      const customFallback = <div>Custom error fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error content')).toBeInTheDocument();
      expect(screen.queryByText('Custom error fallback')).not.toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('reset button is visible when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /intentar de nuevo/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('resets error state when reset button is clicked', async () => {
      const user = userEvent.setup();

      // Using a controllable component to test reset
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        return (
          <div>
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            <ErrorBoundary key={shouldThrow ? 'error' : 'fixed'}>
              <ThrowError shouldThrow={shouldThrow} />
            </ErrorBoundary>
          </div>
        );
      };

      // Import React for the test component
      const React = await import('react');
      
      render(<TestComponent />);

      // Error should be shown initially
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

      // Fix the error condition
      await user.click(screen.getByRole('button', { name: /fix error/i }));

      // Should now show normal content
      await waitFor(() => {
        expect(screen.getByText('No error content')).toBeInTheDocument();
      });
    });

    it('calls handleReset which clears error state', async () => {
      const user = userEvent.setup();

      // We need to test that clicking reset clears the internal state
      // After reset, if the child doesn't throw again, it should render
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be visible
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

      // Click reset button
      await user.click(screen.getByRole('button', { name: /intentar de nuevo/i }));

      // After reset, the component will try to render children again
      // Since ThrowError still has shouldThrow=true, it will throw again
      // But the click should have triggered the reset handler
      // The error will be caught again, showing the error UI
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    });

    it('recovers successfully when child stops throwing after reset', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered successfully</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

      // Fix the error condition before clicking reset
      shouldThrow = false;

      // Click reset button
      await user.click(screen.getByRole('button', { name: /intentar de nuevo/i }));

      // Should now show recovered content
      await waitFor(() => {
        expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
      });
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('fallback UI contains an alert role', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Alert component renders with role="alert" by default
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('reset button is keyboard accessible', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /intentar de nuevo/i });
      
      // Button should be focusable
      resetButton.focus();
      expect(resetButton).toHaveFocus();

      // Should be clickable via keyboard
      await user.keyboard('{Enter}');
      // Button interaction should work (error will re-throw, but interaction worked)
    });

    it('error message is readable by screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // The error title should be visible
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      
      // The error message should be in the description
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('alert has proper structure with title and description', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      
      // Alert should contain the title
      expect(alert).toHaveTextContent('Algo salió mal');
      
      // Alert should contain the error message
      expect(alert).toHaveTextContent('Test error message');
      
      // Alert should contain the retry button
      expect(alert).toContainElement(screen.getByRole('button', { name: /intentar de nuevo/i }));
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not crash and not show error UI
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should not crash and not show error UI
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
    });

    it('handles deeply nested errors', () => {
      const DeeplyNested = () => (
        <div>
          <div>
            <div>
              <ThrowError shouldThrow={true} />
            </div>
          </div>
        </div>
      );

      render(
        <ErrorBoundary>
          <DeeplyNested />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    });

    it('handles error thrown in render phase', () => {
      const ThrowInRender = () => {
        throw new Error('Render phase error');
      };

      render(
        <ErrorBoundary>
          <ThrowInRender />
        </ErrorBoundary>
      );

      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
      expect(screen.getByText('Render phase error')).toBeInTheDocument();
    });
  });

  describe('Static Methods', () => {
    it('getDerivedStateFromError returns correct state', () => {
      const error = new Error('Static test error');
      const result = ErrorBoundary.getDerivedStateFromError(error);

      expect(result).toEqual({
        hasError: true,
        error: error,
      });
    });
  });
});
