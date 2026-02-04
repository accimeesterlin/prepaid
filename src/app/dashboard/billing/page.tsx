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
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { getTierInfo, getNextTier, SubscriptionTier } from "@/lib/pricing";

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

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/v1/subscriptions/current");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      setSubscription(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !subscription) {
    return (
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
    );
  }

  const tierInfo = getTierInfo(subscription.tier);
  const nextTier = getNextTier(subscription.tier);
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );

  return (
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

            <div className="flex gap-2">
              {nextTier && (
                <Button asChild>
                  <Link href={`/dashboard/billing/upgrade?to=${nextTier}`}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Upgrade to {getTierInfo(nextTier).name}
                  </Link>
                </Button>
              )}
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
          <CardDescription>What you get with your current plan</CardDescription>
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
          <CardDescription>Manage your billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
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
