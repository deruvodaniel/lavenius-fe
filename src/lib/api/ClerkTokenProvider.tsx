/**
 * ClerkTokenProvider
 *
 * Initializes the API client with Clerk's token getter and automatically
 * fetches the E2E encryption key (userKey) after sign-in by calling POST /auth
 * with backend passphrase (therapistId) saved during register.
 *
 * Usage:
 * ```tsx
 * <ClerkProvider>
 *   <ClerkTokenProvider>
 *     <App />
 *   </ClerkTokenProvider>
 * </ClerkProvider>
 * ```
 */

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { onboardingService } from '../services';
import { apiClient } from './client';

interface ClerkTokenProviderProps {
  children: React.ReactNode;
}

export function ClerkTokenProvider({ children }: ClerkTokenProviderProps) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const tokenInitialized = useRef(false);
  const keyFetchedForUser = useRef<string | null>(null);

  // Initialize Clerk token getter (once)
  useEffect(() => {
    if (isLoaded && !tokenInitialized.current) {
      apiClient.setTokenGetter(async () => {
        try {
          return await getToken();
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Failed to get Clerk token:', error);
          }
          return null;
        }
      });
      tokenInitialized.current = true;
    }
  }, [getToken, isLoaded]);

  // Fetch E2E encryption userKey after sign-in (once per session per user)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    if (keyFetchedForUser.current === userId) return;

    const initializeUserKey = async () => {
      const storedBackendPassphrase = onboardingService.getBackendPassphrase(userId);
      const unsafeMetadata = user?.unsafeMetadata as Record<string, unknown> | undefined;
      const onboardingComplete = unsafeMetadata?.onboardingComplete === true;

      // During onboarding, backend user may not exist yet.
      // Skip /auth bootstrap until onboarding completes or we already know a backend passphrase.
      if (!storedBackendPassphrase && !onboardingComplete) {
        return;
      }

      const passphraseCandidates = [storedBackendPassphrase].filter(
        (value): value is string => !!value
      );

      for (const passphrase of passphraseCandidates) {
        try {
          const response = await apiClient.post<{ user: { id: string }; userKey: string }>('/auth', { passphrase });
          if (response?.userKey) {
            apiClient.setUserKey(response.userKey);
            keyFetchedForUser.current = userId;
            onboardingService.saveBackendPassphrase(userId, passphrase);
            if (import.meta.env.DEV) {
              console.log('Encryption key initialized for user:', userId);
            }
            return;
          }
        } catch {
          // try next candidate
        }
      }

      if (import.meta.env.DEV) {
        console.warn('Failed to fetch encryption key during bootstrap');
      }
    };

    void initializeUserKey();
  }, [isLoaded, isSignedIn, userId, user]);

  return <>{children}</>;
}

export default ClerkTokenProvider;
