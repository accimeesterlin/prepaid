'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Transaction {
  _id: string;
  amount: number;
  recipientPhone: string;
  status: string;
  createdAt: string;
  product?: {
    name: string;
    country: string;
  };
  paymentType: string;
}

export default function TransactionsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  useEffect(() => {
    if (orgSlug) {
      loadTransactions();
    }
  }, [orgSlug, page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Get customer data first
      const customerRes = await fetch('/api/v1/customer-auth/me', {
        credentials: 'include',
      });

      if (!customerRes.ok) {
        if (customerRes.status === 401) {
          router.push(`/customer-portal/${orgSlug}/login`);
          return;
        }
        throw new Error('Authentication failed');
      }

      const customerData = await customerRes.json();
      setCurrency(customerData.data.balanceCurrency);

      // Get transactions
      const res = await fetch(
        `/api/v1/customers/${customerData.data._id}/transactions?page=${page}&limit=20`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }

      const data = await res.json();
      setTransactions(data.data || []);
      setHasMore(data.pagination?.hasNextPage || false);
    } catch (err: any) {
      setError(err.message || t('portal.transactions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('portal.transactions.title')}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('portal.transactions.noTransactions')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.recipient')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.product')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('portal.transactions.table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        <span className="text-gray-500">
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.recipientPhone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.product ? (
                          <>
                            <div>{tx.product.name}</div>
                            <div className="text-xs text-gray-400">{tx.product.country}</div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {currency} {tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.paymentType === 'balance' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Balance
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Gateway
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('portal.transactions.previous')}
              </button>
              <span className="text-sm text-gray-700">
                {t('portal.transactions.page')} {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('portal.transactions.next')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
