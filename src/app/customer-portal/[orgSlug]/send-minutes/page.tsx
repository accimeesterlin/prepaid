"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
} from "@pg-prepaid/ui";
import { Loader2, AlertCircle, CheckCircle2, Wallet } from "lucide-react";

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
      setCustomer(customerData.customer);

      // Get available products
      const productsRes = await fetch("/api/v1/products?status=active", {
        credentials: "include",
      });

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);
      }
    } catch (err: any) {
      setError(err.message || t("customer.portal.sendMinutes.loadError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError(t("customer.portal.sendMinutes.selectProduct"));
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
      setError(err.message || t("customer.portal.sendMinutes.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {t("customer.portal.sendMinutes.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balance Display */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t("customer.portal.sendMinutes.availableBalance")}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {customer.balanceCurrency}{" "}
                    {customer.currentBalance.toFixed(2)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {t("customer.portal.sendMinutes.success")}
                </AlertDescription>
              </Alert>
            )}

            {/* Recipient Phone */}
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">
                {t("customer.portal.sendMinutes.recipientPhone")}
              </Label>
              <Input
                id="recipientPhone"
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>{t("customer.portal.sendMinutes.selectProduct")}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProduct?._id === product._id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.description && (
                        <CardDescription>{product.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-primary">
                        {product.currency} {product.basePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.country}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {products.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  {t("customer.portal.sendMinutes.noProducts")}
                </p>
              )}
            </div>

            {/* Cost Summary */}
            {selectedProduct && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("customer.portal.sendMinutes.productCost")}
                    </span>
                    <span className="font-semibold">
                      {customer.balanceCurrency}{" "}
                      {selectedProduct.basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("customer.portal.sendMinutes.currentBalance")}
                    </span>
                    <span className="font-semibold">
                      {customer.balanceCurrency}{" "}
                      {customer.currentBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {t("customer.portal.sendMinutes.remainingBalance")}
                      </span>
                      <span className="font-bold text-primary">
                        {customer.balanceCurrency}{" "}
                        {(
                          customer.currentBalance - selectedProduct.basePrice
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              disabled={
                loading ||
                !selectedProduct ||
                customer.currentBalance < (selectedProduct?.basePrice || 0)
              }
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading
                ? t("customer.portal.sendMinutes.sending")
                : t("customer.portal.sendMinutes.sendButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
