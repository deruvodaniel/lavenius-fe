import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/lib/hooks';
import { toast } from 'sonner';
import { useState } from 'react';

// Password validation rules
const passwordRules = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

const registerSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido (ej: usuario@dominio.com)'),
  password: z.string()
    .min(passwordRules.minLength, `La contraseña debe tener al menos ${passwordRules.minLength} caracteres`)
    .regex(passwordRules.hasUppercase, 'Debe incluir al menos una letra mayúscula')
    .regex(passwordRules.hasLowercase, 'Debe incluir al menos una letra minúscula')
    .regex(passwordRules.hasNumber, 'Debe incluir al menos un número')
    .regex(passwordRules.hasSpecial, 'Debe incluir al menos un carácter especial (!@#$%^&*...)'),
  passphrase: z.string()
    .min(6, 'La passphrase debe tener al menos 6 caracteres'),
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength indicator component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: `Mínimo ${passwordRules.minLength} caracteres`, valid: password.length >= passwordRules.minLength },
    { label: 'Una letra mayúscula (A-Z)', valid: passwordRules.hasUppercase.test(password) },
    { label: 'Una letra minúscula (a-z)', valid: passwordRules.hasLowercase.test(password) },
    { label: 'Un número (0-9)', valid: passwordRules.hasNumber.test(password) },
    { label: 'Un carácter especial (!@#$%...)', valid: passwordRules.hasSpecial.test(password) },
  ];

  const validCount = checks.filter(c => c.valid).length;
  const allValid = validCount === checks.length;

  if (!password) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-2">
        Requisitos de contraseña:
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
          ¡Contraseña segura!
        </p>
      )}
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading, clearError } = useAuth();
  const [watchPassword, setWatchPassword] = useState('');

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
      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Ahora puedes iniciar sesión con tus credenciales'
      });
      navigate('/login?registered=true');
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al registrar usuario';
      const errorMsgLower = errorMsg.toLowerCase();
      
      // Provide specific user-friendly messages
      if (errorMsgLower.includes('email') && (errorMsgLower.includes('exist') || errorMsgLower.includes('registrado') || errorMsgLower.includes('duplicate'))) {
        toast.error('Este email ya está registrado', {
          description: '¿Ya tienes cuenta? Intenta iniciar sesión.'
        });
      } else if (errorMsgLower.includes('password') || errorMsgLower.includes('contraseña')) {
        toast.error('Error en la contraseña', {
          description: errorMsg
        });
      } else if (errorMsgLower.includes('validation') || errorMsgLower.includes('validación')) {
        toast.error('Error de validación', {
          description: 'Por favor revisa que todos los campos estén correctos'
        });
      } else {
        toast.error('Error al crear cuenta', {
          description: 'Hubo un problema. Por favor intenta nuevamente.'
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
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-base">
            Regístrate en la plataforma de gestión psicológica
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
                      <FormLabel className="text-gray-700 font-medium">Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Juan"
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
                      <FormLabel className="text-gray-700 font-medium">Apellido</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Pérez"
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
                    <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="doctor@clinica.com"
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
                      <FormLabel className="text-gray-700 font-medium">Teléfono (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+54 11 1234-5678"
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
                      <FormLabel className="text-gray-700 font-medium">Matrícula (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="MN 12345"
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
                    <FormLabel className="text-gray-700 font-medium">Contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="••••••••"
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
                      Passphrase (Encriptación)
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta frase se usará para cifrar los datos sensibles de tus pacientes. <strong>No la olvides</strong>, no podrá ser recuperada.
                    </p>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  ¿Ya tienes cuenta? <span className="font-semibold">Inicia sesión</span>
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
