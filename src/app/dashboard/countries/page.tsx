'use client';

import { useEffect, useState } from 'react';
import { Globe, Save, Search } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, toast } from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';
import { cn } from '@/lib/utils';

// Common countries for top-up services
const AVAILABLE_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function CountriesPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    try {
      const response = await fetch('/api/v1/storefront/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Country settings saved successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save country settings. Please try again.',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (countryCode: string) => {
    const enabled = [...(settings?.countries?.enabled || [])];
    const index = enabled.indexOf(countryCode);

    if (index > -1) {
      enabled.splice(index, 1);
    } else {
      enabled.push(countryCode);
    }

    setSettings({
      ...settings,
      countries: {
        ...settings?.countries,
        enabled,
        allEnabled: false, // Disable "all countries" when manually selecting
      },
    });
  };

  const toggleAllCountries = () => {
    setSettings({
      ...settings,
      countries: {
        ...settings?.countries,
        allEnabled: !settings?.countries?.allEnabled,
        enabled: settings?.countries?.allEnabled ? [] : AVAILABLE_COUNTRIES.map(c => c.code),
      },
    });
  };

  const isCountryEnabled = (countryCode: string) => {
    return settings?.countries?.allEnabled || settings?.countries?.enabled?.includes(countryCode);
  };

  const filteredCountries = AVAILABLE_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = settings?.countries?.allEnabled
    ? AVAILABLE_COUNTRIES.length
    : (settings?.countries?.enabled?.length || 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading country settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Country Settings</h1>
            <p className="text-muted-foreground mt-1">
              Choose which countries you want to serve on your storefront
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Countries Overview
            </CardTitle>
            <CardDescription>
              You are currently serving {enabledCount} {enabledCount === 1 ? 'country' : 'countries'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Enable All Countries</p>
                <p className="text-sm text-muted-foreground">
                  Automatically accept top-ups for all available countries
                </p>
              </div>
              <Button
                variant={settings?.countries?.allEnabled ? 'default' : 'outline'}
                onClick={toggleAllCountries}
              >
                {settings?.countries?.allEnabled ? 'All Enabled' : 'Enable All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Country Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Countries</CardTitle>
            <CardDescription>
              Choose specific countries you want to serve
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Country Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
              {filteredCountries.map((country) => {
                const enabled = isCountryEnabled(country.code);
                return (
                  <button
                    key={country.code}
                    onClick={() => toggleCountry(country.code)}
                    disabled={settings?.countries?.allEnabled}
                    className={cn(
                      'flex items-center gap-3 p-4 border-2 rounded-lg transition-all text-left',
                      enabled
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300',
                      settings?.countries?.allEnabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-3xl">{country.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium">{country.name}</p>
                      <p className="text-xs text-muted-foreground">{country.code}</p>
                    </div>
                    {enabled && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No countries found matching "{searchQuery}"</p>
              </div>
            )}

            {settings?.countries?.allEnabled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ All countries are currently enabled. Disable "Enable All Countries" above to select specific countries.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button at Bottom */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Country Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
