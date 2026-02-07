"use client";

import { ArrowDown, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTierInfo, SubscriptionTier } from "@/lib/pricing";
import type { SubscriptionData } from "@/types/subscription";

interface SubscriptionUpgradePreviewProps {
  subscription: SubscriptionData;
  nextTier: SubscriptionTier;
  selectedMonths: number;
  onSelectedMonthsChange: (value: number) => void;
  upgrading: boolean;
  onUpgrade: (tier: SubscriptionTier) => void;
}

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

export function SubscriptionUpgradePreview({
  subscription,
  nextTier,
  selectedMonths,
  onSelectedMonthsChange,
  upgrading,
  onUpgrade,
}: SubscriptionUpgradePreviewProps) {
  const nextInfo = getTierInfo(nextTier);
  const totalAmount = calculateDiscountedPrice(
    nextInfo.features.monthlyFee,
    selectedMonths,
  );

  const formatLimit = (val: number | "unlimited") =>
    val === "unlimited" ? "Unlimited" : String(val);

  return (
    <div className="space-y-4 pt-2">
      {/* Month selector */}
      <div>
        <label className="text-sm font-medium">Prepay for:</label>
        <Select
          value={selectedMonths.toString()}
          onValueChange={(value) => onSelectedMonthsChange(parseInt(value))}
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">
              1 Month - ${nextInfo.features.monthlyFee}
            </SelectItem>
            <SelectItem value="3">
              3 Months - $
              {calculateDiscountedPrice(
                nextInfo.features.monthlyFee,
                3,
              ).toFixed(2)}
              <Badge
                className="ml-2 bg-green-50 text-green-700"
                variant="secondary"
              >
                Save 5%
              </Badge>
            </SelectItem>
            <SelectItem value="6">
              6 Months - $
              {calculateDiscountedPrice(
                nextInfo.features.monthlyFee,
                6,
              ).toFixed(2)}
              <Badge
                className="ml-2 bg-green-50 text-green-700"
                variant="secondary"
              >
                Save 10%
              </Badge>
            </SelectItem>
            <SelectItem value="12">
              12 Months - $
              {calculateDiscountedPrice(
                nextInfo.features.monthlyFee,
                12,
              ).toFixed(2)}
              <Badge
                className="ml-2 bg-green-50 text-green-700"
                variant="secondary"
              >
                Save 15%
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upgrade preview panel */}
      <div className="border rounded-lg bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            What you get with {nextInfo.name}
          </p>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Preview
          </Badge>
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
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
            What changes
          </p>
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
            ].map(({ label, current, next }) =>
              current !== next ? (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground line-through">
                      {current}
                    </span>
                    <ArrowDown className="h-3 w-3 text-green-600 rotate-90" />
                    <span className="font-semibold text-green-700">{next}</span>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>

        {/* Pricing summary */}
        <div className="border-t pt-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              ${nextInfo.features.monthlyFee}/mo × {selectedMonths} month
              {selectedMonths > 1 ? "s" : ""}
              {selectedMonths > 1 && (
                <span className="text-green-600 font-medium ml-1">
                  • {getDiscountLabel(selectedMonths)}
                </span>
              )}
            </p>
          </div>
          <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
        </div>

        {/* Upgrade button */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => onUpgrade(nextTier)}
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
    </div>
  );
}
