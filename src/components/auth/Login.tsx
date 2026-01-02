import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useErrorToast } from '@/lib/hooks';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  passphrase: z.string().min(6, 'Passphrase debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  useErrorToast(error, clearError);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      passphrase: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by store and displayed via useErrorToast
      console.error('Login failed:', err);
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
            Lavenius
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-base">
            Plataforma de gestión psicológica
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
                    <FormLabel className="text-gray-700 font-medium">Passphrase (Encriptación)</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="••••••••"
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
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  ¿No tienes cuenta? <span className="font-semibold">Regístrate aquí</span>
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}