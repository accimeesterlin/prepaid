# Agent Instructions: Pricing Tier Implementation

This document defines the pricing tiers for PG Prepaid Minutes platform. AI agents should implement these tiers consistently across the entire codebase including:

- Database models
- API endpoints
- Frontend UI components
- Billing logic
- Feature gating
- Transaction fee calculation
- Limits enforcement

---

## Pricing Tiers Overview

### 1. **Starter — "Launch" Plan**

**Target Audience:** Solo reseller, testing market  
**Business Goal:** Acquisition + revenue via high transaction fees

**Pricing:**

- **Monthly Fee:** $0
- **Transaction Fee:** 3.5% – 4%

**Included Features:**

- ✅ Global Mobile Top-Ups (DingConnect + Reloadly)
- ✅ 1 Organization
- ✅ 1 Team member
- ✅ Public Storefront (basic branding)
- ✅ Customer Portal (your branding)
- ✅ Product & Pricing Management
- ✅ Transaction Management
- ✅ Basic Wallet & Balance
- ✅ Basic Email (transactional)
- ✅ Basic Analytics (revenue + transactions)
- ✅ Countries: All (but limited filters)

**Limits & Restrictions:**

- ⚠️ Max 100–200 transactions / month
- ❌ No white-label
- ❌ No API access for customers
- ❌ No webhooks
- ❌ No advanced discounts
- ❌ No Zapier / automation

**Implementation Notes:**

- This tier makes money purely from fees and acts as lead generator
- Default tier for new signups
- Upgrade prompts should appear when approaching transaction limits

---

### 2. **Growth — "Business" Plan**

**Target Audience:** Real businesses selling daily  
**Business Goal:** Recurring SaaS + still good volume fees

**Pricing:**

- **Monthly Fee:** $99 – $149
- **Transaction Fee:** 1.5% – 2%

**Included Features (Everything in Starter +):**

- ✅ Up to 3 Organizations
- ✅ Up to 5 Team members
- ✅ Role-based access control
- ✅ **Partial White Label:**
  - Logo customization
  - Brand colors
  - Business name
- ✅ Customer API access
- ✅ Auto-generated API docs
- ✅ Full Analytics & Dashboards
- ✅ Customer Search
- ✅ Discounts & Promotions
- ✅ Country Management
- ✅ Webhooks (basic)
- ✅ Zapier integration
- ✅ Marketing integrations (Mailchimp)
- ✅ Balance alerts
- ✅ Test mode
- ✅ Staff portal (limited)

**Limits & Restrictions:**

- ✅ Unlimited transactions / month
- ⚠️ Limited API rate
- ⚠️ Partial branding only (no custom domain)

**Implementation Notes:**

- This is the main volume tier
- Most customers should land here
- Focus on conversion from Starter to Growth

---

### 3. **Scale — "White Label Pro"**

**Target Audience:** Fintechs, payment companies, serious operations  
**Business Goal:** High MRR + sticky infrastructure

**Pricing:**

- **Monthly Fee:** $299 – $499
- **Transaction Fee:** 0.75% – 1%

**Included Features (Everything in Growth +):**

- ✅ Unlimited Organizations
- ✅ Unlimited Team members
- ✅ **Full White Label:**
  - Custom domain
  - Remove platform branding
  - Full Customer Portal white-label
  - Full Storefront white-label
- ✅ Advanced Webhooks
- ✅ Priority processing
- ✅ Advanced Analytics (KPIs, success rate, margins)
- ✅ Integration health monitoring
- ✅ Advanced discount rules
- ✅ Staff API keys
- ✅ Multi-language fully enabled
- ✅ Audit logs
- ✅ Advanced security controls
- ✅ Higher API limits

**Limits & Restrictions:**

- ⚠️ Higher transaction volumes supported
- ⚠️ Higher API rate limits

**Implementation Notes:**

- Target tier for enterprise customers
- Position as "Stripe-for-Topups"
- White-label capabilities are key differentiator

---

### 4. **Enterprise — "Infrastructure Partner"**

**Target Audience:** Aggregators, telcos, banks  
**Business Goal:** Custom contracts + maximum revenue

**Pricing:**

- **Monthly Fee:** $1,000 – $5,000+
- **Transaction Fee:** 0.25% – 0.5% or flat CPM (cost per mille)

**Included Features (Everything in Scale +):**

- ✅ Dedicated infrastructure
- ✅ Custom integrations
- ✅ SLA contracts
- ✅ Dedicated support
- ✅ Custom features
- ✅ On-prem / private cloud option
- ✅ Custom billing models
- ✅ Revenue share deals

**Limits & Restrictions:**

- ✅ No limits (negotiated per contract)
- ✅ Custom implementation based on needs

**Implementation Notes:**

- Custom contracts
- Negotiated pricing
- May require custom codebase deployment
- Focus on long-term partnerships

---

## Implementation Checklist

### Database Models to Update:

- [ ] `Organization` model - add `subscriptionTier` field (enum: starter, growth, scale, enterprise)
- [ ] `Organization` model - add `transactionFeePercentage` field
- [ ] `Organization` model - add `monthlyTransactionLimit` field
- [ ] `Organization` model - add `teamMemberLimit` field
- [ ] `Organization` model - add `organizationLimit` field (for parent accounts)
- [ ] `Organization` model - add `features` object with feature flags
- [ ] Create `Subscription` model for billing tracking
- [ ] Create `Invoice` model for monthly billing

### API Endpoints to Create/Update:

- [ ] `POST /api/v1/subscriptions/upgrade` - Handle tier upgrades
- [ ] `POST /api/v1/subscriptions/downgrade` - Handle tier downgrades
- [ ] `GET /api/v1/subscriptions/current` - Get current subscription details
- [ ] `GET /api/v1/subscriptions/usage` - Get usage metrics vs limits
- [ ] `POST /api/v1/billing/calculate-fee` - Calculate transaction fees
- [ ] Add tier checking to all feature endpoints

### Frontend Components to Create/Update:

- [ ] `src/app/dashboard/billing/page.tsx` - Billing dashboard
- [ ] `src/app/dashboard/subscription/page.tsx` - Subscription management
- [ ] `src/components/PricingTable.tsx` - Public pricing table
- [ ] `src/components/UpgradePrompt.tsx` - Upgrade prompts
- [ ] `src/components/UsageWidget.tsx` - Show usage vs limits
- [ ] Add feature gates to all restricted features
- [ ] Add upgrade CTAs throughout the app

### Transaction Fee Logic:

- [ ] Implement fee calculation in transaction processing
- [ ] Add fee to transaction records
- [ ] Show fees in transaction details
- [ ] Include fees in analytics
- [ ] Create monthly fee reports

### Limits Enforcement:

- [ ] Check transaction count before allowing new transactions
- [ ] Check team member count before inviting
- [ ] Check organization count before creating new org
- [ ] Enforce API rate limits based on tier
- [ ] Show warnings when approaching limits

### Feature Gating:

```typescript
// Example feature gate implementation
enum SubscriptionTier {
  STARTER = "starter",
  GROWTH = "growth",
  SCALE = "scale",
  ENTERPRISE = "enterprise",
}

interface TierFeatures {
  maxOrganizations: number | "unlimited";
  maxTeamMembers: number | "unlimited";
  maxTransactionsPerMonth: number | "unlimited";
  transactionFeePercentage: number;
  whiteLabel: boolean | "partial";
  customDomain: boolean;
  apiAccess: boolean;
  webhooks: boolean | "advanced";
  zapier: boolean;
  advancedDiscounts: boolean;
  staffPortal: boolean | "limited";
  priorityProcessing: boolean;
  auditLogs: boolean;
  multiLanguage: boolean | "full";
  dedicatedSupport: boolean;
}

const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  [SubscriptionTier.STARTER]: {
    maxOrganizations: 1,
    maxTeamMembers: 1,
    maxTransactionsPerMonth: 200,
    transactionFeePercentage: 4.0,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false,
    webhooks: false,
    zapier: false,
    advancedDiscounts: false,
    staffPortal: false,
    priorityProcessing: false,
    auditLogs: false,
    multiLanguage: false,
    dedicatedSupport: false,
  },
  [SubscriptionTier.GROWTH]: {
    maxOrganizations: 3,
    maxTeamMembers: 5,
    maxTransactionsPerMonth: "unlimited",
    transactionFeePercentage: 2.0,
    whiteLabel: "partial",
    customDomain: false,
    apiAccess: true,
    webhooks: true,
    zapier: true,
    advancedDiscounts: false,
    staffPortal: "limited",
    priorityProcessing: false,
    auditLogs: false,
    multiLanguage: false,
    dedicatedSupport: false,
  },
  [SubscriptionTier.SCALE]: {
    maxOrganizations: "unlimited",
    maxTeamMembers: "unlimited",
    maxTransactionsPerMonth: "unlimited",
    transactionFeePercentage: 1.0,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
    webhooks: "advanced",
    zapier: true,
    advancedDiscounts: true,
    staffPortal: true,
    priorityProcessing: true,
    auditLogs: true,
    multiLanguage: "full",
    dedicatedSupport: false,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxOrganizations: "unlimited",
    maxTeamMembers: "unlimited",
    maxTransactionsPerMonth: "unlimited",
    transactionFeePercentage: 0.5,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true,
    webhooks: "advanced",
    zapier: true,
    advancedDiscounts: true,
    staffPortal: true,
    priorityProcessing: true,
    auditLogs: true,
    multiLanguage: "full",
    dedicatedSupport: true,
  },
};
```

---

## Pricing Page Implementation

Create a public pricing page at `/pricing` that shows all tiers with clear CTAs:

```tsx
// src/app/pricing/page.tsx structure
- Hero section: "Simple, transparent pricing"
- Tier comparison table
- Feature comparison matrix
- FAQ section
- CTA: "Start Free" or "Contact Sales"
```

---

## Migration Strategy

### For Existing Users:

1. All existing organizations default to **Starter** tier
2. Grace period: 30 days to choose paid plan if over limits
3. Send email notifications about new pricing
4. Grandfather existing high-volume users to Growth tier

### Rollout Plan:

1. **Phase 1:** Add database models and tier tracking
2. **Phase 2:** Implement feature gates (soft limits, show warnings)
3. **Phase 3:** Add billing UI and subscription management
4. **Phase 4:** Integrate payment processing (Stripe)
5. **Phase 5:** Enforce hard limits
6. **Phase 6:** Public launch with marketing

---

## Testing Requirements

- [ ] Test tier upgrades/downgrades
- [ ] Test transaction limit enforcement
- [ ] Test transaction fee calculation at each tier
- [ ] Test feature gates for each tier
- [ ] Test API rate limiting
- [ ] Test upgrade prompts and CTAs
- [ ] Test billing calculations
- [ ] Test usage metrics accuracy

---

## Analytics to Track

- Tier distribution (% of users per tier)
- Conversion rate from Starter to Growth
- Churn rate per tier
- Average revenue per user (ARPU) per tier
- Transaction volume per tier
- Feature usage per tier
- Upgrade/downgrade frequency
- Time to first upgrade

---

## Notes for AI Agents

When implementing pricing:

1. **Always check tier** before allowing access to features
2. **Calculate fees** based on organization's tier
3. **Show upgrade prompts** when users hit limits
4. **Track usage** to show progress toward limits
5. **Make upgrades frictionless** - one-click when possible
6. **Grandfather carefully** - don't break existing users
7. **Test thoroughly** - billing bugs are critical
8. **Log everything** - billing disputes need audit trail

This is a **freemium + usage-based hybrid model** designed to:

- Acquire users for free (Starter)
- Convert to SaaS (Growth)
- Capture enterprise value (Scale/Enterprise)

---

## Google Translate / Browser Extension DOM Patch (REQUIRED)

Browser extensions like Google Translate inject `<font>` wrapper nodes into the DOM, which causes React's `removeChild` and `insertBefore` calls to fail with:

> "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."

### a) Layout-level patches (root layout file)

**This fix is mandatory in every root layout file.** Three things are required:

1. **Inline `<script>` in `<head>`** that patches `Node.prototype.removeChild` and `Node.prototype.insertBefore` BEFORE React hydration:

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){if(typeof Node!=='undefined'&&Node.prototype&&!Node.prototype.__rcPatched){var origRC=Node.prototype.removeChild;Node.prototype.removeChild=function(child){if(child&&child.parentNode===this){return origRC.call(this,child)}return child};var origIB=Node.prototype.insertBefore;Node.prototype.insertBefore=function(newNode,refNode){if(refNode&&refNode.parentNode!==this){return origRC.call(this,newNode,null)}return origIB.call(this,newNode,refNode)};Node.prototype.__rcPatched=true}})();`,
    }}
  />
</head>
```

2. **`suppressHydrationWarning`** on `<html>` tag
3. **`suppressHydrationWarning`** on `<body>` tag

### b) `translate="no"` on shadcn/Radix portal components (REQUIRED)

Browser translation mutates the DOM inside React portals (overlays, dropdowns, dialogs, etc.), causing `removeChild` errors when Radix tries to unmount them. Adding `translate="no"` tells the browser not to translate those subtrees, **preventing the problem at the source**.

**Every shadcn/Radix portal-based component wrapper must have `translate="no"` on its Content, Trigger, and Item sub-components.** Target files in `src/components/ui/`:

- `select.tsx` — SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectValue, SelectLabel
- `dialog.tsx` — DialogTrigger, DialogClose, DialogOverlay, DialogContent
- `dropdown-menu.tsx` — DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, etc.
- `popover.tsx` — PopoverTrigger, PopoverContent
- `tooltip.tsx` — TooltipTrigger, TooltipContent
- `alert-dialog.tsx` — AlertDialogTrigger, AlertDialogOverlay, AlertDialogContent
- `sheet.tsx` — SheetTrigger, SheetClose, SheetOverlay, SheetContent
- `command.tsx` — Command, CommandInput, CommandGroup, CommandItem
- Any other portal-based components (context-menu, hover-card, menubar, navigation-menu)

**Pattern:**

```tsx
<SomePrimitive.Content translate="no" {...props} />
<SomePrimitive.Trigger translate="no" {...props} />
<SomePrimitive.Item translate="no" {...props} />
```

**Reference:** https://medium.com/@hridoycodev/fixing-the-removechild-dom-notfounderror-caused-by-browser-translation-in-radix-shadcn-ui-130690e42eb2

**DO NOT:**

- Only patch `document.body` — Google Translate wraps nodes throughout the entire DOM tree
- Use a `useEffect` as the only fix — it runs too late, after React hydration
- Remove this patch — it is harmless and prevents crashes for all users with browser translation enabled
- Add new shadcn portal components without `translate="no"` on Content/Trigger/Item
