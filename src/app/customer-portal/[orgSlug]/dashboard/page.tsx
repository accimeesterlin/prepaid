"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface CustomerData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentBalance: number;
  balanceCurrency: string;
  emailVerified: boolean;
}

interface Transaction {
  _id: string;
  amount: number;
  recipientPhone: string;
  status: string;
  createdAt: string;
  product?: {
    name: string;
  };
}

export default function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  useEffect(() => {
    if (orgSlug) {
      loadDashboardData();
    }
  }, [orgSlug]);

  const loadDashboardData = async () => {
    try {
      // Get customer data
      const customerRes = await fetch("/api/v1/customer-auth/me", {
        credentials: "include",
      });

      if (!customerRes.ok) {
        if (customerRes.status === 401) {
          router.push(`/customer-portal/${orgSlug}/login`);
          return;
        }
        throw new Error("Failed to load customer data");
      }

      const customerData = await customerRes.json();
      setCustomer(customerData.data);

      // Get recent transactions
      const txRes = await fetch(
        `/api/v1/customers/${customerData.data._id}/transactions?limit=5`,
        {
          credentials: "include",
        },
      );

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || []);
      }
    } catch (err: any) {
      setError(err.message || t("portal.dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || t("portal.dashboard.loadError")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("portal.dashboard.welcome")}, {customer.firstName}!
        </h1>
        {!customer.emailVerified && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center justify-between">
            <span>{t("portal.dashboard.verifyPrompt")}</span>
            <Link
              href={`/customer-portal/${orgSlug}/verify-email`}
              className="text-yellow-900 underline font-medium"
            >
              {t("portal.dashboard.verifyLink")}
            </Link>
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {t("portal.dashboard.currentBalance")}
            </h2>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold">
            {customer.balanceCurrency} {customer.currentBalance.toFixed(2)}
          </p>
          <p className="text-purple-100 text-sm mt-2">
            {t("portal.dashboard.availableToSpend")}
          </p>
        </div>

        <Link
          href={`/customer-portal/${orgSlug}/send-minutes`}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("portal.dashboard.sendMinutes")}
            </h2>
            <span className="text-2xl">📱</span>
          </div>
          <p className="text-gray-600">
            {t("portal.dashboard.sendMinutesDesc")}
          </p>
        </Link>

        <Link
          href={`/customer-portal/${orgSlug}/transactions`}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("portal.dashboard.viewHistory")}
            </h2>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-600">
            {t("portal.dashboard.viewHistoryDesc")}
          </p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("portal.dashboard.recentTransactions")}
        </h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t("portal.dashboard.noTransactions")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("portal.dashboard.table.date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("portal.dashboard.table.recipient")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("portal.dashboard.table.product")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("portal.dashboard.table.amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("portal.dashboard.table.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.recipientPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.product?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.balanceCurrency} {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
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
        )}
      </div>
    </div>
  );
}
