import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services';

const loginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, setLoading, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
   
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login(data);
      login(response.user, response.token, response.refreshToken);
      navigate('/');
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="ANAC"
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-windows-text">
            {t('common.appName')}
          </h1>
          <p className="text-windows-textSecondary mt-2">
            {t('auth.login')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-windows-error rounded-windows text-windows-error text-sm">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="admin@anac.com"
              error={errors.email ? t(errors.email.message as string) : undefined}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                error={errors.password ? t(errors.password.message as string) : undefined}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-windows-textSecondary hover:text-windows-text"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-windows-accent hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <Link
              to="/signup"
              className="text-sm text-windows-accent hover:underline"
            >
              {t('auth.dontHaveAccount')}
            </Link>
          </div>

          {/* Demo Credentials */}
          {/* <div className="mt-4 p-4 bg-gray-50 rounded-windows border border-windows-border">
            <p className="text-sm text-windows-textSecondary mb-2 font-medium">
              Identifiants de demo:
            </p>
            <div className="text-xs text-windows-textSecondary space-y-1">
              <p>
                <span className="font-medium">Admin:</span> admin@anac.com
              </p>
              <p>
                <span className="font-medium">Manager:</span> manager@anac.com
              </p>
              <p>
                <span className="font-medium">Mot de passe:</span> Admin@123
              </p>
            </div>
          </div> */}
        </div>

        {/* Language Toggle */}
        <div className="text-center mt-4">
          <button
            onClick={toggleLanguage}
            className="text-sm text-windows-textSecondary hover:text-windows-accent transition-colors"
          >
            {i18n.language === 'fr' ? 'English' : 'Francais'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
