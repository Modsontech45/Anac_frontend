import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Key, Eye, EyeOff, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/services';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'validation.passwordStrength')
      .regex(/[A-Z]/, 'validation.passwordStrength')
      .regex(/[a-z]/, 'validation.passwordStrength')
      .regex(/[0-9]/, 'validation.passwordStrength'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { test: password.length >= 8, label: t('auth.passwordReq8Chars') },
    { test: /[A-Z]/.test(password), label: t('auth.passwordReqUppercase') },
    { test: /[a-z]/.test(password), label: t('auth.passwordReqLowercase') },
    { test: /[0-9]/.test(password), label: t('auth.passwordReqNumber') },
  ];

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsVerifying(false);
        return;
      }

      try {
        const result = await authService.verifyResetToken(token);
        setIsTokenValid(result.valid);
        setUserEmail(result.email);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    if (!token) return;

    setError(null);
    setIsLoading(true);

    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <Loader2 className="w-12 h-12 text-windows-accent animate-spin mx-auto mb-4" />
            <p className="text-windows-textSecondary">{t('auth.verifyingToken')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-windows-text mb-2">
              {t('auth.invalidToken')}
            </h2>
            <p className="text-windows-textSecondary mb-6">
              {t('auth.invalidTokenMessage')}
            </p>
            <div className="space-y-3">
              <Link to="/forgot-password" className="block">
                <Button variant="primary" className="w-full">
                  {t('auth.requestNewLink')}
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-windows-text mb-2">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-windows-textSecondary mb-6">
              {t('auth.passwordResetSuccessMessage')}
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              {t('auth.goToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            {t('auth.resetPasswordTitle')}
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6">
          {userEmail && (
            <p className="text-sm text-windows-textSecondary mb-4">
              {t('auth.resetPasswordFor')} <strong>{userEmail}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-windows-error rounded-windows text-windows-error text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                label={t('auth.newPassword')}
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password requirements */}
            {password && (
              <div className="text-xs space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 ${
                      req.test ? 'text-green-600' : 'text-windows-textSecondary'
                    }`}
                  >
                    <Check className={`w-3 h-3 ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Input
                label={t('auth.confirmNewPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="********"
                error={errors.confirmPassword ? t(errors.confirmPassword.message as string) : undefined}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-windows-textSecondary hover:text-windows-text"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<Key className="w-4 h-4" />}
            >
              {isLoading ? t('auth.resettingPassword') : t('auth.resetPasswordButton')}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-windows-accent hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </Link>
          </div>
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

export default ResetPassword;
