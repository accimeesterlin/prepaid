'use client';

import { CreditCard, Check } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';

const paymentGateways = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept credit cards and digital wallets',
    logo: '💳',
    enabled: false,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Accept PayPal payments worldwide',
    logo: '🅿️',
    enabled: false,
  },
  {
    id: 'pgpay',
    name: 'PGPay',
    description: 'Local Papua New Guinea payment solution',
    logo: '🇵🇬',
    enabled: false,
  },
];

export default function PaymentSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure payment gateways to accept customer payments
          </p>
        </div>

        {/* Payment Gateways */}
        <div className="space-y-4">
          {paymentGateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{gateway.logo}</div>
                    <div>
                      <CardTitle>{gateway.name}</CardTitle>
                      <CardDescription>{gateway.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {gateway.enabled && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Active
                      </span>
                    )}
                    <Button variant={gateway.enabled ? 'outline' : 'default'}>
                      {gateway.enabled ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Setting up payment gateways requires API credentials from each provider.
              Visit our documentation to learn how to obtain these credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0">
              View Documentation →
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
