'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  currentBalance?: number;
  totalAssigned?: number;
  totalUsed?: number;
  permissions: string[];
}

interface Stats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  thisMonthTransactions: number;
  thisMonthAmount: number;
}

export default function StaffDashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get user session
      const userRes = await fetch('/api/auth/session');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData);

      // Get user stats
      const statsRes = await fetch('/api/v1/staff/my-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">Here's an overview of your activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalTransactions || 0}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.completedTransactions || 0}
              </p>
            </div>
            <div className="text-3xl">✓</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.pendingTransactions || 0}
              </p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <h2 className="text-xl font-bold mb-4">This Month</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-blue-100">Transactions</p>
            <p className="text-3xl font-bold">{stats?.thisMonthTransactions || 0}</p>
          </div>
          <div>
            <p className="text-blue-100">Total Amount</p>
            <p className="text-3xl font-bold">${stats?.thisMonthAmount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/staff-portal/my-transactions')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">View Transactions</h3>
            <p className="text-sm text-gray-600">See all your transaction history</p>
          </button>

          <button
            onClick={() => router.push('/staff-portal/my-api-keys')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="text-2xl mb-2">🔑</div>
            <h3 className="font-semibold text-gray-900">Manage API Keys</h3>
            <p className="text-sm text-gray-600">Create and manage your API keys</p>
          </button>

          <button
            onClick={() => router.push('/staff-portal/my-account')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-900">Account Settings</h3>
            <p className="text-sm text-gray-600">Update your profile and permissions</p>
          </button>
        </div>
      </div>
    </div>
  );
}
