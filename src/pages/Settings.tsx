import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw, Check, Eye, EyeOff, Building2, Clock } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import organizationService, { type Organization } from '@/services/organization.service';
import settingsService, { type LateArrivalThreshold } from '@/services/settings.service';
import { useAuthStore } from '@/store/authStore';

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Late arrival threshold state
  const [lateArrival, setLateArrival] = useState<LateArrivalThreshold | null>(null);
  const [isLoadingLateArrival, setIsLoadingLateArrival] = useState(true);
  const [isSavingLateArrival, setIsSavingLateArrival] = useState(false);
  const [lateArrivalEnabled, setLateArrivalEnabled] = useState(false);
  const [lateArrivalHour, setLateArrivalHour] = useState(9);
  const [lateArrivalMinute, setLateArrivalMinute] = useState(0);
  const [lateArrivalSaveStatus, setLateArrivalSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOrganization();
    fetchLateArrivalSettings();
  }, []);

  const fetchLateArrivalSettings = async () => {
    try {
      const data = await settingsService.getLateArrivalThreshold();
      setLateArrival(data);
      setLateArrivalEnabled(data.enabled);
      setLateArrivalHour(data.hour);
      setLateArrivalMinute(data.minute);
    } catch (error) {
      console.error('Failed to fetch late arrival settings:', error);
    } finally {
      setIsLoadingLateArrival(false);
    }
  };

  const handleSaveLateArrival = async () => {
    if (!isAdmin) return;

    setIsSavingLateArrival(true);
    setLateArrivalSaveStatus('idle');
    try {
      const data = await settingsService.updateLateArrivalThreshold({
        enabled: lateArrivalEnabled,
        hour: lateArrivalHour,
        minute: lateArrivalMinute,
      });
      setLateArrival(data);
      setLateArrivalSaveStatus('success');
      setTimeout(() => setLateArrivalSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save late arrival settings:', error);
      setLateArrivalSaveStatus('error');
      setTimeout(() => setLateArrivalSaveStatus('idle'), 3000);
    } finally {
      setIsSavingLateArrival(false);
    }
  };

  const fetchOrganization = async () => {
    try {
      const data = await organizationService.getMyOrganization();
      setOrganization(data);
      setNewName(data.name);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!organization) return;

    try {
      await navigator.clipboard.writeText(organization.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!isAdmin) return;

    setIsRegenerating(true);
    try {
      const newApiKey = await organizationService.regenerateApiKey();
      setOrganization(prev => prev ? { ...prev, apiKey: newApiKey } : null);
      setIsRegenerateModalOpen(false);
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveName = async () => {
    if (!isAdmin || !newName.trim()) return;

    setIsSavingName(true);
    try {
      const updated = await organizationService.updateName(newName.trim());
      setOrganization(updated);
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update organization name:', error);
    } finally {
      setIsSavingName(false);
    }
  };

  const maskedApiKey = organization?.apiKey
    ? `${organization.apiKey.slice(0, 8)}${'*'.repeat(48)}${organization.apiKey.slice(-8)}`
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-windows-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-windows-text">
          {t('settings.title')}
        </h1>
        <p className="text-windows-textSecondary mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Organization Card */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-windows-accent/10 rounded-lg">
            <Building2 className="w-6 h-6 text-windows-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-windows-text">
              {t('settings.organization')}
            </h2>
            <p className="text-sm text-windows-textSecondary">
              {t('settings.organizationDesc')}
            </p>
          </div>
        </div>

        {/* Organization Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-windows-text mb-2">
            {t('settings.organizationName')}
          </label>
          {isEditingName ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleSaveName}
                isLoading={isSavingName}
              >
                {t('common.save')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(organization?.name || '');
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-windows-text">{organization?.name}</span>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                >
                  {t('common.edit')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* API Key Section */}
        <div className="border-t border-windows-border pt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-windows-text">
              {t('settings.apiKey')}
            </label>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRegenerateModalOpen(true)}
                className="text-windows-error"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t('settings.regenerateApiKey')}
              </Button>
            )}
          </div>
          <p className="text-sm text-windows-textSecondary mb-3">
            {t('settings.apiKeyDesc')}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-windows-surface border border-windows-border rounded-lg p-3 font-mono text-sm overflow-x-auto">
              {showApiKey ? organization?.apiKey : maskedApiKey}
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? t('settings.hideApiKey') : t('settings.showApiKey')}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="primary"
              onClick={handleCopyApiKey}
              title={t('settings.copyApiKey')}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* ESP32 Instructions */}
          <div className="mt-4 p-4 bg-windows-surface rounded-lg border border-windows-border">
            <h4 className="text-sm font-medium text-windows-text mb-2">
              {t('settings.esp32Instructions')}
            </h4>
            <p className="text-sm text-windows-textSecondary mb-2">
              {t('settings.esp32InstructionsDesc')}
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const char* apiKey = "${showApiKey ? organization?.apiKey : 'your_api_key_here'}";`}
            </pre>
          </div>
        </div>
      </Card>

      {/* Late Arrival Settings Card */}
      {isAdmin && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-windows-accent/10 rounded-lg">
              <Clock className="w-6 h-6 text-windows-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-windows-text">
                {t('settings.lateArrival')}
              </h2>
              <p className="text-sm text-windows-textSecondary">
                {t('settings.lateArrivalDesc')}
              </p>
            </div>
          </div>

          {isLoadingLateArrival ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-windows-accent" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-windows-surface rounded-lg border border-windows-border">
                <div>
                  <label className="block text-sm font-medium text-windows-text">
                    {t('settings.enableLateTracking')}
                  </label>
                  <p className="text-sm text-windows-textSecondary mt-1">
                    {lateArrivalEnabled
                      ? t('settings.enableLateTrackingDesc')
                      : t('settings.disabledModeDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLateArrivalEnabled(!lateArrivalEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-windows-accent focus:ring-offset-2 ${
                    lateArrivalEnabled ? 'bg-windows-accent' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      lateArrivalEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Time Settings (only shown when enabled) */}
              {lateArrivalEnabled && (
                <div className="p-4 bg-windows-surface rounded-lg border border-windows-border">
                  <label className="block text-sm font-medium text-windows-text mb-2">
                    {t('settings.thresholdTime')}
                  </label>
                  <p className="text-sm text-windows-textSecondary mb-4">
                    {t('settings.thresholdTimeDesc')}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-windows-textSecondary">
                        {t('settings.hour')}:
                      </label>
                      <select
                        value={lateArrivalHour}
                        onChange={(e) => setLateArrivalHour(parseInt(e.target.value, 10))}
                        className="px-3 py-2 bg-windows-bg border border-windows-border rounded-lg text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-windows-textSecondary">
                        {t('settings.minute')}:
                      </label>
                      <select
                        value={lateArrivalMinute}
                        onChange={(e) => setLateArrivalMinute(parseInt(e.target.value, 10))}
                        className="px-3 py-2 bg-windows-bg border border-windows-border rounded-lg text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent"
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-lg font-semibold text-windows-text">
                      = {lateArrivalHour.toString().padStart(2, '0')}:{lateArrivalMinute.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* Save Button and Status Message */}
              <div className="flex items-center justify-between">
                {/* Status Message */}
                <div className="flex items-center gap-2">
                  {lateArrivalSaveStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('settings.lateArrivalSaved')}</span>
                    </div>
                  )}
                  {lateArrivalSaveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 animate-fade-in">
                      <span className="text-sm font-medium">{t('settings.lateArrivalError')}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={handleSaveLateArrival}
                  isLoading={isSavingLateArrival}
                  disabled={
                    lateArrival?.enabled === lateArrivalEnabled &&
                    lateArrival?.hour === lateArrivalHour &&
                    lateArrival?.minute === lateArrivalMinute
                  }
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Regenerate API Key Modal */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title={t('settings.regenerateApiKeyTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRegenerateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleRegenerateApiKey}
              isLoading={isRegenerating}
            >
              {t('settings.regenerateApiKey')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-windows-text">
            {t('settings.regenerateApiKeyWarning')}
          </p>
          <ul className="list-disc list-inside text-sm text-windows-textSecondary space-y-1">
            <li>{t('settings.regenerateWarning1')}</li>
            <li>{t('settings.regenerateWarning2')}</li>
            <li>{t('settings.regenerateWarning3')}</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
