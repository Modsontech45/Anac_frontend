import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CreditCard, Building2, Users, Mail, Sparkles } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  userLimit: string;
  features: string[];
  popular?: boolean;
  contactUs?: boolean;
}

const Subscription = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      id: 'standard',
      name: t('subscription.plans.standard'),
      monthlyPrice: 30,
      yearlyPrice: 24, // 20% off
      userLimit: t('subscription.userLimits.standard'),
      features: [
        t('subscription.features.basicAttendance'),
        t('subscription.features.rfidSupport'),
        t('subscription.features.basicReports'),
        t('subscription.features.emailSupport'),
        t('subscription.features.upTo20Users'),
      ],
    },
    {
      id: 'pro',
      name: t('subscription.plans.pro'),
      monthlyPrice: 45,
      yearlyPrice: 36, // 20% off
      userLimit: t('subscription.userLimits.pro'),
      features: [
        t('subscription.features.allStandard'),
        t('subscription.features.advancedReports'),
        t('subscription.features.payrollIntegration'),
        t('subscription.features.prioritySupport'),
        t('subscription.features.upTo100Users'),
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: t('subscription.plans.enterprise'),
      monthlyPrice: 150,
      yearlyPrice: 120, // 20% off
      userLimit: t('subscription.userLimits.enterprise'),
      features: [
        t('subscription.features.allPro'),
        t('subscription.features.customIntegrations'),
        t('subscription.features.dedicatedManager'),
        t('subscription.features.slaGuarantee'),
        t('subscription.features.upTo250Users'),
      ],
    },
    {
      id: 'custom',
      name: t('subscription.plans.custom'),
      monthlyPrice: null,
      yearlyPrice: null,
      userLimit: t('subscription.userLimits.custom'),
      features: [
        t('subscription.features.allEnterprise'),
        t('subscription.features.unlimitedUsers'),
        t('subscription.features.customDevelopment'),
        t('subscription.features.onPremise'),
        t('subscription.features.dedicatedSupport'),
      ],
      contactUs: true,
    },
  ];

  const handleSubscribe = (planId: string) => {
    // This would integrate with Stripe or other payment provider
    console.log(`Subscribing to plan: ${planId}, billing: ${billingCycle}`);
    alert(t('subscription.comingSoon'));
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:contact@anac.com?subject=Custom Plan Inquiry';
  };

  const getPrice = (plan: PricingPlan) => {
    if (plan.contactUs) return null;
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getYearlySavings = (plan: PricingPlan) => {
    if (!plan.monthlyPrice || !plan.yearlyPrice) return 0;
    const monthlyCostPerYear = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice * 12;
    return monthlyCostPerYear - yearlyCost;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-windows-text mb-2">
          {t('subscription.title')}
        </h1>
        <p className="text-windows-textSecondary max-w-2xl mx-auto">
          {t('subscription.subtitle')}
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span
          className={`text-sm font-medium ${
            billingCycle === 'monthly' ? 'text-windows-text' : 'text-windows-textSecondary'
          }`}
        >
          {t('subscription.monthly')}
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingCycle === 'yearly' ? 'bg-windows-accent' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            billingCycle === 'yearly' ? 'text-windows-text' : 'text-windows-textSecondary'
          }`}
        >
          {t('subscription.yearly')}
        </span>
        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
          {t('subscription.save20')}
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-windows-surface rounded-xl border-2 p-6 flex flex-col ${
              plan.popular
                ? 'border-windows-accent shadow-lg scale-105'
                : 'border-windows-border'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-windows-accent text-white rounded-full">
                  <Sparkles className="w-3 h-3" />
                  {t('subscription.mostPopular')}
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-windows-accent/10 rounded-full mb-4">
                {plan.id === 'standard' && <Users className="w-6 h-6 text-windows-accent" />}
                {plan.id === 'pro' && <CreditCard className="w-6 h-6 text-windows-accent" />}
                {plan.id === 'enterprise' && <Building2 className="w-6 h-6 text-windows-accent" />}
                {plan.id === 'custom' && <Mail className="w-6 h-6 text-windows-accent" />}
              </div>
              <h3 className="text-xl font-bold text-windows-text">{plan.name}</h3>
              <p className="text-sm text-windows-textSecondary mt-1">{plan.userLimit}</p>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              {plan.contactUs ? (
                <div className="text-2xl font-bold text-windows-text">
                  {t('subscription.contactUs')}
                </div>
              ) : (
                <>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-windows-text">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-windows-textSecondary">
                      /{t('subscription.perMonth')}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      {t('subscription.savePerYear', { amount: getYearlySavings(plan) })}
                    </p>
                  )}
                  {billingCycle === 'monthly' && plan.yearlyPrice && (
                    <p className="text-xs text-windows-textSecondary mt-1">
                      {t('subscription.billedMonthly')}
                    </p>
                  )}
                  {billingCycle === 'yearly' && (
                    <p className="text-xs text-windows-textSecondary mt-1">
                      {t('subscription.billedYearly', { amount: (plan.yearlyPrice || 0) * 12 })}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-windows-text">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => plan.contactUs ? handleContactUs() : handleSubscribe(plan.id)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-windows-accent text-white hover:bg-windows-accent/90'
                  : plan.contactUs
                  ? 'bg-gray-100 text-windows-text hover:bg-gray-200 border border-windows-border'
                  : 'bg-windows-accent/10 text-windows-accent hover:bg-windows-accent/20'
              }`}
            >
              {plan.contactUs ? t('subscription.contactSales') : t('subscription.subscribe')}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-windows-text mb-4">
          {t('subscription.questionsTitle')}
        </h2>
        <p className="text-windows-textSecondary mb-4">
          {t('subscription.questionsSubtitle')}
        </p>
        <a
          href="mailto:support@anac.com"
          className="inline-flex items-center gap-2 text-windows-accent hover:underline"
        >
          <Mail className="w-4 h-4" />
          support@anac.com
        </a>
      </div>

      {/* Payment Methods */}
      <div className="mt-10 text-center">
        <p className="text-xs text-windows-textSecondary mb-3">
          {t('subscription.securePayments')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
            Visa
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
            Mastercard
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
            PayPal
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
            Mobile Money
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
