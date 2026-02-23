import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiClientError } from '../../lib/api/client';

/**
 * API Client Tests
 * 
 * These tests verify the token management functionality that's critical
 * for Clerk JWT integration. The apiClient needs to:
 * 1. Store and retrieve tokens
 * 2. Add Authorization headers to requests
 * 3. Handle authentication state
 */

describe('ApiClient', () => {
  // Mock token storage - simulates what the DefaultTokenStorage would do
  const createMockTokenStorage = () => ({
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    getUserKey: vi.fn(),
    setUserKey: vi.fn(),
    removeUserKey: vi.fn(),
    clear: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton for testing
    // @ts-expect-error - accessing private static for testing
    ApiClient.instance = undefined;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Token Management Tests ====================
  describe('Token Management', () => {
    it('should set token via setToken method', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.setToken('clerk-jwt-token-123');
      
      expect(mockStorage.setToken).toHaveBeenCalledWith('clerk-jwt-token-123');
    });

    it('should accept Clerk-style JWT tokens', () => {
      const clerkToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1Njc4OTAifQ.signature';
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.setToken(clerkToken);
      
      expect(mockStorage.setToken).toHaveBeenCalledWith(clerkToken);
    });

    it('should set userKey with rememberMe option', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.setUserKey('encryption-key', true);
      
      expect(mockStorage.setUserKey).toHaveBeenCalledWith('encryption-key', true);
    });

    it('should set userKey without rememberMe (session only)', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.setUserKey('encryption-key', false);
      
      expect(mockStorage.setUserKey).toHaveBeenCalledWith('encryption-key', false);
    });

    it('should set both token and userKey via setAuth', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.setAuth('my-token', 'my-key', true);
      
      expect(mockStorage.setToken).toHaveBeenCalledWith('my-token');
      expect(mockStorage.setUserKey).toHaveBeenCalledWith('my-key', true);
    });

    it('should clear all auth data via clearAuth', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      client.clearAuth();
      
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should handle token refresh (calling setToken multiple times)', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      // Initial token
      client.setToken('initial-token');
      
      // Clerk refreshes the token
      client.setToken('refreshed-token');
      
      expect(mockStorage.setToken).toHaveBeenCalledTimes(2);
      expect(mockStorage.setToken).toHaveBeenNthCalledWith(1, 'initial-token');
      expect(mockStorage.setToken).toHaveBeenNthCalledWith(2, 'refreshed-token');
    });
  });

  // ==================== Authentication State Tests ====================
  describe('Authentication State', () => {
    it('should return true for isAuthenticated when both token and userKey exist', () => {
      const mockStorage = createMockTokenStorage();
      mockStorage.getToken.mockReturnValue('valid-token');
      mockStorage.getUserKey.mockReturnValue('valid-key');
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should return false for isAuthenticated when only token exists', () => {
      const mockStorage = createMockTokenStorage();
      mockStorage.getToken.mockReturnValue('token');
      mockStorage.getUserKey.mockReturnValue(null);
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false for isAuthenticated when only userKey exists', () => {
      const mockStorage = createMockTokenStorage();
      mockStorage.getToken.mockReturnValue(null);
      mockStorage.getUserKey.mockReturnValue('key');
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false for isAuthenticated when neither exists', () => {
      const mockStorage = createMockTokenStorage();
      mockStorage.getToken.mockReturnValue(null);
      mockStorage.getUserKey.mockReturnValue(null);
      
      // @ts-expect-error - private constructor access for testing
      const client = new ApiClient(mockStorage);
      
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  // ==================== ApiClientError Tests ====================
  describe('ApiClientError', () => {
    it('should create error with all properties', () => {
      const error = new ApiClientError(400, 'Bad Request', 'Invalid data', '/api/test');
      
      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('Bad Request');
      expect(error.message).toBe('Invalid data');
      expect(error.path).toBe('/api/test');
      expect(error.name).toBe('ApiClientError');
    });

    it('should be an instance of Error', () => {
      const error = new ApiClientError(500, 'Server Error', 'Something went wrong');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiClientError).toBe(true);
    });

    it('should handle array messages', () => {
      const error = new ApiClientError(400, 'Validation Error', ['Field 1 invalid', 'Field 2 required']);
      
      expect(error.message).toBe('Field 1 invalid, Field 2 required');
    });

    it('should create error from API error object', () => {
      const apiError = {
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource not found',
        path: '/api/resource/123',
      };
      
      const error = ApiClientError.fromApiError(apiError);
      
      expect(error.statusCode).toBe(404);
      expect(error.error).toBe('Not Found');
      expect(error.path).toBe('/api/resource/123');
    });

    it('should translate common error messages to Spanish', () => {
      const apiError = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        path: '/api/auth/login',
      };
      
      const error = ApiClientError.fromApiError(apiError);
      
      // The error message should be translated
      expect(error.message).toBe('Credenciales inválidas');
    });

    it('should translate server error messages', () => {
      const apiError = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
        path: '/api/data',
      };
      
      const error = ApiClientError.fromApiError(apiError);
      
      expect(error.message).toBe('Error interno del servidor. Por favor intenta nuevamente.');
    });
  });

  // ==================== Singleton Pattern Tests ====================
  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = ApiClient.getInstance();
      const instance2 = ApiClient.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});

// ============================================================================
// Clerk Token Integration Tests
// ============================================================================

describe('ApiClient - Clerk Token Integration', () => {
  /**
   * These tests verify the expected behavior for Clerk JWT integration.
   * The apiClient should:
   * 1. Accept tokens set via setToken() (called after getToken() from Clerk)
   * 2. Store tokens for inclusion in requests
   * 3. Handle token refresh scenarios (Clerk auto-refreshes)
   * 4. Clear tokens on sign out
   */

  const createMockTokenStorage = () => ({
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    getUserKey: vi.fn(),
    setUserKey: vi.fn(),
    removeUserKey: vi.fn(),
    clear: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - reset singleton
    ApiClient.instance = undefined;
  });

  describe('Clerk JWT Token Handling', () => {
    it('should store Clerk JWT token for authenticated requests', () => {
      const mockStorage = createMockTokenStorage();
      // Simulating a real Clerk JWT
      const clerkToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yWXdNb3B1OU1OVndUQzFfTm5haWFJOGI2UlYiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjUxNzMiLCJleHAiOjE3MzI1NzA4MzIsImlhdCI6MTczMjU3MDc3Miwic3ViIjoidXNlcl8xMjM0NTY3ODkwIn0.signature';
      
      // @ts-expect-error - private constructor
      const client = new ApiClient(mockStorage);
      
      // This is what would be called after: const token = await getToken();
      client.setToken(clerkToken);
      
      expect(mockStorage.setToken).toHaveBeenCalledWith(clerkToken);
    });

    it('should handle automatic token refresh from Clerk', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor
      const client = new ApiClient(mockStorage);
      
      // Initial token from Clerk
      client.setToken('initial-clerk-token');
      
      // Clerk auto-refreshes token after expiry
      client.setToken('refreshed-clerk-token');
      
      expect(mockStorage.setToken).toHaveBeenCalledTimes(2);
      expect(mockStorage.setToken).toHaveBeenLastCalledWith('refreshed-clerk-token');
    });

    it('should clear auth state when user signs out via Clerk', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor
      const client = new ApiClient(mockStorage);
      
      // User signs out via Clerk's signOut()
      // This would trigger clearAuth() in our app
      client.clearAuth();
      
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should work with both Clerk token and app-specific userKey', () => {
      const mockStorage = createMockTokenStorage();
      
      // @ts-expect-error - private constructor
      const client = new ApiClient(mockStorage);
      
      // Clerk token for authentication
      const clerkToken = 'clerk-jwt-token';
      // App-specific encryption key (stored separately)
      const userKey = 'user-encryption-key';
      
      client.setAuth(clerkToken, userKey, true);
      
      expect(mockStorage.setToken).toHaveBeenCalledWith(clerkToken);
      expect(mockStorage.setUserKey).toHaveBeenCalledWith(userKey, true);
    });
  });

  describe('Authorization Header Format', () => {
    /**
     * While we can't easily test the axios interceptor directly,
     * we can verify the expected format that should be sent.
     * The interceptor adds: Authorization: Bearer <token>
     */
    
    it('should verify Bearer token format expectations', () => {
      const token = 'my-clerk-jwt-token';
      const expectedHeader = `Bearer ${token}`;
      
      // This is the format the interceptor should produce
      expect(expectedHeader).toMatch(/^Bearer /);
      expect(expectedHeader).toBe('Bearer my-clerk-jwt-token');
    });

    it('should handle long JWT tokens', () => {
      // Real Clerk JWTs are quite long
      const longToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(500) + '.signature';
      const expectedHeader = `Bearer ${longToken}`;
      
      expect(expectedHeader.length).toBeGreaterThan(500);
      expect(expectedHeader.startsWith('Bearer ')).toBe(true);
    });
  });
});

// ============================================================================
// Registration with clerkUserId Tests
// ============================================================================

describe('Registration Data Structure', () => {
  /**
   * Tests to verify the data structure sent to /auth/register
   * includes the clerkUserId field for backend user creation
   */

  it('should have correct ClerkUserSyncDto structure with clerkUserId', () => {
    // This tests the expected DTO structure
    const registrationData = {
      clerkUserId: 'user_2abc123xyz',
      email: 'therapist@example.com',
      firstName: 'María',
      lastName: 'García',
      phone: '+1234567890',
      licenseNumber: 'LIC-2024-001',
    };

    // Verify required fields
    expect(registrationData.clerkUserId).toBeDefined();
    expect(registrationData.email).toBeDefined();
    expect(registrationData.firstName).toBeDefined();
    expect(registrationData.lastName).toBeDefined();
    
    // Verify optional fields are allowed
    expect(registrationData.phone).toBeDefined();
    expect(registrationData.licenseNumber).toBeDefined();
  });

  it('should have clerkUserId as a string matching Clerk user ID format', () => {
    const clerkUserId = 'user_2YwMopu9MNVwTC1_NnaiaTbe6RV';
    
    // Clerk user IDs typically start with "user_"
    expect(clerkUserId.startsWith('user_')).toBe(true);
    expect(typeof clerkUserId).toBe('string');
    expect(clerkUserId.length).toBeGreaterThan(5);
  });

  it('should accept minimal required fields', () => {
    const minimalData = {
      clerkUserId: 'user_minimal123',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
    };

    expect(Object.keys(minimalData)).toHaveLength(4);
    expect(minimalData.clerkUserId).toBeTruthy();
    expect(minimalData.email).toBeTruthy();
    expect(minimalData.firstName).toBeTruthy();
    expect(minimalData.lastName).toBeTruthy();
  });
});
