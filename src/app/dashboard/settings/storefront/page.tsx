'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Globe, DollarSign, Tag, Palette, CreditCard } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'HT', name: 'Haiti' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'NG', name: 'Nigeria' },
];

export default function StorefrontSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/storefront/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/storefront/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (countryCode: string) => {
    const enabled = [...settings.countries.enabled];
    const index = enabled.indexOf(countryCode);

    if (index > -1) {
      enabled.splice(index, 1);
    } else {
      enabled.push(countryCode);
    }

    setSettings({
      ...settings,
      countries: { ...settings.countries, enabled },
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load storefront settings</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storefront Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your public storefront for selling top-ups
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Storefront</span>
              <button
                onClick={() =>
                  setSettings({ ...settings, isActive: !settings.isActive })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.isActive ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">
                {settings.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Branding</CardTitle>
            </div>
            <CardDescription>
              Customize how your storefront appears to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={settings.branding.businessName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    branding: { ...settings.branding, businessName: e.target.value },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Brief description of your service..."
                value={settings.branding.description || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    branding: { ...settings.branding, description: e.target.value },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Support Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="support@example.com"
                  value={settings.branding.supportEmail || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, supportEmail: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+1 (555) 123-4567"
                  value={settings.branding.supportPhone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, supportPhone: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-20 rounded cursor-pointer"
                  value={settings.branding.primaryColor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, primaryColor: e.target.value },
                    })
                  }
                />
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={settings.branding.primaryColor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, primaryColor: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Available Countries</CardTitle>
            </div>
            <CardDescription>
              Select which countries you want to offer top-ups for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                checked={settings.countries.allEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    countries: { ...settings.countries, allEnabled: e.target.checked },
                  })
                }
                className="h-4 w-4"
              />
              <label className="text-sm font-medium text-blue-900">
                Enable all countries (recommended)
              </label>
            </div>

            {!settings.countries.allEnabled && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Popular countries (click to toggle):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => toggleCountry(country.code)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors text-left ${
                        settings.countries.enabled.includes(country.code)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Selected: {settings.countries.enabled.length} countries
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Pricing & Markup</CardTitle>
            </div>
            <CardDescription>
              Set how much markup to add on top of provider costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Markup Type</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={settings.pricing.markupType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, markupType: e.target.value },
                    })
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Markup Value
                  {settings.pricing.markupType === 'percentage' ? ' (%)' : ` (${settings.pricing.currency})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={settings.pricing.markupValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, markupValue: parseFloat(e.target.value) },
                    })
                  }
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Example Calculation:</p>
              <p className="text-xs text-muted-foreground">
                Provider cost: $10.00<br />
                Your markup: {settings.pricing.markupType === 'percentage'
                  ? `${settings.pricing.markupValue}% = $${(10 * settings.pricing.markupValue / 100).toFixed(2)}`
                  : `$${settings.pricing.markupValue.toFixed(2)}`
                }<br />
                Customer pays: $
                {settings.pricing.markupType === 'percentage'
                  ? (10 + 10 * settings.pricing.markupValue / 100).toFixed(2)
                  : (10 + settings.pricing.markupValue).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Discount */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle>Discount Offers</CardTitle>
            </div>
            <CardDescription>
              Optionally offer discounts to attract customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.discount.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    discount: { ...settings.discount, enabled: e.target.checked },
                  })
                }
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Enable discount offers</label>
            </div>

            {settings.discount.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount Type</label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={settings.discount.type || 'percentage'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          discount: { ...settings.discount, type: e.target.value },
                        })
                      }
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount Value</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={settings.discount.value || 0}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          discount: { ...settings.discount, value: parseFloat(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Purchase Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 20"
                    value={settings.discount.minPurchaseAmount || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        discount: {
                          ...settings.discount,
                          minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Discount Description (shown to customers)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Special launch offer!"
                    value={settings.discount.description || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        discount: { ...settings.discount, description: e.target.value },
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Payment Methods</CardTitle>
            </div>
            <CardDescription>
              Enable payment methods (must be configured in Integrations first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.stripe}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, stripe: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Stripe</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.paypal}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, paypal: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">PayPal</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.pgpay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentMethods: { ...settings.paymentMethods, pgpay: e.target.checked },
                    })
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">PGPay</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
