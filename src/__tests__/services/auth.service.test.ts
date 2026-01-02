import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../lib/services/auth.service';
import { apiClient } from '../../lib/api/client';
import type { AuthResponse, LoginDto, RegisterDto } from '../../lib/types/api.types';

// Mock del API client
vi.mock('../../lib/api/client', () => {
  const mockApiClient = {
    post: vi.fn(),
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
    isAuthenticated: vi.fn(),
  };
  
  return {
    apiClient: mockApiClient,
    ApiClient: vi.fn(() => mockApiClient),
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and set auth tokens', async () => {
      const loginData: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
        passphrase: 'mypassphrase',
      };

      const mockResponse: AuthResponse = {
        access_token: 'mock-token',
        userKey: 'mock-user-key',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.login(loginData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(apiClient.setAuth).toHaveBeenCalledWith(
        mockResponse.access_token,
        mockResponse.userKey
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed login', async () => {
      const loginData: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
        passphrase: 'mypassphrase',
      };

      const mockError = new Error('Invalid credentials');
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(apiClient.setAuth).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register successfully and set auth tokens', async () => {
      const registerData: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        passphrase: 'mypassphrase',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const mockResponse: AuthResponse = {
        access_token: 'mock-token',
        userKey: 'mock-user-key',
        user: {
          id: '2',
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(apiClient.setAuth).toHaveBeenCalledWith(
        mockResponse.access_token,
        mockResponse.userKey
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear auth data', () => {
      authService.logout();

      expect(apiClient.clearAuth).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
      expect(apiClient.isAuthenticated).toHaveBeenCalled();
    });

    it('should return false when not authenticated', () => {
      vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
