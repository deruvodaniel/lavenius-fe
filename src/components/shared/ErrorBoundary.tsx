import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Detecta errores de carga de chunks (típicamente después de un deploy)
 */
const isChunkLoadError = (error: Error | null): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('dynamically imported module') ||
    message.includes('failed to fetch') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    error.name === 'ChunkLoadError'
  );
};

/**
 * Retorna un mensaje amigable para el usuario
 * En desarrollo muestra el error real, en producción uno genérico
 */
const getErrorMessage = (error: Error | null): string => {
  if (import.meta.env.DEV && error?.message) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.';
};

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Error de carga de módulo (nueva versión desplegada)
      if (isChunkLoadError(this.state.error)) {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <Alert className="max-w-lg">
              <RefreshCw className="h-4 w-4" />
              <AlertTitle>Nueva versión disponible</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  Hay una actualización disponible. Por favor recarga la página para continuar.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recargar página
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        );
      }

      // Error genérico
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Algo salió mal</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">{getErrorMessage(this.state.error)}</p>
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Intentar de nuevo
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
