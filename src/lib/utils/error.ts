/**
 * Error handling utilities and type guards
 * Used across the application for consistent error handling
 */

import { ApiClientError } from '../api/client';

/**
 * Represents an error with a message property
 */
interface ErrorWithMessage {
  message: string;
}

/**
 * Represents an error with status code (API errors)
 */
interface ErrorWithStatusCode {
  statusCode?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

/**
 * Type guard to check if an error has a message property
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard to check if error is an ApiClientError
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/**
 * Type guard to check if error has status code information
 */
export function isErrorWithStatusCode(error: unknown): error is ErrorWithStatusCode {
  if (typeof error !== 'object' || error === null) return false;
  
  const err = error as Record<string, unknown>;
  return (
    typeof err.statusCode === 'number' ||
    (typeof err.response === 'object' && err.response !== null)
  );
}

/**
 * Extract error message from unknown error type
 * Works with ApiClientError, standard Error, and plain objects
 */
export function getErrorMessage(error: unknown, fallback = 'Error desconocido'): string {
  // Handle ApiClientError
  if (isApiClientError(error)) {
    return error.message;
  }

  // Handle standard Error or object with message
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  // Handle response errors from axios (when not wrapped by ApiClientError)
  if (isErrorWithStatusCode(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Extract status code from error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isApiClientError(error)) {
    return error.statusCode;
  }

  if (isErrorWithStatusCode(error)) {
    return error.statusCode ?? error.response?.status;
  }

  return undefined;
}

/**
 * Check if error indicates a specific status code
 */
export function isErrorWithStatus(error: unknown, status: number): boolean {
  return getErrorStatusCode(error) === status;
}

/**
 * Common error status checks
 */
export const isUnauthorizedError = (error: unknown): boolean => isErrorWithStatus(error, 401);
export const isForbiddenError = (error: unknown): boolean => isErrorWithStatus(error, 403);
export const isNotFoundError = (error: unknown): boolean => isErrorWithStatus(error, 404);
export const isConflictError = (error: unknown): boolean => isErrorWithStatus(error, 409);
export const isServerError = (error: unknown): boolean => {
  const status = getErrorStatusCode(error);
  return status !== undefined && status >= 500;
};
