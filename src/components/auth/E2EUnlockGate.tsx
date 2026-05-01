import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, KeyRound, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useE2EKey } from '@/lib/e2e';
import { ApiClientError } from '@/lib/api/client';

interface E2EUnlockGateProps {
  children: React.ReactNode;
}

const MAX_UNLOCK_ATTEMPTS = 5;
const BASE_UNLOCK_BACKOFF_MS = 1000;
const MAX_UNLOCK_BACKOFF_MS = 30_000;
const UNLOCK_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const E2E_UNLOCK_STATE_STORAGE_KEY = 'tilia_e2e_unlock_state';

interface PersistedUnlockState {
  userId: string | null;
  failedUnlockAttempts: number;
  lastFailedAt: number | null;
  lockUntilTs: number | null;
}

function loadPersistedUnlockState(userId: string | null): PersistedUnlockState {
  try {
    const raw = window.sessionStorage.getItem(E2E_UNLOCK_STATE_STORAGE_KEY);
    if (!raw) {
      return {
        userId,
        failedUnlockAttempts: 0,
        lastFailedAt: null,
        lockUntilTs: null,
      };
    }

    const parsed = JSON.parse(raw) as PersistedUnlockState;
    if (parsed.userId !== userId) {
      return {
        userId,
        failedUnlockAttempts: 0,
        lastFailedAt: null,
        lockUntilTs: null,
      };
    }

    return {
      userId,
      failedUnlockAttempts: typeof parsed.failedUnlockAttempts === 'number' ? parsed.failedUnlockAttempts : 0,
      lastFailedAt: typeof parsed.lastFailedAt === 'number' ? parsed.lastFailedAt : null,
      lockUntilTs: typeof parsed.lockUntilTs === 'number' ? parsed.lockUntilTs : null,
    };
  } catch {
    return {
      userId,
      failedUnlockAttempts: 0,
      lastFailedAt: null,
      lockUntilTs: null,
    };
  }
}

function savePersistedUnlockState(state: PersistedUnlockState): void {
  try {
    window.sessionStorage.setItem(E2E_UNLOCK_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-blocking: if storage fails, keep runtime state only.
  }
}

function getUnlockErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiClientError) {
    if (error.statusCode === 401) {
      return t('e2eUnlock.errors.invalidCredentials');
    }
    if (error.statusCode === 429) {
      return t('e2eUnlock.errors.rateLimited');
    }
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t('e2eUnlock.errors.generic');
}

export function E2EUnlockGate({ children }: E2EUnlockGateProps) {
  const { t } = useTranslation();
  const { signOut, userId } = useClerkAuth();
  const { isUnlocked, isUnlocking, unlockWithPassphrase, recoverAndResetPassphrase } = useE2EKey();
  const [passphrase, setPassphrase] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [mode, setMode] = useState<'passphrase' | 'recovery'>('passphrase');
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [failedUnlockAttempts, setFailedUnlockAttempts] = useState(() =>
    loadPersistedUnlockState(userId ?? null).failedUnlockAttempts,
  );
  const [lastFailedAt, setLastFailedAt] = useState<number | null>(() =>
    loadPersistedUnlockState(userId ?? null).lastFailedAt,
  );
  const [lockUntilTs, setLockUntilTs] = useState<number | null>(() =>
    loadPersistedUnlockState(userId ?? null).lockUntilTs,
  );
  const [nowTs, setNowTs] = useState(() => Date.now());

  const isRecoveryValid = useMemo(() => {
    return (
      recoverySecret.trim().length > 0 &&
      newPassphrase.length >= 8 &&
      newPassphrase === confirmPassphrase
    );
  }, [confirmPassphrase, newPassphrase, recoverySecret]);
  const lockRemainingMs = lockUntilTs ? Math.max(lockUntilTs - nowTs, 0) : 0;
  const lockRemainingSeconds = Math.ceil(lockRemainingMs / 1000);
  const isBackoffActive = lockRemainingMs > 0;

  useEffect(() => {
    const persistedState = loadPersistedUnlockState(userId ?? null);
    setFailedUnlockAttempts(persistedState.failedUnlockAttempts);
    setLastFailedAt(persistedState.lastFailedAt);
    setLockUntilTs(persistedState.lockUntilTs);
  }, [userId]);

  useEffect(() => {
    savePersistedUnlockState({
      userId: userId ?? null,
      failedUnlockAttempts,
      lastFailedAt,
      lockUntilTs,
    });
  }, [failedUnlockAttempts, lastFailedAt, lockUntilTs, userId]);

  useEffect(() => {
    if (!lockUntilTs) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lockUntilTs]);

  useEffect(() => {
    if (!lockUntilTs || lockRemainingMs > 0) {
      return;
    }
    setLockUntilTs(null);
  }, [lockRemainingMs, lockUntilTs]);

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleSecuritySignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: '/' });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleUnlockSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isBackoffActive) {
      setError(t('e2eUnlock.security.retryIn', { seconds: lockRemainingSeconds }));
      return;
    }

    try {
      await unlockWithPassphrase(passphrase);
      setPassphrase('');
      setFailedUnlockAttempts(0);
      setLastFailedAt(null);
      setLockUntilTs(null);
    } catch (unlockError) {
      const now = Date.now();
      const previousFailedAt = lastFailedAt;
      const withinWindow =
        previousFailedAt !== null && now - previousFailedAt <= UNLOCK_ATTEMPT_WINDOW_MS;
      const nextFailedAttempts = withinWindow ? failedUnlockAttempts + 1 : 1;
      setFailedUnlockAttempts(nextFailedAttempts);
      setLastFailedAt(now);

      if (nextFailedAttempts >= MAX_UNLOCK_ATTEMPTS) {
        setError(t('e2eUnlock.security.maxAttemptsSignOut'));
        await handleSecuritySignOut();
        return;
      }

      const backoffMs = Math.min(
        BASE_UNLOCK_BACKOFF_MS * (2 ** (nextFailedAttempts - 1)),
        MAX_UNLOCK_BACKOFF_MS,
      );
      const nextLockUntilTs = now + backoffMs;
      setLockUntilTs(nextLockUntilTs);
      setNowTs(now);

      setError(getUnlockErrorMessage(unlockError, t));
    }
  };

  const handleRecoverySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isRecoveryValid) {
      setError(t('e2eUnlock.errors.invalidRecoveryInput'));
      return;
    }

    try {
      await recoverAndResetPassphrase(recoverySecret, newPassphrase);
      setRecoverySecret('');
      setNewPassphrase('');
      setConfirmPassphrase('');
      setMode('passphrase');
    } catch (recoveryError) {
      setError(getUnlockErrorMessage(recoveryError, t));
    }
  };

  const handleSignOutToHome = async () => {
    await handleSecuritySignOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-primary-light to-muted dark:from-background dark:via-primary-deep dark:to-background">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary-muted dark:bg-primary-deep/60 flex items-center justify-center mb-2">
            {mode === 'passphrase' ? (
              <KeyRound className="w-6 h-6 text-primary" />
            ) : (
              <RefreshCw className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle>
            {mode === 'passphrase' ? t('e2eUnlock.title.unlock') : t('e2eUnlock.title.recovery')}
          </CardTitle>
          <CardDescription>
            {mode === 'passphrase'
              ? t('e2eUnlock.description.unlock')
              : t('e2eUnlock.description.recovery')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {mode === 'passphrase' ? (
            <form className="space-y-4" onSubmit={handleUnlockSubmit}>
              <div className="space-y-2">
                <Label htmlFor="unlock-passphrase">{t('e2eUnlock.fields.passphrase')}</Label>
                <PasswordInput
                  id="unlock-passphrase"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  autoComplete="current-password"
                  disabled={isUnlocking || isBackoffActive}
                />
                {isBackoffActive && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    {t('e2eUnlock.security.retryIn', { seconds: lockRemainingSeconds })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('e2eUnlock.security.attemptsRemaining', {
                    count: Math.max(0, MAX_UNLOCK_ATTEMPTS - failedUnlockAttempts),
                  })}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isUnlocking || isBackoffActive || passphrase.length < 8}
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('e2eUnlock.actions.unlocking')}
                  </>
                ) : (
                  t('e2eUnlock.actions.unlock')
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                disabled={isUnlocking}
                onClick={() => {
                  setError(null);
                  setMode('recovery');
                }}
              >
                {t('e2eUnlock.actions.forgotPassphrase')}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRecoverySubmit}>
              <div className="space-y-2">
                <Label htmlFor="recovery-code">{t('e2eUnlock.fields.recoveryCode')}</Label>
                <Input
                  id="recovery-code"
                  value={recoverySecret}
                  onChange={(event) => setRecoverySecret(event.target.value)}
                  autoComplete="off"
                  disabled={isUnlocking}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-passphrase">{t('e2eUnlock.fields.newPassphrase')}</Label>
                <PasswordInput
                  id="new-passphrase"
                  value={newPassphrase}
                  onChange={(event) => setNewPassphrase(event.target.value)}
                  autoComplete="new-password"
                  disabled={isUnlocking}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-passphrase">{t('e2eUnlock.fields.confirmPassphrase')}</Label>
                <PasswordInput
                  id="confirm-passphrase"
                  value={confirmPassphrase}
                  onChange={(event) => setConfirmPassphrase(event.target.value)}
                  autoComplete="new-password"
                  disabled={isUnlocking}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isUnlocking || !isRecoveryValid}>
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('e2eUnlock.actions.recovering')}
                  </>
                ) : (
                  t('e2eUnlock.actions.resetAndUnlock')
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                disabled={isUnlocking}
                onClick={() => {
                  setError(null);
                  setMode('passphrase');
                }}
              >
                {t('e2eUnlock.actions.backToPassphrase')}
              </Button>
            </form>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 flex gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isUnlocking || isSigningOut}
            onClick={handleSignOutToHome}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.processing')}
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                {t('e2eUnlock.actions.signOutAndHome')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default E2EUnlockGate;
