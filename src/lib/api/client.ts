/// <reference types="vite/client" />
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '../types/api.types';

/**
 * API Client Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string | string[],
    public path?: string
  ) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'ApiClientError';
  }

  static fromApiError(error: ApiError): ApiClientError {
    return new ApiClientError(
      error.statusCode,
      error.error,
      error.message,
      error.path
    );
  }
}

/**
 * Token Storage Interface
 */
interface TokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  getUserKey(): string | null;
  setUserKey(key: string): void;
  removeUserKey(): void;
  clear(): void;
}

/**
 * Default Token Storage Implementation
 * Token persists across sessions, userKey only for current session
 */
class DefaultTokenStorage implements TokenStorage {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'userKey';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getUserKey(): string | null {
    // IMPORTANTE: Solo en sessionStorage por seguridad
    return sessionStorage.getItem(this.USER_KEY);
  }

  setUserKey(key: string): void {
    sessionStorage.setItem(this.USER_KEY, key);
  }

  removeUserKey(): void {
    sessionStorage.removeItem(this.USER_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeUserKey();
  }
}

/**
 * API Client Class
 * Singleton instance for managing HTTP requests
 */
export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private tokenStorage: TokenStorage;
  private onUnauthorizedCallback?: () => void;

  private constructor(tokenStorage?: TokenStorage) {
    this.tokenStorage = tokenStorage || new DefaultTokenStorage();
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  static getInstance(tokenStorage?: TokenStorage): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(tokenStorage);
    }
    return ApiClient.instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );
  }

  /**
   * Handle outgoing requests - add auth headers
   */
  private handleRequest(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    const token = this.tokenStorage.getToken();
    const userKey = this.tokenStorage.getUserKey();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userKey) {
      config.headers['x-user-key'] = userKey;
    }

    // Disable caching for GET requests to always fetch fresh data
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache';
    }

    return config;
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: unknown): Promise<never> {
    console.error('Request error:', error);
    return Promise.reject(error);
  }

  /**
   * Handle successful responses
   */
  private handleResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
    return response;
  }

  /**
   * Handle response errors
   */
  private handleResponseError(error: unknown): Promise<never> {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError | undefined;

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        this.handleUnauthorized();
      }

      // Create custom error with API error details
      if (apiError) {
        return Promise.reject(ApiClientError.fromApiError(apiError));
      }

      // Network or timeout error
      if (!error.response) {
        return Promise.reject(
          new ApiClientError(
            0,
            'NetworkError',
            'No se pudo conectar con el servidor',
          )
        );
      }
    }

    return Promise.reject(error);
  }

  /**
   * Handle unauthorized responses
   */
  private handleUnauthorized(): void {
    this.clearAuth();
    this.onUnauthorizedCallback?.();
  }

  /**
   * Set callback for unauthorized responses
   */
  onUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.tokenStorage.setToken(token);
  }

  /**
   * Set user encryption key
   */
  setUserKey(userKey: string): void {
    this.tokenStorage.setUserKey(userKey);
  }

  /**
   * Set both token and userKey
   */
  setAuth(token: string, userKey: string): void {
    this.setToken(token);
    this.setUserKey(userKey);
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    this.tokenStorage.clear();
  }

  /**
   * Check if user is authenticated
   * Requires both token AND userKey to be present
   */
  isAuthenticated(): boolean {
    const hasToken = !!this.tokenStorage.getToken();
    const hasUserKey = !!this.tokenStorage.getUserKey();
    return hasToken && hasUserKey;
  }

  /**
   * Get axios instance for direct use
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

/**
 * Export singleton instance
 */
export const apiClient = ApiClient.getInstance();

/**
 * Export default instance for convenience
 */
export default apiClient;
