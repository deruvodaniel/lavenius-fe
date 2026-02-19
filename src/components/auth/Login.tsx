import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/lib/hooks';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { LoginDto } from '@/lib/types/api.types';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error: _error, clearError } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  
  // Show success message if coming from registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast.success(t('auth.accountCreated'), {
        description: t('auth.loginToContinue')
      });
    }
  }, [searchParams, t]);

  const form = useForm<LoginDto>({
    defaultValues: {
      email: '',
      password: '',
      passphrase: '',
    },
  });

  const onSubmit = async (data: LoginDto) => {
    if (isLoading) return;
    
    clearError();
    setShowSignupPrompt(false);
    
    try {
      await login(data);
      toast.success(t('auth.welcomeBack'));
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err?.message || t('auth.loginError');
      const errorMsgLower = errorMsg.toLowerCase();
      
      // Check if error indicates user doesn't exist or invalid credentials
      const isAuthError = 
        errorMsgLower.includes('authentication') ||
        errorMsgLower.includes('unauthorized') ||
        errorMsgLower.includes('invalid') ||
        errorMsgLower.includes('credentials') ||
        errorMsgLower.includes('not found') ||
        errorMsgLower.includes('no existe');
      
      if (isAuthError) {
        setShowSignupPrompt(true);
        toast.error(t('auth.invalidCredentials'), {
          description: t('auth.invalidCredentialsHint')
        });
      } else {
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('landing.brand')}
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-base">
            {t('auth.platformDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('auth.enterEmail')}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">{t('auth.password')}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder={t('auth.enterPassword')}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">{t('auth.passphrase')}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder={t('auth.enterPassword')}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? t('auth.loggingIn') : t('auth.login')}
              </Button>

              {/* Signup prompt when auth fails */}
              {showSignupPrompt && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <p className="text-amber-800 text-sm">
                    {t('auth.firstTime')}
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('auth.createNewAccount')}
                  </Button>
                </div>
              )}

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  {t('auth.noAccount')} <span className="font-semibold">{t('auth.registerHere')}</span>
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}