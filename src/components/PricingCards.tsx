"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllTiers, getTierInfo, SubscriptionTier } from "@/lib/pricing";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PricingCardsProps {
  variant?: "homepage" | "full";
  showAllFeatures?: boolean;
}

export function PricingCards({ variant = "homepage", showAllFeatures = false }: PricingCardsProps) {
  const { t } = useLanguage();

  const tiers = variant === "homepage"
    ? [SubscriptionTier.STARTER, SubscriptionTier.GROWTH, SubscriptionTier.SCALE]
    : getAllTiers();

  return (
    <>
      <div className={`grid gap-6 max-w-4xl mx-auto ${
        variant === "homepage" ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"
      }`}>
        {tiers.map((tier) => {
          const info = getTierInfo(tier);
          const isPopular = tier === SubscriptionTier.GROWTH;
          const isEnterprise = tier === SubscriptionTier.ENTERPRISE;
          const isScale = tier === SubscriptionTier.SCALE;

          const features = showAllFeatures
            ? info.highlights
            : [
                tier === SubscriptionTier.STARTER
                  ? t("homepage.pricingCards.orgs1")
                  : tier === SubscriptionTier.GROWTH
                  ? t("homepage.pricingCards.orgs3")
                  : t("homepage.pricingCards.orgsUnlimited"),
                info.features.maxTransactionsPerMonth === "unlimited"
                  ? t("homepage.pricingCards.transactionsUnlimited")
                  : `${info.features.maxTransactionsPerMonth} ${t("homepage.pricingCards.transactionsUnlimited").split(" ").slice(1).join(" ")}`,
                tier === SubscriptionTier.STARTER
                  ? t("homepage.pricingCards.publicStorefront")
                  : tier === SubscriptionTier.GROWTH
                  ? t("homepage.pricingCards.apiWebhooks")
                  : t("homepage.pricingCards.priorityProcessing"),
                tier === SubscriptionTier.STARTER
                  ? t("homepage.pricingCards.basicAnalytics")
                  : tier === SubscriptionTier.GROWTH
                  ? t("homepage.pricingCards.advancedAnalytics")
                  : t("homepage.pricingCards.fullWhiteLabel"),
              ];

          return (
            <div
              key={tier}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                isPopular
                  ? "border-gray-900 shadow-lg bg-gray-900 text-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-white text-gray-900 border-0 shadow-sm text-xs font-bold px-3">
                    {t("homepage.pricingCards.mostPopular")}
                  </Badge>
                </div>
              )}

              <h3 className={`text-sm font-bold uppercase tracking-wide ${
                isPopular ? "text-gray-300" : "text-gray-500"
              }`}>
                {info.name}
              </h3>

              <div className="mt-3 flex items-baseline gap-1">
                {isEnterprise ? (
                  <span className="text-4xl font-bold">{t("homepage.pricingCards.custom")}</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">${info.features.monthlyFee}</span>
                    <span className={`text-sm ${isPopular ? "text-gray-400" : "text-gray-500"}`}>
                      {info.features.monthlyFee === 0 ? t("homepage.pricingCards.forever") : t("homepage.pricingCards.perMonth")}
                    </span>
                  </>
                )}
              </div>

              <p className={`text-xs mt-1 ${isPopular ? "text-gray-400" : "text-gray-400"}`}>
                {tier === SubscriptionTier.STARTER
                  ? t("homepage.pricingCards.freeToStart")
                  : tier === SubscriptionTier.GROWTH
                  ? t("homepage.pricingCards.mostPopular")
                  : tier === SubscriptionTier.SCALE
                  ? t("homepage.pricingCards.forFintechs")
                  : t("homepage.pricingCards.forEnterprises")}
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      isPopular ? "text-gray-400" : "text-gray-400"
                    }`} />
                    <span className={`text-sm ${isPopular ? "text-gray-200" : "text-gray-600"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={isEnterprise || isScale ? "/contact-sales" : isPopular ? "/signup" : "/pricing"} className="mt-8">
                <Button
                  className={`w-full h-10 font-semibold text-sm ${
                    isPopular
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isEnterprise ? t("homepage.pricingCards.contactSales") : info.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {variant === "homepage" && (
        <p className="text-center text-sm text-gray-400 mt-8">
          {t("homepage.pricingCards.annualSavings")} &middot;{" "}
          <Link href="/pricing" className="text-gray-600 underline underline-offset-4 hover:text-gray-900">
            {t("homepage.pricingCards.seeFullComparison")}
          </Link>
        </p>
      )}
    </>
  );
}
