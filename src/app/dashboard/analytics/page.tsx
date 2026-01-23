'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Download, DollarSign, Users, ShoppingCart, CheckCircle, ChevronDown } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@pg-prepaid/ui';
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
    newCustomers: number;
    trend: number;
  };
  successRate: {
    rate: number;
    trend: number;
  };
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  const selectedPeriodLabel = periodOptions.find(opt => opt.value === period)?.label || 'Last 30 Days';
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
    };

    if (showPeriodDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPeriodDropdown]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/dashboard/metrics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (_error) {
      console.error('Failed to fetch metrics:', _error);
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
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = metrics && (
    metrics.revenue.total > 0 ||
    metrics.transactions.total > 0 ||
    metrics.customers.total > 0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Gain insights into your business performance
            </p>
          </div>
          <div className="flex gap-2">
            {/* Period Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="min-w-[160px] justify-between"
              >
                {selectedPeriodLabel}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </Button>
              {showPeriodDropdown && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white border rounded-lg shadow-lg z-10 overflow-hidden animate-in slide-in-from-top-2">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPeriod(option.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        period === option.value
                          ? 'bg-primary text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {!hasData ? (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Start processing transactions to see detailed analytics and insights about your business.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.revenue.total.toFixed(2)}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {metrics.revenue.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={metrics.revenue.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.revenue.trend >= 0 ? '+' : ''}{metrics.revenue.trend.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transactions
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.transactions.total}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {metrics.transactions.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={metrics.transactions.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.transactions.trend >= 0 ? '+' : ''}{metrics.transactions.trend.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </CardContent>
              </Card>

              {/* Customers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Customers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.customers.total}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {metrics.customers.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={metrics.customers.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.customers.trend >= 0 ? '+' : ''}{metrics.customers.trend.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      ({metrics.customers.newCustomers} new)
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.successRate.rate.toFixed(1)}%</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {metrics.successRate.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={metrics.successRate.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.successRate.trend >= 0 ? '+' : ''}{metrics.successRate.trend.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Period</span>
                    <span className="font-medium">{selectedPeriodLabel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Customers</span>
                    <span className="font-medium">{metrics.customers.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Transaction Value</span>
                    <span className="font-medium">
                      ${metrics.transactions.total > 0
                        ? (metrics.revenue.total / metrics.transactions.total).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed Transactions</span>
                    <span className="font-medium">
                      {Math.round(metrics.transactions.total * (metrics.successRate.rate / 100))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
