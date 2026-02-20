import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/lib/hooks';
import { getErrorMessage } from '@/lib/utils/error';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import type { TFunction } from 'i18next';

// Password validation rules
const passwordRules = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

// Create schema with translations
function createRegisterSchema(t: TFunction) {
  return z.object({
    email: z.string()
      .min(1, t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
    password: z.string()
      .min(passwordRules.minLength, t('auth.validation.passwordMinLength', { count: passwordRules.minLength }))
      .regex(passwordRules.hasUppercase, t('auth.validation.passwordUppercase'))
      .regex(passwordRules.hasLowercase, t('auth.validation.passwordLowercase'))
      .regex(passwordRules.hasNumber, t('auth.validation.passwordNumber'))
      .regex(passwordRules.hasSpecial, t('auth.validation.passwordSpecial')),
    passphrase: z.string()
      .min(6, t('auth.validation.passphraseMinLength', { count: 6 })),
    firstName: z.string()
      .min(1, t('auth.validation.firstNameRequired'))
      .min(2, t('auth.validation.firstNameMinLength', { count: 2 })),
    lastName: z.string()
      .min(1, t('auth.validation.lastNameRequired'))
      .min(2, t('auth.validation.lastNameMinLength', { count: 2 })),
    phone: z.string().optional(),
    licenseNumber: z.string().optional(),
  });
}

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

// Password strength indicator component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const { t } = useTranslation();
  
  const checks = [
    { label: t('auth.passwordRequirements.minLength', { count: passwordRules.minLength }), valid: password.length >= passwordRules.minLength },
    { label: t('auth.passwordRequirements.uppercase'), valid: passwordRules.hasUppercase.test(password) },
    { label: t('auth.passwordRequirements.lowercase'), valid: passwordRules.hasLowercase.test(password) },
    { label: t('auth.passwordRequirements.number'), valid: passwordRules.hasNumber.test(password) },
    { label: t('auth.passwordRequirements.special'), valid: passwordRules.hasSpecial.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  const allValid = validCount === checks.length;

  if (!password) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-2">
        {t('auth.passwordRequirements.title')}
      </p>
      <ul className="space-y-1">
        {checks.map((check, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {check.valid ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className={check.valid ? 'text-green-700' : 'text-gray-500'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
      {allValid && (
        <p className="mt-2 text-xs text-green-600 font-medium">
          {t('auth.passwordRequirements.secure')}
        </p>
      )}
    </div>
  );
}

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading, clearError } = useAuth();
  const [watchPassword, setWatchPassword] = useState('');

  // Memoize schema to recreate only when language changes
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passphrase: '',
      firstName: '',
      lastName: '',
      phone: '',
      licenseNumber: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await register(data);
      toast.success(t('auth.accountCreated'), {
        description: t('auth.loginToContinue')
      });
      navigate('/login?registered=true');
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, '');
      const errorMsgLower = errorMsg.toLowerCase();
      
      // Provide specific user-friendly messages
      if (errorMsgLower.includes('email') && (errorMsgLower.includes('exist') || errorMsgLower.includes('registrado') || errorMsgLower.includes('duplicate'))) {
        toast.error(t('auth.errors.emailExists'), {
          description: t('auth.errors.emailExistsHint')
        });
      } else if (errorMsgLower.includes('password') || errorMsgLower.includes('contraseña') || errorMsgLower.includes('senha')) {
        toast.error(t('auth.errors.passwordError'), {
          description: errorMsg
        });
      } else if (errorMsgLower.includes('validation') || errorMsgLower.includes('validación') || errorMsgLower.includes('validação')) {
        toast.error(t('auth.errors.validationError'), {
          description: t('auth.errors.validationErrorHint')
        });
      } else {
        toast.error(t('auth.errors.createAccountError'), {
          description: t('auth.errors.createAccountErrorHint')
        });
      }
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('auth.createAccount')}
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-base">
            {t('auth.platformDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('auth.firstName')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t('auth.enterFirstName')}
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('auth.lastName')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t('auth.enterLastName')}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('auth.phoneOptional')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder={t('auth.enterPhone')}
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
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('auth.licenseNumberOptional')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t('auth.enterLicense')}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        onChange={(e) => {
                          field.onChange(e);
                          setWatchPassword(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <PasswordStrengthIndicator password={watchPassword} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      {t('auth.passphrase')}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder={t('auth.enterPassword')}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('auth.passphraseHelp')} <strong>{t('auth.passphraseWarning')}</strong>, {t('auth.passphraseCannotRecover')}
                    </p>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? t('auth.registering') : t('auth.createAccount')}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  {t('auth.hasAccount')} <span className="font-semibold">{t('auth.loginHere')}</span>
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
