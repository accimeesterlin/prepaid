"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTierInfo, SubscriptionTier } from "@/lib/pricing";

interface UpgradePromptProps {
  currentTier?: SubscriptionTier;
  targetTier: SubscriptionTier;
  reason: string;
  featureBlocked?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function UpgradePrompt({
  targetTier,
  reason,
  featureBlocked,
  dismissible = true,
  onDismiss,
}: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const targetTierInfo = getTierInfo(targetTier);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Alert className="border-primary/50 bg-primary/5 relative">
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">
        Upgrade to {targetTierInfo.name}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{reason}</p>

        {featureBlocked && (
          <p className="text-sm font-medium">🔒 {featureBlocked}</p>
        )}

        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href={`/dashboard/billing/upgrade?to=${targetTier}`}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Compare Plans</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specialized variants for common use cases
export function TransactionLimitPrompt({
  currentTier,
  currentCount,
  limit,
}: {
  currentTier: SubscriptionTier;
  currentCount: number;
  limit: number;
}) {
  const targetTier =
    currentTier === SubscriptionTier.STARTER
      ? SubscriptionTier.GROWTH
      : SubscriptionTier.SCALE;

  const percentage = (currentCount / limit) * 100;

  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={targetTier}
      reason={`You've used ${currentCount} of ${limit} transactions this month (${Math.round(percentage)}%). Upgrade to process more transactions.`}
      featureBlocked={`Transaction limit: ${currentCount}/${limit}`}
    />
  );
}

export function TeamMemberLimitPrompt({
  currentTier,
  currentCount,
  limit,
}: {
  currentTier: SubscriptionTier;
  currentCount: number;
  limit: number;
}) {
  const targetTier =
    currentTier === SubscriptionTier.STARTER
      ? SubscriptionTier.GROWTH
      : SubscriptionTier.SCALE;

  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={targetTier}
      reason={`You've reached your team member limit (${currentCount}/${limit}). Upgrade to add more team members.`}
      featureBlocked="Cannot invite more team members"
    />
  );
}

export function FeatureLockedPrompt({
  currentTier,
  featureName,
  targetTier = SubscriptionTier.GROWTH,
}: {
  currentTier: SubscriptionTier;
  featureName: string;
  targetTier?: SubscriptionTier;
}) {
  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={targetTier}
      reason={`${featureName} is available on the ${getTierInfo(targetTier).name} plan and above.`}
      featureBlocked={featureName}
      dismissible={false}
    />
  );
}

export function WhiteLabelPrompt({
  currentTier,
}: {
  currentTier: SubscriptionTier;
}) {
  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={SubscriptionTier.SCALE}
      reason="Remove our branding and use your own custom domain with full white-label capabilities."
      featureBlocked="Full White Label & Custom Domain"
    />
  );
}

export function APIAccessPrompt({
  currentTier,
}: {
  currentTier: SubscriptionTier;
}) {
  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={SubscriptionTier.GROWTH}
      reason="Enable API access for your customers and integrate with your own systems."
      featureBlocked="Customer API Access"
    />
  );
}
