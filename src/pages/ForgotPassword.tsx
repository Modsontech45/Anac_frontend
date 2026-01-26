import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/services';

const forgotPasswordSchema = z.object({
  email: z.string().email('validation.email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(data.email);
      setSuccess(true);
    } catch {
      // Always show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-windows-text mb-2">
              {t('auth.checkYourEmail')}
            </h2>
            <p className="text-windows-textSecondary mb-6">
              {t('auth.resetEmailSent')}
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToLogin')}
              </Button>
            </Link>
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
            {t('auth.forgotPasswordTitle')}
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6">
          <p className="text-sm text-windows-textSecondary mb-4">
            {t('auth.forgotPasswordDescription')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-windows-error rounded-windows text-windows-error text-sm">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="example@anac.com"
              error={errors.email ? t(errors.email.message as string) : undefined}
              {...register('email')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<Mail className="w-4 h-4" />}
            >
              {isLoading ? t('auth.sendingEmail') : t('auth.sendResetLink')}
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

export default ForgotPassword;
