import { apiClient } from '../api/client';
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  ChangePassphraseDto,
} from '../types/api.types';

/**
 * Extended Login DTO with rememberMe option
 */
export interface LoginOptions extends LoginDto {
  rememberMe?: boolean;
}

/**
 * Authentication Service
 * Maneja todas las operaciones de autenticación con el backend
 */
export class AuthService {
  private readonly basePath = '/auth';

  /**
   * Register a new therapist user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Clear any existing auth data before register
    apiClient.clearAuth();
    
    const response = await apiClient.post<AuthResponse, RegisterDto>(
      `${this.basePath}/register`,
      data
    );

    // Guardar token y userKey automáticamente (no remember me on register)
    apiClient.setAuth(response.access_token, response.userKey, false);

    return response;
  }

  /**
   * Login with credentials and passphrase
   * @param data - Login credentials
   * @param rememberMe - If true, persists session across browser restarts
   */
  async login(data: LoginDto, rememberMe: boolean = false): Promise<AuthResponse> {
    // Clear any existing auth data before login
    apiClient.clearAuth();
    
    const response = await apiClient.post<AuthResponse, LoginDto>(
      `${this.basePath}/login`,
      data
    );

    // Guardar token y userKey con la preferencia de "Remember Me"
    apiClient.setAuth(response.access_token, response.userKey, rememberMe);

    return response;
  }

  /**
   * Change user's passphrase (requires current passphrase)
   */
  async changePassphrase(data: ChangePassphraseDto): Promise<void> {
    await apiClient.post<void, ChangePassphraseDto>(
      `${this.basePath}/change-passphrase`,
      data
    );
  }

  /**
   * Logout - clear local authentication data
   */
  logout(): void {
    apiClient.clearAuth();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export default
export default authService;
