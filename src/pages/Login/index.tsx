import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks';
import { loginSchema, type LoginFormData } from '../../utils';
import { RegulaIcon } from '../../components/common';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn(data);

    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
                <RegulaIcon className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-secondary font-semibold text-2xl">Sistema Antifraude</h1>
            <p className="text-secondary/60 mt-2 text-sm">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-error-container/30 border border-error-container rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-bold text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-surface-container-low rounded-lg">
            <p className="text-xs text-secondary/60 text-center font-bold uppercase tracking-wider mb-2">
              Credenciales de prueba
            </p>
            <div className="space-y-1">
              <p className="text-xs text-secondary text-center">
                <span className="font-bold">Admin:</span> admin@antifraude.com
              </p>
              <p className="text-xs text-secondary text-center">
                <span className="font-bold">Analista:</span> analista@antifraude.com
              </p>
              <p className="text-xs text-secondary/60 text-center">
                Contraseña: <span className="font-mono">password</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
