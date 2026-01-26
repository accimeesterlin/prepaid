"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface CustomerData {
  _id: string;
  currentBalance: number;
  balanceCurrency: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  country: string;
  currency: string;
}

export default function SendMinutesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  useEffect(() => {
    if (orgSlug) {
      loadData();
    }
  }, [orgSlug]);

  const loadData = async () => {
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

      // Get available products
      const productsRes = await fetch("/api/v1/products?status=active", {
        credentials: "include",
      });

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);
      }
    } catch (err: any) {
      setError(err.message || t("portal.sendMinutes.loadError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError(t("portal.sendMinutes.selectProduct"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedProduct._id,
          recipientPhone,
          paymentType: "balance",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Transaction failed");
      }

      setSuccess(true);
      setRecipientPhone("");
      setSelectedProduct(null);

      // Reload balance
      await loadData();

      setTimeout(() => {
        router.push(`/customer-portal/${orgSlug}/dashboard`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("portal.sendMinutes.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t("portal.sendMinutes.title")}
        </h1>

        {/* Balance Display */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            {t("portal.sendMinutes.availableBalance")}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {customer.balanceCurrency} {customer.currentBalance.toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {t("portal.sendMinutes.success")}
            </div>
          )}

          {/* Recipient Phone */}
          <div>
            <label
              htmlFor="recipientPhone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("portal.sendMinutes.recipientPhone")}
            </label>
            <input
              id="recipientPhone"
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+1234567890"
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("portal.sendMinutes.selectProduct")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProduct?._id === product._id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {product.description}
                  </p>
                  <p className="text-lg font-bold text-purple-600 mt-2">
                    {product.currency} {product.basePrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.country}
                  </p>
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                {t("portal.sendMinutes.noProducts")}
              </p>
            )}
          </div>

          {/* Cost Summary */}
          {selectedProduct && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  {t("portal.sendMinutes.productCost")}
                </span>
                <span className="font-semibold">
                  {customer.balanceCurrency}{" "}
                  {selectedProduct.basePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  {t("portal.sendMinutes.currentBalance")}
                </span>
                <span className="font-semibold">
                  {customer.balanceCurrency}{" "}
                  {customer.currentBalance.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">
                    {t("portal.sendMinutes.remainingBalance")}
                  </span>
                  <span className="font-bold text-purple-600">
                    {customer.balanceCurrency}{" "}
                    {(
                      customer.currentBalance - selectedProduct.basePrice
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !selectedProduct ||
              customer.currentBalance < (selectedProduct?.basePrice || 0)
            }
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? t("portal.sendMinutes.sending")
              : t("portal.sendMinutes.sendButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
