"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Zap, TrendingUp, Rocket, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllTiers, getTierInfo, SubscriptionTier } from "@/lib/pricing";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ─────────────────────────────────────────────────────────── */
/*  STATIC CONFIG                                               */
/* ─────────────────────────────────────────────────────────── */

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [SubscriptionTier.STARTER]: Zap,
  [SubscriptionTier.GROWTH]: TrendingUp,
  [SubscriptionTier.SCALE]: Rocket,
  [SubscriptionTier.ENTERPRISE]: Building2,
};

/* ─────────────────────────────────────────────────────────── */
/*  SUB-COMPONENTS                                              */
/* ─────────────────────────────────────────────────────────── */

function FeatureRow({
  feature,
  values,
}: {
  feature: string;
  values: (boolean | string)[];
}) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4 font-medium">{feature}</td>
      {values.map((value, index) => (
        <td key={index} className="text-center p-4">
          {typeof value === "boolean" ? (
            value ? (
              <Check className="h-5 w-5 text-primary mx-auto" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground mx-auto" />
            )
          ) : (
            <span>{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex justify-between items-center hover:bg-muted/50 transition"
      >
        <span className="font-semibold">{question}</span>
        <span className="text-2xl">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-muted-foreground">{answer}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  PAGE                                                        */
/* ─────────────────────────────────────────────────────────── */

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const { t } = useLanguage();

  const tiers = getAllTiers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          {t("pricing.badge")}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {t("pricing.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("pricing.subtitle")}
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={
              billingCycle === "monthly"
                ? "font-semibold"
                : "text-muted-foreground"
            }
          >
            {t("pricing.monthly")}
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
            }
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                billingCycle === "annual" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={
              billingCycle === "annual"
                ? "font-semibold"
                : "text-muted-foreground"
            }
          >
            {t("pricing.annual")}{" "}
            <Badge variant="secondary" className="ml-2">
              {t("pricing.savePercent")}
            </Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const info = getTierInfo(tier);
            const Icon = TIER_ICONS[tier];
            const isPopular = tier === SubscriptionTier.GROWTH;
            const isEnterprise = tier === SubscriptionTier.ENTERPRISE;
            const isScale = tier === SubscriptionTier.SCALE;

            const tierName = t(`pricing.tiers.${tier}.name`);
            const tierDesc = t(`pricing.tiers.${tier}.description`);
            const tierCta = t(`pricing.tiers.${tier}.cta`);
            const tierHighlights = [
              t(`pricing.tiers.${tier}.highlight1`),
              t(`pricing.tiers.${tier}.highlight2`),
              t(`pricing.tiers.${tier}.highlight3`),
              t(`pricing.tiers.${tier}.highlight4`),
              t(`pricing.tiers.${tier}.highlight5`),
            ];

            return (
              <Card
                key={tier}
                className={`relative ${
                  isPopular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      {t("pricing.mostPopular")}
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{tierName}</CardTitle>
                  </div>
                  <CardDescription>{tierDesc}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    {isEnterprise ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">{t("pricing.custom")}</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          $
                          {billingCycle === "annual"
                            ? Math.floor(info.features.monthlyFee * 0.8)
                            : info.features.monthlyFee}
                        </span>
                        {info.features.monthlyFee > 0 && (
                          <span className="text-muted-foreground ml-2">
                            {t("pricing.perMonth")}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {info.features.transactionFeePercentage}% {t("pricing.transactionFee")}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tierHighlights.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                  >
                    <Link href={isEnterprise || isScale ? "/contact-sales" : "/signup"}>
                      {tierCta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("pricing.comparisonTitle")}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">
                  {t("pricing.comparisonFeature")}
                </th>
                {tiers.map((tier) => (
                  <th key={tier} className="text-center p-4">
                    {t(`pricing.tiers.${tier}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <FeatureRow
                feature={t("pricing.comparisonOrgs")}
                values={tiers.map((tier) => {
                  const info = getTierInfo(tier);
                  return info.features.maxOrganizations === "unlimited"
                    ? t("pricing.unlimited")
                    : String(info.features.maxOrganizations);
                })}
              />
              <FeatureRow
                feature={t("pricing.comparisonTeam")}
                values={tiers.map((tier) => {
                  const info = getTierInfo(tier);
                  return info.features.maxTeamMembers === "unlimited"
                    ? t("pricing.unlimited")
                    : String(info.features.maxTeamMembers);
                })}
              />
              <FeatureRow
                feature={t("pricing.comparisonTransactions")}
                values={tiers.map((tier) => {
                  const info = getTierInfo(tier);
                  return info.features.maxTransactionsPerMonth === "unlimited"
                    ? t("pricing.unlimited")
                    : String(info.features.maxTransactionsPerMonth);
                })}
              />
              <FeatureRow
                feature={t("pricing.whiteLabel")}
                values={tiers.map((tier) => {
                  const info = getTierInfo(tier);
                  const wl = info.features.whiteLabel;
                  return wl === true
                    ? t("pricing.full")
                    : wl === "partial"
                      ? t("pricing.partial")
                      : t("pricing.no");
                })}
              />
              <FeatureRow
                feature={t("pricing.customDomain")}
                values={tiers.map(
                  (tier) => getTierInfo(tier).features.customDomain,
                )}
              />
              <FeatureRow
                feature={t("pricing.apiAccess")}
                values={tiers.map(
                  (tier) => getTierInfo(tier).features.apiAccess,
                )}
              />
              <FeatureRow
                feature={t("pricing.webhooks")}
                values={tiers.map((tier) => {
                  const info = getTierInfo(tier);
                  const wh = info.features.webhooks;
                  return wh === "advanced"
                    ? t("pricing.advanced")
                    : wh === true
                      ? t("pricing.basic")
                      : false;
                })}
              />
              <FeatureRow
                feature={t("pricing.zapier")}
                values={tiers.map((tier) => getTierInfo(tier).features.zapier)}
              />
              <FeatureRow
                feature={t("pricing.advancedAnalytics")}
                values={tiers.map(
                  (tier) => getTierInfo(tier).features.advancedAnalytics,
                )}
              />
              <FeatureRow
                feature={t("pricing.priorityProcessing")}
                values={tiers.map(
                  (tier) => getTierInfo(tier).features.priorityProcessing,
                )}
              />
              <FeatureRow
                feature={t("pricing.dedicatedSupport")}
                values={tiers.map(
                  (tier) => getTierInfo(tier).features.dedicatedSupport,
                )}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("pricing.faqTitle")}
        </h2>

        <div className="space-y-6">
          <FAQItem question={t("pricing.faq1Q")} answer={t("pricing.faq1A")} />
          <FAQItem question={t("pricing.faq2Q")} answer={t("pricing.faq2A")} />
          <FAQItem question={t("pricing.faq3Q")} answer={t("pricing.faq3A")} />
          <FAQItem question={t("pricing.faq4Q")} answer={t("pricing.faq4A")} />
          <FAQItem question={t("pricing.faq5Q")} answer={t("pricing.faq5A")} />
          <FAQItem question={t("pricing.faq6Q")} answer={t("pricing.faq6A")} />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-3xl mx-auto bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <h2 className="text-3xl font-bold mb-4">{t("pricing.ctaTitle")}</h2>
            <p className="text-lg mb-6 opacity-90">
              {t("pricing.ctaSubtitle")}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">{t("pricing.ctaStart")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact-sales">{t("pricing.ctaContact")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
