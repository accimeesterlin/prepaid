"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { saveEncrypted, loadEncrypted } from "@/lib/encryption";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@pg-prepaid/ui";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Search,
  Phone,
  X,
} from "lucide-react";

interface CustomerData {
  _id: string;
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
    costPrice: number; // DingConnect cost
    markup: number; // Markup amount added
    priceBeforeDiscount: number; // Price with markup before discount
    discount: number; // Discount amount
    finalPrice: number; // Final price customer pays
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
  const [detectedOperatorCodes, setDetectedOperatorCodes] = useState<string[]>(
    [],
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recentPhones, setRecentPhones] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [filterByType, setFilterByType] = useState<"all" | "plan" | "prepaid">(
    "all",
  );
  const [showProductModal, setShowProductModal] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  // Load recent phone numbers from localStorage
  useEffect(() => {
    if (orgSlug && customer?._id) {
      const storageKey = `recentPhones_${orgSlug}_${customer._id}`;

      loadEncrypted<string[]>(storageKey, customer._id, orgSlug)
        .then((phones) => {
          if (phones && Array.isArray(phones)) {
            console.log("Loaded recent phones:", phones.length);
            setRecentPhones(phones);
          }
        })
        .catch((e) => {
          console.error("Error loading recent phones:", e);
        });
    }
  }, [orgSlug, customer?._id]);

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

      // Fetch test mode status
      try {
        const testModeRes = await fetch(
          `/api/v1/customer-portal/${orgSlug}/test-mode`,
        );
        if (testModeRes.ok) {
          const testModeData = await testModeRes.json();
          setIsTestMode(testModeData.testMode || false);
        }
      } catch (testModeError) {
        console.error("Failed to fetch test mode status:", testModeError);
        // Don't fail the whole page load if test mode check fails
      }
    } catch (err: any) {
      setError(err.message || t("customer.portal.sendMinutes.loadError"));
    } finally {
      setLoading(false);
    }
  };

  // Save a phone number to recent list
  const saveRecentPhone = async (phone: string) => {
    if (!customer?._id || !orgSlug) {
      console.log("Cannot save recent phone - missing data:", {
        hasCustomer: !!customer,
        customerId: customer?._id,
        orgSlug,
      });
      return;
    }

    const storageKey = `recentPhones_${orgSlug}_${customer._id}`;
    const cleanPhone = phone.trim();

    console.log("Saving recent phone:", cleanPhone, "to key:", storageKey);

    // Add to beginning of array, remove duplicates, limit to 5
    const updated = [
      cleanPhone,
      ...recentPhones.filter((p) => p !== cleanPhone),
    ].slice(0, 5);

    setRecentPhones(updated);

    try {
      await saveEncrypted(storageKey, updated, customer._id, orgSlug);
      console.log("Saved encrypted phone list to localStorage");
    } catch (error) {
      console.error("Failed to save encrypted phones:", error);
    }
  };

  // Remove a phone number from recent list
  const removeRecentPhone = async (phone: string) => {
    if (!customer?._id || !orgSlug) return;

    const storageKey = `recentPhones_${orgSlug}_${customer._id}`;
    const updated = recentPhones.filter((p) => p !== phone);

    setRecentPhones(updated);

    try {
      await saveEncrypted(storageKey, updated, customer._id, orgSlug);
    } catch (error) {
      console.error("Failed to save encrypted phones:", error);
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
        throw new Error(
          errorData.detail ||
            errorData.title ||
            "Failed to lookup phone number",
        );
      }

      const data = await res.json();

      if (!data.products || data.products.length === 0) {
        setError(`No products found for ${recipientPhone}`);
        return;
      }

      // Set test mode from API response
      if (data.testMode !== undefined) {
        setIsTestMode(data.testMode);
      }

      // Extract detected operator codes for filtering
      const detectedCodes =
        data.detectedOperators?.map((op: any) => op.code) || [];
      setDetectedOperatorCodes(detectedCodes);

      // Filter products to only show those from detected operators
      const filteredProducts = data.products.filter((product: Product) =>
        detectedCodes.includes(product.providerCode),
      );

      if (filteredProducts.length === 0) {
        setError(`No products available for the detected operator`);
        return;
      }

      setProducts(filteredProducts);

      // Save phone number to recent list after successful lookup
      saveRecentPhone(recipientPhone);
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
      // Ensure phone number is in correct format (with + sign if not present)
      let formattedPhone = recipientPhone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }

      const requestBody: any = {
        phoneNumber: formattedPhone,
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
        throw new Error(
          errorData.detail || errorData.title || "Transaction failed",
        );
      }

      const data = await res.json();

      setSuccess(true);
      setShowProductModal(false);

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

  // Filter products by type
  let filteredProducts = [...products];
  if (filterByType !== "all") {
    filteredProducts = filteredProducts.filter((product) => {
      // Detect if product is a plan (has Data benefit or has validity period)
      const hasDataBenefit = product.benefitType
        ?.toLowerCase()
        .includes("data");
      const isPlan = hasDataBenefit;
      const isPrepaid = !isPlan;

      if (filterByType === "plan") return isPlan;
      if (filterByType === "prepaid") return isPrepaid;
      return true;
    });
  }

  // Count products by type for tab badges
  const prepaidCount = products.filter((p) => {
    const hasDataBenefit = p.benefitType?.toLowerCase().includes("data");
    return !hasDataBenefit;
  }).length;
  const planCount = products.filter((p) => {
    const hasDataBenefit = p.benefitType?.toLowerCase().includes("data");
    return hasDataBenefit;
  }).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {t("customer.portal.sendMinutes.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Mode Warning */}
          {isTestMode && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 dark:border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-400">
                <strong>⚠️ Test Mode Active:</strong> This organization is in
                test mode. Transactions will be validated but{" "}
                <strong>NOT actually sent</strong>. No real money will be spent
                or received.
              </AlertDescription>
            </Alert>
          )}

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
                  disabled={
                    !recipientPhone ||
                    recipientPhone.length < 10 ||
                    lookingUp ||
                    sending
                  }
                  variant="outline"
                >
                  {lookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {lookingUp ? "Looking up..." : "Search"}
                  </span>
                </Button>
              </div>

              {/* Recent Phone Numbers */}
              {recentPhones.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Recent numbers:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentPhones.map((phone) => (
                      <button
                        key={phone}
                        type="button"
                        onClick={async () => {
                          setRecipientPhone(phone);
                          setProducts([]);
                          setSelectedProduct(null);

                          // Automatically search for products
                          setLookingUp(true);
                          setError("");

                          try {
                            const res = await fetch("/api/v1/lookup/phone", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({
                                phoneNumber: phone,
                                orgSlug,
                              }),
                            });

                            if (!res.ok) {
                              const errorData = await res
                                .json()
                                .catch(() => ({}));
                              throw new Error(
                                errorData.detail ||
                                  errorData.title ||
                                  "Failed to lookup phone number",
                              );
                            }

                            const data = await res.json();

                            if (!data.products || data.products.length === 0) {
                              setError(`No products found for ${phone}`);
                              return;
                            }

                            const detectedCodes =
                              data.detectedOperators?.map(
                                (op: any) => op.code,
                              ) || [];
                            setDetectedOperatorCodes(detectedCodes);

                            const filteredProducts = data.products.filter(
                              (product: Product) =>
                                detectedCodes.includes(product.providerCode),
                            );

                            if (filteredProducts.length === 0) {
                              setError(
                                `No products available for the detected operator`,
                              );
                              return;
                            }

                            setProducts(filteredProducts);
                            await saveRecentPhone(phone);
                          } catch (err: any) {
                            setError(
                              err.message || "Failed to lookup phone number",
                            );
                          } finally {
                            setLookingUp(false);
                          }
                        }}
                        disabled={lookingUp || sending}
                        className="group relative inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{phone}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentPhone(phone);
                          }}
                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Enter the phone number and click Search to find available
                products
              </p>
            </div>
          </div>

          {/* Product Selection - Only show if products found */}
          {products.length > 0 && (
            <div className="space-y-6">
              {/* Product Type Filters */}
              <div className="flex items-center justify-between">
                <Label>{t("customer.portal.sendMinutes.selectProduct")}</Label>
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFilterByType("all")}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors ${
                      filterByType === "all"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterByType("prepaid")}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors ${
                      filterByType === "prepaid"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Top-up ({prepaidCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterByType("plan")}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors ${
                      filterByType === "plan"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Plans ({planCount})
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.skuCode}
                    onClick={() => {
                      console.log("Selected product:", product);
                      console.log("Product pricing:", product.pricing);
                      setSelectedProduct(product);
                      setCustomAmount("");
                      setShowProductModal(true);
                    }}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">
                            {product.name}
                          </h3>
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
                              <p className="text-xs text-muted-foreground">
                                Custom amount
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ${product.minAmount} - ${product.maxAmount}
                              </p>
                            </div>
                          ) : (
                            <div>
                              {product.pricing.discountApplied && (
                                <p className="text-xs line-through text-muted-foreground">
                                  $
                                  {product.pricing.priceBeforeDiscount.toFixed(
                                    2,
                                  )}
                                </p>
                              )}
                              <p className="text-lg font-bold text-primary">
                                ${product.pricing.finalPrice.toFixed(2)}
                              </p>
                              {product.pricing.markup > 0 &&
                                !product.pricing.discountApplied && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Cost: $
                                    {product.pricing.costPrice.toFixed(2)}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg">
          {selectedProduct && (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.providerName} • {selectedProduct.benefitType}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-6">
                {/* Product Details */}
                <div className="space-y-2 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">
                      {selectedProduct.providerName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Benefit</span>
                    <span className="font-medium">
                      {selectedProduct.benefitAmount ? (
                        <>
                          {selectedProduct.benefitAmount}{" "}
                          {selectedProduct.benefitUnit}
                        </>
                      ) : (
                        selectedProduct.benefitType
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{recipientPhone}</span>
                  </div>
                </div>

                {/* Custom Amount for Variable Value Products */}
                {selectedProduct.isVariableValue && (
                  <div className="space-y-2">
                    <Label htmlFor="modalCustomAmount">
                      Amount (${selectedProduct.minAmount} - $
                      {selectedProduct.maxAmount})
                    </Label>
                    <Input
                      id="modalCustomAmount"
                      type="number"
                      step="0.01"
                      min={selectedProduct.minAmount}
                      max={selectedProduct.maxAmount}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`Enter amount between $${selectedProduct.minAmount} and $${selectedProduct.maxAmount}`}
                      required
                      autoFocus
                    />
                  </div>
                )}

                {/* Pricing Display for Variable Value Products */}
                {selectedProduct.isVariableValue &&
                  selectedProduct.pricing &&
                  customer &&
                  customAmount &&
                  parseFloat(customAmount) > 0 && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-800">
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <span className="text-lg">💳</span> Pricing Breakdown
                        </h4>
                        <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                          <div className="flex justify-between items-center">
                            <span>Top-Up Amount</span>
                            <span className="font-medium">
                              {customer?.balanceCurrency || "USD"}{" "}
                              {parseFloat(customAmount).toFixed(2)}
                            </span>
                          </div>
                          {selectedProduct.pricing.markup > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Service Fee</span>
                              <span className="font-medium">
                                +{customer?.balanceCurrency || "USD"}{" "}
                                {(
                                  (parseFloat(customAmount) *
                                    selectedProduct.pricing.markup) /
                                  selectedProduct.pricing.costPrice
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700 font-bold text-base">
                            <span>You Pay</span>
                            <span className="text-blue-700 dark:text-blue-300">
                              {customer?.balanceCurrency || "USD"}{" "}
                              {(
                                parseFloat(customAmount) *
                                (1 +
                                  selectedProduct.pricing.markup /
                                    selectedProduct.pricing.costPrice)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Pricing Display for Fixed Products */}
                {!selectedProduct.isVariableValue &&
                  selectedProduct.pricing &&
                  customer && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-800">
                      <CardContent className="pt-4 pb-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <span className="text-lg">💳</span> Pricing Breakdown
                        </h4>
                        <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                          <div className="flex justify-between items-center">
                            <span>Base Price</span>
                            <span className="font-medium">
                              {customer?.balanceCurrency || "USD"}{" "}
                              {selectedProduct.pricing.costPrice.toFixed(2)}
                            </span>
                          </div>
                          {selectedProduct.pricing.markup > 0 && (
                            <div className="flex justify-between items-center">
                              <span>Service Fee</span>
                              <span className="font-medium">
                                +{customer?.balanceCurrency || "USD"}{" "}
                                {selectedProduct.pricing.markup.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {selectedProduct.pricing.discountApplied &&
                            selectedProduct.pricing.discount > 0 && (
                              <div className="flex justify-between items-center text-green-700 dark:text-green-300">
                                <span>💰 Discount</span>
                                <span className="font-medium">
                                  -{customer?.balanceCurrency || "USD"}{" "}
                                  {selectedProduct.pricing.discount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700 font-bold text-base">
                            <span>You Pay</span>
                            <span className="text-blue-700 dark:text-blue-300">
                              {customer?.balanceCurrency || "USD"}{" "}
                              {selectedProduct.pricing.finalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Balance Summary */}
                <Card className="bg-muted/50 border-0">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">
                        Current Balance
                      </span>
                      <span className="font-semibold">
                        {customer.balanceCurrency}{" "}
                        {customer.currentBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">After This Purchase</span>
                      <span
                        className={`font-bold text-lg ${
                          customer.currentBalance -
                            (selectedProduct.isVariableValue && customAmount
                              ? parseFloat(customAmount) *
                                (1 +
                                  selectedProduct.pricing.markup /
                                    selectedProduct.pricing.costPrice)
                              : selectedProduct.pricing.finalPrice) >=
                          0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {customer.balanceCurrency}{" "}
                        {(
                          customer.currentBalance -
                          (selectedProduct.isVariableValue && customAmount
                            ? parseFloat(customAmount) *
                              (1 +
                                selectedProduct.pricing.markup /
                                  selectedProduct.pricing.costPrice)
                            : selectedProduct.pricing.finalPrice)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProductModal(false);
                    setCustomAmount("");
                  }}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    sending ||
                    !customer.emailVerified ||
                    (selectedProduct.isVariableValue && !customAmount) ||
                    customer.currentBalance <
                      (selectedProduct.isVariableValue && customAmount
                        ? parseFloat(customAmount) *
                          (1 +
                            selectedProduct.pricing.markup /
                              selectedProduct.pricing.costPrice)
                        : selectedProduct.pricing.finalPrice)
                  }
                >
                  {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {sending
                    ? t("customer.portal.sendMinutes.sending")
                    : t("customer.portal.sendMinutes.sendButton")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
