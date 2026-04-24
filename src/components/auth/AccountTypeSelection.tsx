import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { Loader2, Stethoscope, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountType } from '@/lib/auth/accountType';

export function AccountTypeSelection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [savingType, setSavingType] = useState<AccountType | null>(null);

  const handleSelectAccountType = async (accountType: AccountType) => {
    if (!user) {
      return;
    }

    setSavingType(accountType);

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          accountType,
          accountTypeSelectedAt: new Date().toISOString(),
        },
      });

      toast.success(t('auth.accountTypeSelection.success'));
      navigate(accountType === AccountType.Therapist ? '/onboarding' : '/');
    } catch (error) {
      console.error('Failed to persist account type:', error);
      toast.error(t('auth.accountTypeSelection.error'));
    } finally {
      setSavingType(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-300/25 dark:bg-indigo-700/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-300/25 dark:bg-purple-700/20 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-xl shadow-2xl border-border/70 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle>{t('auth.accountTypeSelection.title')}</CardTitle>
          <CardDescription>{t('auth.accountTypeSelection.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-4 px-4 justify-start"
            disabled={savingType !== null}
            onClick={() => handleSelectAccountType(AccountType.Therapist)}
          >
            {savingType === AccountType.Therapist ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Stethoscope className="w-5 h-5 mr-3 text-indigo-600" />
            )}
            <span className="text-left">
              <span className="block font-semibold">{t('auth.accountTypeSelection.therapistTitle')}</span>
              <span className="block text-xs text-muted-foreground">{t('auth.accountTypeSelection.therapistDescription')}</span>
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-4 px-4 justify-start"
            disabled={savingType !== null}
            onClick={() => handleSelectAccountType(AccountType.Patient)}
          >
            {savingType === AccountType.Patient ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <UserRound className="w-5 h-5 mr-3 text-indigo-600" />
            )}
            <span className="text-left">
              <span className="block font-semibold">{t('auth.accountTypeSelection.patientTitle')}</span>
              <span className="block text-xs text-muted-foreground">{t('auth.accountTypeSelection.patientDescription')}</span>
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountTypeSelection;
