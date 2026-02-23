/**
 * ClerkTokenProvider
 * 
 * This component initializes the API client with Clerk's token getter.
 * It should be mounted inside the ClerkProvider to have access to useAuth.
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
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once when Clerk is loaded
    if (isLoaded && !isInitialized.current) {
      // Set the token getter that the API client will use for all requests
      apiClient.setTokenGetter(async () => {
        try {
          // Get the Clerk JWT token
          // This token is automatically refreshed by Clerk
          const token = await getToken();
          return token;
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Failed to get Clerk token:', error);
          }
          return null;
        }
      });

      isInitialized.current = true;

      if (import.meta.env.DEV) {
        console.log('API client initialized with Clerk token getter');
      }
    }
  }, [getToken, isLoaded]);

  return <>{children}</>;
}

export default ClerkTokenProvider;
