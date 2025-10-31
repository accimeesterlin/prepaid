'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Users,
  CheckCircle,
  ArrowUpRight,
  Package,
  TrendingUp,
  Plus,
  CreditCard,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@pg-prepaid/ui';
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
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: { total: 0, trend: 0 },
    transactions: { total: 0, trend: 0 },
    customers: { total: 0, trend: 0 },
    successRate: { rate: 0, trend: 0 },
  });
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
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
              Welcome back! Here's an overview of your business.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/products')}>
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
            <Button onClick={() => router.push('/dashboard/transactions')}>
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </div>
        </div>

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
              <CardDescription>Get started with your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/products')}
              >
                <Package className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Add Products</div>
                  <div className="text-xs text-muted-foreground">Create your product catalog</div>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="lg"
                onClick={() => router.push('/dashboard/settings/payment')}
              >
                <CreditCard className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">Configure Payments</div>
                  <div className="text-xs text-muted-foreground">Set up payment gateways</div>
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
              <Package className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Manage your prepaid minute packages and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                className="p-0"
                onClick={() => router.push('/dashboard/products')}
              >
                Go to Products <ArrowUpRight className="h-4 w-4 ml-1" />
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
    </DashboardLayout>
  );
}
