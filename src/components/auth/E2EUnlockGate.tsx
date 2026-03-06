import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useE2EKey } from '@/lib/e2e';
import { ApiClientError } from '@/lib/api/client';

interface E2EUnlockGateProps {
  children: React.ReactNode;
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
  const { isUnlocked, isUnlocking, unlockWithPassphrase, recoverAndResetPassphrase } = useE2EKey();
  const [passphrase, setPassphrase] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [mode, setMode] = useState<'passphrase' | 'recovery'>('passphrase');
  const [error, setError] = useState<string | null>(null);

  const isRecoveryValid = useMemo(() => {
    return (
      recoverySecret.trim().length > 0 &&
      newPassphrase.length >= 8 &&
      newPassphrase === confirmPassphrase
    );
  }, [confirmPassphrase, newPassphrase, recoverySecret]);

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleUnlockSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await unlockWithPassphrase(passphrase);
      setPassphrase('');
    } catch (unlockError) {
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center mb-2">
            {mode === 'passphrase' ? (
              <KeyRound className="w-6 h-6 text-indigo-600" />
            ) : (
              <RefreshCw className="w-6 h-6 text-indigo-600" />
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
                <Input
                  id="unlock-passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  autoComplete="current-password"
                  disabled={isUnlocking}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isUnlocking || passphrase.length < 8}>
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
                <Input
                  id="new-passphrase"
                  type="password"
                  value={newPassphrase}
                  onChange={(event) => setNewPassphrase(event.target.value)}
                  autoComplete="new-password"
                  disabled={isUnlocking}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-passphrase">{t('e2eUnlock.fields.confirmPassphrase')}</Label>
                <Input
                  id="confirm-passphrase"
                  type="password"
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
        </CardContent>
      </Card>
    </div>
  );
}

export default E2EUnlockGate;
