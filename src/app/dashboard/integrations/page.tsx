'use client';

import { useState, useEffect } from 'react';
import { Plug, Check, AlertCircle, Save, TestTube, Link as LinkIcon, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  environment?: string;
  metadata?: {
    lastTestSuccess?: string;
    lastTestError?: string;
    accountBalance?: number;
  };
}

const integrationConfigs = {
  dingconnect: {
    name: 'DingConnect',
    description: 'Connect to DingConnect API for mobile top-ups and airtime distribution',
    icon: '📱',
    docsUrl: 'https://www.dingconnect.com/Api',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your DingConnect API key',
        required: true,
        helpText: 'Found in your DingConnect dashboard under API Settings',
      },
    ],
  },
  reloadly: {
    name: 'Reloadly',
    description: 'Alternative provider for airtime and mobile data top-ups worldwide',
    icon: '🌍',
    docsUrl: 'https://developers.reloadly.com/',
    fields: [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Enter your Reloadly client ID',
        required: true,
        helpText: 'Found in your Reloadly dashboard',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter your client secret',
        required: true,
        helpText: 'Keep this secure and never share it',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        placeholder: 'Select environment',
        required: true,
        helpText: 'Use sandbox for testing, production for live transactions',
      },
    ],
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/v1/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (provider: string) => {
    setSelectedProvider(provider);
    setTestMessage(null);
    // Pre-fill form if integration exists
    const existing = integrations.find((i) => i.provider === provider);
    if (existing) {
      // For Reloadly, keep environment field
      const defaultData: Record<string, any> = {};
      if (provider === 'reloadly') {
        defaultData.environment = existing.environment || 'sandbox';
      }
      setFormData(defaultData);
    } else {
      // Default environment for Reloadly only
      const defaultData: Record<string, any> = {};
      if (provider === 'reloadly') {
        defaultData.environment = 'sandbox';
      }
      setFormData(defaultData);
    }
  };

  const handleCloseModal = () => {
    setSelectedProvider(null);
    setFormData({});
    setTestMessage(null);
  };

  const handleTest = async () => {
    if (!selectedProvider) return;

    setTesting(true);
    setTestMessage(null);

    try {
      const config = integrationConfigs[selectedProvider as keyof typeof integrationConfigs];
      const credentials: Record<string, any> = {};

      config.fields.forEach((field) => {
        if (field.name !== 'environment') {
          credentials[field.name] = formData[field.name];
        }
      });

      const payload: any = {
        provider: selectedProvider,
        credentials,
      };

      // Only include environment for Reloadly
      if (selectedProvider === 'reloadly') {
        payload.environment = formData.environment;
      }

      const response = await fetch('/api/v1/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestMessage({
          type: 'success',
          text: `Connection successful! Balance: ${result.data.balance} ${result.data.currency}`,
        });
      } else {
        setTestMessage({
          type: 'error',
          text: result.error || 'Connection test failed',
        });
      }
    } catch (error: any) {
      setTestMessage({
        type: 'error',
        text: error.message || 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;

    setSaving(true);
    setTestMessage(null);

    try {
      const config = integrationConfigs[selectedProvider as keyof typeof integrationConfigs];
      const credentials: Record<string, any> = {};

      config.fields.forEach((field) => {
        if (field.name !== 'environment') {
          credentials[field.name] = formData[field.name];
        }
      });

      const payload: any = {
        provider: selectedProvider,
        credentials,
      };

      // Only include environment for Reloadly
      if (selectedProvider === 'reloadly') {
        payload.environment = formData.environment;
      }

      const response = await fetch('/api/v1/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setTestMessage({
          type: 'success',
          text: 'Configuration saved successfully! You can now close this dialog.',
        });
        await fetchIntegrations();
        // Don't close modal immediately so user can see success message
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        const error = await response.json();
        setTestMessage({
          type: 'error',
          text: error.error || 'Failed to save integration',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      setTestMessage({
        type: 'error',
        text: 'Failed to save integration',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getIntegrationStatus = (provider: string) => {
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration) return { status: 'disconnected', text: 'Not Connected' };
    if (integration.status === 'active') return { status: 'connected', text: 'Connected' };
    if (integration.status === 'error') return { status: 'error', text: 'Error' };
    return { status: 'disconnected', text: 'Not Connected' };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading integrations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect external services to enable top-up functionality
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Integration Required</h3>
                <p className="text-sm text-blue-800 mb-3">
                  You must connect at least one top-up provider (DingConnect or Reloadly) to process transactions.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-blue-800 hover:text-blue-900 hover:bg-blue-100 -ml-2"
                >
                  <Info className="h-4 w-4 mr-1" />
                  {showInstructions ? 'Hide' : 'Show'} Setup Instructions
                  {showInstructions ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>

            {/* Collapsible Instructions */}
            {showInstructions && (
              <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">DingConnect Setup:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 ml-2">
                    <li>
                      Visit{' '}
                      <a
                        href="https://www.dingconnect.com"
                        target="_blank"
                        rel="noopener"
                        className="underline hover:text-blue-600"
                      >
                        dingconnect.com
                      </a>{' '}
                      and create an account
                    </li>
                    <li>Complete the business verification process</li>
                    <li>Navigate to Settings → API Keys in your dashboard</li>
                    <li>Generate a new API key</li>
                    <li>Click "Configure" above and paste your API key</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Reloadly Setup:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 ml-2">
                    <li>
                      Visit{' '}
                      <a
                        href="https://www.reloadly.com"
                        target="_blank"
                        rel="noopener"
                        className="underline hover:text-blue-600"
                      >
                        reloadly.com
                      </a>{' '}
                      and sign up
                    </li>
                    <li>Complete your profile and business information</li>
                    <li>Go to Developers → API Credentials</li>
                    <li>Copy your Client ID and Client Secret</li>
                    <li>Click "Configure" above to enter your credentials</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations List */}
        <div className="space-y-4">
          {Object.entries(integrationConfigs).map(([providerId, config]) => {
            const status = getIntegrationStatus(providerId);
            return (
              <Card key={providerId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{config.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>{config.name}</CardTitle>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                              getStatusColor(status.status)
                            )}
                          >
                            {status.status === 'connected' && <Check className="h-3 w-3" />}
                            {status.text}
                          </span>
                        </div>
                        <CardDescription>{config.description}</CardDescription>
                        <div className="mt-3">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-xs"
                            onClick={() => window.open(config.docsUrl, '_blank')}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            API Documentation
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleOpenModal(providerId)}>
                      {status.status === 'connected' ? 'Reconfigure' : 'Configure'}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Configuration Modal */}
        <Dialog open={!!selectedProvider} onOpenChange={handleCloseModal}>
          <DialogContent>
            {selectedProvider && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Configure {integrationConfigs[selectedProvider as keyof typeof integrationConfigs].name}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your API credentials to connect this integration
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {integrationConfigs[selectedProvider as keyof typeof integrationConfigs].fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                        >
                          <option value="">Select...</option>
                          <option value="sandbox">Sandbox (Testing)</option>
                          <option value="production">Production (Live)</option>
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                        />
                      )}
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  {/* Test Message */}
                  {testMessage && (
                    <div
                      className={cn(
                        'p-3 rounded-lg text-sm',
                        testMessage.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      )}
                    >
                      {testMessage.text}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleTest} disabled={testing} variant="outline">
                    <TestTube className="h-4 w-4 mr-2" />
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
