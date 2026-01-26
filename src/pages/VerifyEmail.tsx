import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, AlertCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authService } from '@/services';

const VerifyEmail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token provided');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await authService.verifyEmail(token);
        if (result.success) {
          setIsVerified(true);
        } else {
          setError(result.message || 'Invalid or expired verification link');
        }
      } catch {
        setError('Invalid or expired verification link');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch {
      setError('Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <Loader2 className="w-12 h-12 text-windows-accent animate-spin mx-auto mb-4" />
            <p className="text-windows-textSecondary">{t('auth.verifyingEmail')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isVerified) {
    return (
      <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src="/Logo.png"
              alt="ANAC"
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-semibold text-windows-text">
              {t('common.appName')}
            </h1>
          </div>

          <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-windows-text mb-2">
              {t('auth.emailVerified')}
            </h2>
            <p className="text-windows-textSecondary mb-6">
              {t('auth.emailVerifiedMessage')}
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              {t('auth.goToLogin')}
            </Button>
          </div>

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
  }

  // Error state - allow resending
  return (
    <div className="min-h-screen bg-windows-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="ANAC"
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-windows-text">
            {t('common.appName')}
          </h1>
        </div>

        <div className="bg-windows-surface rounded-windows-lg shadow-windows border border-windows-border p-6">
          {!resendSuccess ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-windows-text mb-2">
                  {t('auth.verificationFailed')}
                </h2>
                <p className="text-windows-textSecondary">
                  {error || t('auth.verificationFailedMessage')}
                </p>
              </div>

              <div className="border-t border-windows-border pt-6">
                <p className="text-sm text-windows-textSecondary mb-4 text-center">
                  {t('auth.resendVerificationPrompt')}
                </p>
                <form onSubmit={handleResend} className="space-y-4">
                  <Input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={resendLoading}
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    {t('auth.resendVerification')}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-windows-text mb-2">
                {t('auth.verificationEmailSent')}
              </h2>
              <p className="text-windows-textSecondary">
                {t('auth.verificationEmailSentMessage')}
              </p>
            </div>
          )}

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

export default VerifyEmail;
