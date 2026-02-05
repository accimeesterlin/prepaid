"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { getTierInfo, getNextTier, SubscriptionTier } from "@/lib/pricing";
import { DashboardLayout } from "@/components/dashboard-layout";
import { toast } from "@pg-prepaid/ui";

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: string;
  usage: {
    transactions: number;
    transactionLimit: number | "unlimited";
    teamMembers: number;
    teamMemberLimit: number | "unlimited";
    organizations: number;
    organizationLimit: number | "unlimited";
  };
  monthlyFee: number;
  transactionFeePercentage: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/v1/subscriptions/current");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: Failed to fetch subscription`,
        );
      }
      const data = await response.json();
      console.log("Subscription data:", data);

      // The API returns data directly, not wrapped in { data: ... }
      setSubscription(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      setUpgrading(true);
      const response = await fetch("/api/v1/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, months: selectedMonths }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create upgrade payment");
      }

      const data = await response.json();

      // Redirect to PGPay checkout
      window.location.href = data.redirectUrl;
      // Don't reset upgrading state here — the page is navigating away.
      // The button stays in loading state until the redirect completes.
    } catch (err) {
      console.error("Upgrade error:", err);
      toast({
        title: "Upgrade Failed",
        description: err instanceof Error ? err.message : "Failed to upgrade. Please try again.",
        variant: "error",
      });
      setUpgrading(false);
    }
  };

  const calculateDiscountedPrice = (monthlyFee: number, months: number) => {
    const total = monthlyFee * months;
    let discount = 0;
    if (months === 3) discount = 0.05;
    if (months === 6) discount = 0.1;
    if (months === 12) discount = 0.15;
    return total * (1 - discount);
  };

  const getDiscountLabel = (months: number) => {
    if (months === 3) return "Save 5%";
    if (months === 6) return "Save 10%";
    if (months === 12) return "Save 15%";
    return "";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !subscription) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error || "Failed to load billing information"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const tierInfo = getTierInfo(subscription.tier);
  const nextTier = getNextTier(subscription.tier);
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view your usage
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tierInfo.name} Plan
                  <Badge
                    variant={
                      subscription.status === "active" ? "default" : "secondary"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{tierInfo.description}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  ${subscription.monthlyFee}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {daysUntilRenewal > 0
                      ? `Renews in ${daysUntilRenewal} days`
                      : "Renews today"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Transaction Fee: {subscription.transactionFeePercentage}%
                </div>
              </div>

              {nextTier && (() => {
                const nextInfo = getTierInfo(nextTier);
                const totalAmount = calculateDiscountedPrice(nextInfo.features.monthlyFee, selectedMonths);
                const formatLimit = (val: number | "unlimited") => val === "unlimited" ? "Unlimited" : String(val);

                return (
                  <div className="space-y-4 pt-2">
                    {/* Month selector */}
                    <div>
                      <label className="text-sm font-medium">Prepay for:</label>
                      <Select
                        value={selectedMonths.toString()}
                        onValueChange={(value) =>
                          setSelectedMonths(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            1 Month - ${nextInfo.features.monthlyFee}
                          </SelectItem>
                          <SelectItem value="3">
                            3 Months - ${calculateDiscountedPrice(nextInfo.features.monthlyFee, 3).toFixed(2)}
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700">Save 5%</Badge>
                          </SelectItem>
                          <SelectItem value="6">
                            6 Months - ${calculateDiscountedPrice(nextInfo.features.monthlyFee, 6).toFixed(2)}
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700">Save 10%</Badge>
                          </SelectItem>
                          <SelectItem value="12">
                            12 Months - ${calculateDiscountedPrice(nextInfo.features.monthlyFee, 12).toFixed(2)}
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700">Save 15%</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Upgrade preview panel */}
                    <div className="border rounded-lg bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">What you get with {nextInfo.name}</p>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Preview</Badge>
                      </div>

                      {/* Highlights checklist */}
                      <div className="grid sm:grid-cols-2 gap-1.5">
                        {nextInfo.highlights.map((feature, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Current vs Next comparison */}
                      <div className="border-t pt-3 mt-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">What changes</p>
                        <div className="space-y-1.5">
                          {[
                            {
                              label: "Monthly Transactions",
                              current: formatLimit(subscription.usage.transactionLimit),
                              next: formatLimit(nextInfo.features.maxTransactionsPerMonth),
                            },
                            {
                              label: "Transaction Fee",
                              current: `${subscription.transactionFeePercentage}%`,
                              next: `${nextInfo.features.transactionFeePercentage}%`,
                            },
                            {
                              label: "Team Members",
                              current: formatLimit(subscription.usage.teamMemberLimit),
                              next: formatLimit(nextInfo.features.maxTeamMembers),
                            },
                            {
                              label: "Organizations",
                              current: formatLimit(subscription.usage.organizationLimit),
                              next: formatLimit(nextInfo.features.maxOrganizations),
                            },
                          ].map(({ label, current, next }) => (
                            current !== next && (
                              <div key={label} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground line-through">{current}</span>
                                  <ArrowDown className="h-3 w-3 text-green-600 rotate-90" />
                                  <span className="font-semibold text-green-700">{next}</span>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Pricing summary */}
                      <div className="border-t pt-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            ${nextInfo.features.monthlyFee}/mo &times; {selectedMonths} month{selectedMonths > 1 ? "s" : ""}
                            {selectedMonths > 1 && (
                              <span className="text-green-600 font-medium ml-1">• {getDiscountLabel(selectedMonths)}</span>
                            )}
                          </p>
                        </div>
                        <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Upgrade button */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={() => handleUpgrade(nextTier)}
                        disabled={upgrading}
                        className="flex-1"
                      >
                        {upgrading ? (
                          "Processing..."
                        ) : (
                          <>
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Upgrade to {nextInfo.name} — ${totalAmount.toFixed(2)}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/pricing">View All Plans</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid md:grid-cols-3 gap-6">
          <UsageCard
            title="Transactions"
            current={subscription.usage.transactions}
            limit={subscription.usage.transactionLimit}
            icon={TrendingUp}
          />
          <UsageCard
            title="Team Members"
            current={subscription.usage.teamMembers}
            limit={subscription.usage.teamMemberLimit}
            icon={CheckCircle2}
          />
          <UsageCard
            title="Organizations"
            current={subscription.usage.organizations}
            limit={subscription.usage.organizationLimit}
            icon={CreditCard}
          />
        </div>

        {/* Features Included */}
        <Card>
          <CardHeader>
            <CardTitle>Features Included</CardTitle>
            <CardDescription>
              What you get with your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {tierInfo.highlights.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Powered by PGPay - Secure payment processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">PGPay</p>
                  <p className="text-sm text-muted-foreground">
                    Pay with your PGeCom account
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All payments are processed securely through PGPay using your
                PGeCom account balance. No card or bank transfer required.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <BillingHistoryRow
                date="Jan 1, 2026"
                amount={subscription.monthlyFee}
                status="paid"
              />
              <BillingHistoryRow
                date="Dec 1, 2025"
                amount={subscription.monthlyFee}
                status="paid"
              />
              <BillingHistoryRow
                date="Nov 1, 2025"
                amount={subscription.monthlyFee}
                status="paid"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function UsageCard({
  title,
  current,
  limit,
  icon: Icon,
}: {
  title: string;
  current: number;
  limit: number | "unlimited";
  icon: React.ElementType;
}) {
  const isUnlimited = limit === "unlimited";
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isApproachingLimit = percentage >= 80;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{current}</div>
            <div className="text-sm text-muted-foreground">
              / {isUnlimited ? "∞" : limit}
            </div>
          </div>
          {!isUnlimited && (
            <>
              <Progress value={percentage} className="h-2" />
              {isApproachingLimit && (
                <p className="text-xs text-orange-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Approaching limit
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingHistoryRow({
  date,
  amount,
  status,
}: {
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="font-medium">{date}</p>
        <p className="text-sm text-muted-foreground">Monthly subscription</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold">${amount}</span>
        <Badge
          variant={
            status === "paid"
              ? "default"
              : status === "pending"
                ? "secondary"
                : "destructive"
          }
        >
          {status}
        </Badge>
        <Button variant="ghost" size="sm">
          Download
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
