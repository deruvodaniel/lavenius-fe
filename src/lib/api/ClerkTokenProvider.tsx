/**
 * ClerkTokenProvider
 *
 * Initializes the API client with Clerk's token getter.
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
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from './client';

interface ClerkTokenProviderProps {
  children: React.ReactNode;
}

export function ClerkTokenProvider({ children }: ClerkTokenProviderProps) {
  const { getToken, isLoaded } = useAuth();
  const tokenInitialized = useRef(false);

  // Initialize Clerk token getter (once)
  useEffect(() => {
    if (isLoaded && !tokenInitialized.current) {
      apiClient.setTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
      tokenInitialized.current = true;
    }
  }, [getToken, isLoaded]);

  return <>{children}</>;
}

export default ClerkTokenProvider;
