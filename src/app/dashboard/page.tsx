'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Users,
  CheckCircle,
  ArrowUpRight,
  TrendingUp,
  Store,
  Copy,
  ExternalLink,
  Globe,
  Tag,
  Eye,
  X,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Dialog, DialogContent } from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';

interface Metrics {
  revenue: {
    total: number;
    trend: number;
  };
  transactions: {
    total: number;
    trend: number;
  };
  customers: {
    total: number;
    trend: number;
  };
  successRate: {
    rate: number;
    trend: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics] = useState<Metrics>({
    revenue: { total: 0, trend: 0 },
    transactions: { total: 0, trend: 0 },
    customers: { total: 0, trend: 0 },
    successRate: { rate: 0, trend: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [orgSlug, setOrgSlug] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showStorefrontModal, setShowStorefrontModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
      }

      // Fetch organization slug
      const orgResponse = await fetch('/api/v1/organization');
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrgSlug(orgData.slug);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const storefrontUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${orgSlug}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Manage your storefront and track your business.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/dashboard/storefront')}>
              <Store className="h-4 w-4 mr-2" />
              Storefront Settings
            </Button>
          </div>
        </div>

        {/* Storefront URL Card */}
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Your Storefront
            </CardTitle>
            <CardDescription>
              Share this link with customers to let them purchase top-ups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {storefrontUrl || 'Loading...'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!storefrontUrl}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(storefrontUrl, '_blank')}
                disabled={!storefrontUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.revenue.total)}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Transactions</p>
                <p className="text-3xl font-bold">{metrics.transactions.total}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>

          {/* Customers Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Customers</p>
                <p className="text-3xl font-bold">{metrics.customers.total}</p>
                <p className="text-xs text-muted-foreground">Total registered</p>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Success Rate</p>
                <p className="text-3xl font-bold">{metrics.successRate.rate}%</p>
                <p className="text-xs text-muted-foreground">Transaction success</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your storefront</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => setShowStorefrontModal(true)}
              >
                <Eye className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Preview Storefront</div>
                  <div className="text-xs text-muted-foreground">Test transactions as a team member</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/storefront')}
              >
                <Store className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Configure Storefront</div>
                  <div className="text-xs text-muted-foreground">Set up branding and pricing</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/countries')}
              >
                <Globe className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Select Countries</div>
                  <div className="text-xs text-muted-foreground">Choose countries to serve</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/discounts')}
              >
                <Tag className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Create Discounts</div>
                  <div className="text-xs text-muted-foreground">Set up promotional offers</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/integrations')}
              >
                <TrendingUp className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Connect DingConnect</div>
                  <div className="text-xs text-muted-foreground">Integrate with telecom API</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No activity yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your recent transactions will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Store className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Storefront</CardTitle>
              <CardDescription>
                Customize your public storefront and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/dashboard/storefront')}
              >
                Manage Storefront <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Track and manage your customer relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/dashboard/customers')}
              >
                View Customers <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Gain insights into your sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/dashboard/analytics')}
              >
                View Analytics <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Storefront Modal */}
      <Dialog open={showStorefrontModal} onOpenChange={setShowStorefrontModal}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold">Storefront Preview</h2>
              <p className="text-sm text-muted-foreground">Test transactions as a team member</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStorefrontModal(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {orgSlug && (
              <iframe
                src={`/store/${orgSlug}?teamMember=true`}
                className="w-full h-full border-0"
                title="Storefront Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
