import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/services';

const signupSchema = z
  .object({
    organizationName: z.string().min(1, 'validation.required').max(255),
    firstName: z.string().min(1, 'validation.required').max(100),
    lastName: z.string().min(1, 'validation.required').max(100),
    email: z.string().email('validation.email'),
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

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      organizationName: '',
      firstName: '',
      lastName: '',
      email: '',
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

  const onSubmit = async (data: SignupFormData, e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
      });
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

  if (success) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-windows-text mb-2">
              {t('auth.signupSuccess')}
            </h2>
            <p className="text-windows-textSecondary mb-6">
              {t('auth.signupSuccessMessage')}
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
            {t('auth.createAccount')}
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-windows-error rounded-windows text-windows-error text-sm">
                {error}
              </div>
            )}

            <Input
              label={t('auth.organizationName')}
              placeholder={t('auth.organizationNamePlaceholder')}
              error={errors.organizationName ? t(errors.organizationName.message as string) : undefined}
              {...register('organizationName')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('auth.firstName')}
                placeholder={t('auth.firstNamePlaceholder')}
                error={errors.firstName ? t(errors.firstName.message as string) : undefined}
                {...register('firstName')}
              />

              <Input
                label={t('auth.lastName')}
                placeholder={t('auth.lastNamePlaceholder')}
                error={errors.lastName ? t(errors.lastName.message as string) : undefined}
                {...register('lastName')}
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              placeholder="example@anac.com"
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
                label={t('auth.confirmPassword')}
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
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              {isLoading ? t('auth.creatingAccount') : t('auth.signupButton')}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-windows-accent hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.alreadyHaveAccount')}
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

export default Signup;
