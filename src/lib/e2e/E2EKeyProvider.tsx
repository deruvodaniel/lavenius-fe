import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient, ApiClientError } from '../api/client';
import {
  clearE2EUserKey,
  getE2EKeyState,
  setE2EUserKey,
  subscribeToE2EKeyState,
  updateE2EUserKeyBundleVersion,
} from './keyManager';
import {
  decryptUserKeyFromRecoveryBundle,
  type RecoveryUserKeyBundle,
  type UserKeyBundle,
  unwrapUserKey,
  userKeyToBase64,
  wrapUserKey,
} from './crypto';

interface KeyBundleResponse extends UserKeyBundle {
  userKeyBundleVersion: number;
}

interface RecoveryBundleResponse extends RecoveryUserKeyBundle {
  recoveryEnabled: boolean;
  userKeyBundleVersion: number;
}

interface E2EKeyContextValue {
  isUnlocked: boolean;
  isUnlocking: boolean;
  unlockWithPassphrase: (passphrase: string) => Promise<void>;
  recoverAndResetPassphrase: (recoverySecret: string, newPassphrase: string) => Promise<void>;
  lock: () => void;
  setKeyFromOnboarding: (userKey: Uint8Array, bundleVersion: number) => void;
}

const E2EKeyContext = createContext<E2EKeyContextValue | null>(null);

interface E2EKeyProviderProps {
  children: React.ReactNode;
}

const E2E_IDLE_LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const E2E_BACKGROUND_LOCK_TIMEOUT_MS = 2 * 60 * 1000;

function isMissingBundleError(error: unknown): boolean {
  return error instanceof ApiClientError && error.statusCode === 401;
}

export function E2EKeyProvider({ children }: E2EKeyProviderProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => !!getE2EKeyState().userKey);
  const bootstrappedUserRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const keyBundleCacheRef = useRef<{ userId: string; bundle: KeyBundleResponse } | null>(null);
  const recoveryBundleCacheRef = useRef<{ userId: string; bundle: RecoveryBundleResponse } | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToE2EKeyState((nextState) => {
      setIsUnlocked(!!nextState.userKey);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      return;
    }

    const currentKey = getE2EKeyState().userKey;
    if (currentKey) {
      apiClient.setUserKey(userKeyToBase64(currentKey));
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      clearE2EUserKey();
      apiClient.clearUserKey();
      bootstrappedUserRef.current = null;
      previousUserIdRef.current = null;
      keyBundleCacheRef.current = null;
      recoveryBundleCacheRef.current = null;
      return;
    }

    if (previousUserIdRef.current && previousUserIdRef.current !== userId) {
      clearE2EUserKey();
      apiClient.clearUserKey();
      bootstrappedUserRef.current = null;
      keyBundleCacheRef.current = null;
      recoveryBundleCacheRef.current = null;
    }

    previousUserIdRef.current = userId;
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isSignedIn || !userId || !isUnlocked) {
      return;
    }

    if (bootstrappedUserRef.current === userId) {
      return;
    }

    let cancelled = false;

    const ensureBootstrap = async () => {
      try {
        await apiClient.post('/auth', {});
        if (!cancelled) {
          bootstrappedUserRef.current = userId;
        }
      } catch {
        // Unlock/flow methods retry bootstrap before sensitive key-bundle calls.
      }
    };

    void ensureBootstrap();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId, isUnlocked]);

  const bootstrapSession = useCallback(async () => {
    if (!isSignedIn || !userId) {
      throw new Error('Not authenticated');
    }

    if (bootstrappedUserRef.current === userId) {
      return;
    }

    await apiClient.post('/auth', {});
    bootstrappedUserRef.current = userId;
  }, [isSignedIn, userId]);

  const setActiveKey = useCallback((userKey: Uint8Array, bundleVersion: number) => {
    setE2EUserKey(userKey, bundleVersion);
    apiClient.setUserKey(userKeyToBase64(userKey));
  }, []);

  const unlockWithPassphrase = useCallback(async (passphrase: string) => {
    setIsUnlocking(true);

    try {
      if (!userId) {
        throw new Error('Not authenticated');
      }
      await bootstrapSession();
      let bundle: KeyBundleResponse;
      const cachedBundle = keyBundleCacheRef.current;
      if (cachedBundle && cachedBundle.userId === userId) {
        bundle = cachedBundle.bundle;
      } else {
        bundle = await apiClient.get<KeyBundleResponse>('/auth/key-bundle');
        keyBundleCacheRef.current = { userId, bundle };
      }
      const userKey = await unwrapUserKey(bundle, passphrase);
      setActiveKey(userKey, bundle.userKeyBundleVersion);
    } finally {
      setIsUnlocking(false);
    }
  }, [bootstrapSession, setActiveKey, userId]);

  const recoverAndResetPassphrase = useCallback(async (recoverySecret: string, newPassphrase: string) => {
    setIsUnlocking(true);

    try {
      if (!userId) {
        throw new Error('Not authenticated');
      }
      await bootstrapSession();
      let recoveryBundle: RecoveryBundleResponse;
      const cachedBundle = recoveryBundleCacheRef.current;
      if (cachedBundle && cachedBundle.userId === userId) {
        recoveryBundle = cachedBundle.bundle;
      } else {
        recoveryBundle = await apiClient.get<RecoveryBundleResponse>('/auth/key-bundle/recovery');
        recoveryBundleCacheRef.current = { userId, bundle: recoveryBundle };
      }

      if (!recoveryBundle.recoveryEnabled) {
        throw new Error('Recovery is not enabled for this account');
      }

      const userKey = await decryptUserKeyFromRecoveryBundle(recoveryBundle, recoverySecret);
      const newBundle = await wrapUserKey(userKey, newPassphrase);
      const nextBundleVersion = recoveryBundle.userKeyBundleVersion + 1;

      await apiClient.post('/auth/reset-passphrase', {
        ...newBundle,
        userKeyBundleVersion: nextBundleVersion,
      });

      keyBundleCacheRef.current = null;
      recoveryBundleCacheRef.current = null;
      updateE2EUserKeyBundleVersion(nextBundleVersion);
      setActiveKey(userKey, nextBundleVersion);
    } finally {
      setIsUnlocking(false);
    }
  }, [bootstrapSession, setActiveKey, userId]);

  const lock = useCallback(() => {
    clearE2EUserKey();
    apiClient.clearUserKey();
  }, []);

  useEffect(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    hiddenAtRef.current = null;

    if (!isLoaded || !isSignedIn || !userId || !isUnlocked) {
      return;
    }

    const startIdleTimer = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = window.setTimeout(() => {
        lock();
      }, E2E_IDLE_LOCK_TIMEOUT_MS);
    };

    const handleActivity = () => {
      startIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;

      if (hiddenAt && Date.now() - hiddenAt >= E2E_BACKGROUND_LOCK_TIMEOUT_MS) {
        lock();
        return;
      }

      startIdleTimer();
    };

    startIdleTimer();

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      hiddenAtRef.current = null;
    };
  }, [isLoaded, isSignedIn, userId, isUnlocked, lock]);

  const setKeyFromOnboarding = useCallback((userKey: Uint8Array, bundleVersion: number) => {
    setActiveKey(userKey, bundleVersion);
  }, [setActiveKey]);

  const value = useMemo<E2EKeyContextValue>(() => ({
    isUnlocked,
    isUnlocking,
    unlockWithPassphrase,
    recoverAndResetPassphrase,
    lock,
    setKeyFromOnboarding,
  }), [isUnlocked, isUnlocking, unlockWithPassphrase, recoverAndResetPassphrase, lock, setKeyFromOnboarding]);

  return <E2EKeyContext.Provider value={value}>{children}</E2EKeyContext.Provider>;
}

export function useE2EKey(): E2EKeyContextValue {
  const context = useContext(E2EKeyContext);
  if (!context) {
    throw new Error('useE2EKey must be used within E2EKeyProvider');
  }
  return context;
}

export function isMissingE2EKeyBundle(error: unknown): boolean {
  return isMissingBundleError(error);
}
