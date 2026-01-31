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
  toast,
} from "@pg-prepaid/ui";
import { Loader2, AlertCircle, CheckCircle2, Wallet, Search, Phone } from "lucide-react";

interface CustomerData {
  id: string;
  currentBalance: number;
  balanceCurrency: string;
  emailVerified: boolean;
}

interface Product {
  skuCode: string;
  name: string;
  providerCode: string;
  providerName: string;
  benefitType: string;
  benefitAmount: number;
  benefitUnit: string;
  pricing: {
    costPrice: number;
    finalPrice: number;
    discountApplied: boolean;
  };
  isVariableValue: boolean;
  minAmount?: number;
  maxAmount?: number;
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
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [sending, setSending] = useState(false);
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
    setLoading(true);
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
    } catch (err: any) {
      setError(err.message || t("customer.portal.sendMinutes.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLookup = async () => {
    if (!recipientPhone || recipientPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLookingUp(true);
    setError("");
    setProducts([]);
    setSelectedProduct(null);

    try {
      const res = await fetch("/api/v1/lookup/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: recipientPhone,
          orgSlug,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.title || "Failed to lookup phone number");
      }

      const data = await res.json();

      if (!data.products || data.products.length === 0) {
        setError(`No products found for ${recipientPhone}`);
        return;
      }

      setProducts(data.products);
      toast({
        title: "Products found",
        description: `Found ${data.products.length} products for this number`,
        variant: "success",
      });
    } catch (err: any) {
      setError(err.message || "Failed to lookup phone number");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError(t("customer.portal.sendMinutes.selectProduct"));
      return;
    }

    // Validate custom amount for variable-value products
    if (selectedProduct.isVariableValue) {
      const amount = parseFloat(customAmount);
      if (!amount || isNaN(amount)) {
        setError("Please enter a valid amount");
        return;
      }

      if (selectedProduct.minAmount && amount < selectedProduct.minAmount) {
        setError(`Minimum amount is ${selectedProduct.minAmount}`);
        return;
      }

      if (selectedProduct.maxAmount && amount > selectedProduct.maxAmount) {
        setError(`Maximum amount is ${selectedProduct.maxAmount}`);
        return;
      }
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const requestBody: any = {
        phoneNumber: recipientPhone,
        skuCode: selectedProduct.skuCode,
      };

      // For variable-value products, include amount
      if (selectedProduct.isVariableValue && customAmount) {
        const amount = parseFloat(customAmount);
        requestBody.amount = amount;
        requestBody.sendValue = amount;
      }

      const res = await fetch("/api/v1/customer-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.title || "Transaction failed");
      }

      const data = await res.json();

      setSuccess(true);
      toast({
        title: "Success!",
        description: `Top-up sent successfully to ${recipientPhone}`,
        variant: "success",
      });

      // Reset form
      setRecipientPhone("");
      setSelectedProduct(null);
      setProducts([]);
      setCustomAmount("");

      // Reload customer balance
      await loadData();

      setTimeout(() => {
        router.push(`/customer-portal/${orgSlug}/transactions`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("customer.portal.sendMinutes.error"));
      toast({
        title: "Error",
        description: err.message || t("customer.portal.sendMinutes.error"),
        variant: "error",
      });
    } finally {
      setSending(false);
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

          {/* Email Verification Check */}
          {customer && !customer.emailVerified && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please verify your email to send top-ups.{" "}
                <a
                  href={`/customer-portal/${orgSlug}/verify-email`}
                  className="underline font-semibold"
                >
                  Verify now
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Phone Lookup Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">
                {t("customer.portal.sendMinutes.recipientPhone")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="recipientPhone"
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => {
                    setRecipientPhone(e.target.value);
                    setProducts([]);
                    setSelectedProduct(null);
                  }}
                  placeholder="+1234567890"
                  disabled={lookingUp || sending}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handlePhoneLookup}
                  disabled={!recipientPhone || recipientPhone.length < 10 || lookingUp || sending}
                  variant="outline"
                >
                  {lookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">{lookingUp ? "Looking up..." : "Search"}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the phone number and click Search to find available products
              </p>
            </div>
          </div>

          {/* Product Selection - Only show if products found */}
          {products.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Product Selection */}
              <div className="space-y-2">
                <Label>{t("customer.portal.sendMinutes.selectProduct")}</Label>
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <Card
                      key={product.skuCode}
                      onClick={() => {
                        setSelectedProduct(product);
                        setCustomAmount("");
                      }}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProduct?.skuCode === product.skuCode
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {product.providerName}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                {product.benefitType}
                              </span>
                              {product.benefitAmount && (
                                <span className="text-xs text-muted-foreground">
                                  {product.benefitAmount} {product.benefitUnit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {product.isVariableValue ? (
                              <div>
                                <p className="text-xs text-muted-foreground">Custom amount</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ${product.minAmount} - ${product.maxAmount}
                                </p>
                              </div>
                            ) : (
                              <div>
                                {product.pricing.discountApplied && (
                                  <p className="text-xs line-through text-muted-foreground">
                                    ${product.pricing.costPrice.toFixed(2)}
                                  </p>
                                )}
                                <p className="text-lg font-bold text-primary">
                                  ${product.pricing.finalPrice.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Amount for Variable Value Products */}
              {selectedProduct?.isVariableValue && (
                <div className="space-y-2">
                  <Label htmlFor="customAmount">
                    Amount (${selectedProduct.minAmount} - ${selectedProduct.maxAmount})
                  </Label>
                  <Input
                    id="customAmount"
                    type="number"
                    step="0.01"
                    min={selectedProduct.minAmount}
                    max={selectedProduct.maxAmount}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Enter amount between $${selectedProduct.minAmount} and $${selectedProduct.maxAmount}`}
                    required
                  />
                </div>
              )}

              {/* Cost Summary */}
              {selectedProduct && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-semibold">
                        {customer.balanceCurrency}{" "}
                        {selectedProduct.isVariableValue
                          ? parseFloat(customAmount || "0").toFixed(2)
                          : selectedProduct.pricing.finalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-semibold">
                        {customer.balanceCurrency}{" "}
                        {customer.currentBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Remaining Balance</span>
                        <span
                          className={`font-bold ${
                            customer.currentBalance -
                              (selectedProduct.isVariableValue
                                ? parseFloat(customAmount || "0")
                                : selectedProduct.pricing.finalPrice) >=
                            0
                              ? "text-primary"
                              : "text-red-600"
                          }`}
                        >
                          {customer.balanceCurrency}{" "}
                          {(
                            customer.currentBalance -
                            (selectedProduct.isVariableValue
                              ? parseFloat(customAmount || "0")
                              : selectedProduct.pricing.finalPrice)
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
                  sending ||
                  !selectedProduct ||
                  !customer.emailVerified ||
                  (selectedProduct.isVariableValue && !customAmount) ||
                  customer.currentBalance <
                    (selectedProduct.isVariableValue
                      ? parseFloat(customAmount || "0")
                      : selectedProduct.pricing.finalPrice)
                }
                className="w-full"
                size="lg"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sending
                  ? t("customer.portal.sendMinutes.sending")
                  : t("customer.portal.sendMinutes.sendButton")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
