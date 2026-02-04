# Pricing Tier Implementation - Complete

## Implementation Summary

The full pricing tier system has been implemented across the entire application. Users can now view pricing plans, track usage, and manage their subscriptions.

---

## Files Created

### Core Configuration

- ✅ `src/lib/pricing.ts` - Core pricing configuration with 4 tiers, feature gates, and utility functions

### Database Models

- ✅ `packages/db/src/models/Subscription.ts` - Subscription tracking model
- ✅ `packages/db/src/models/Invoice.ts` - Invoice and billing model
- ✅ `packages/db/src/models/Organization.ts` - **UPDATED** with subscription tier fields

### Database Exports

- ✅ `packages/db/src/index.ts` - **UPDATED** to export Subscription and Invoice models

### Frontend Pages

- ✅ `src/app/pricing/page.tsx` - Public pricing page with tier comparison
- ✅ `src/app/dashboard/billing/page.tsx` - Billing dashboard with usage metrics

### Components

- ✅ `src/components/UpgradePrompt.tsx` - Reusable upgrade prompt component
- ✅ `src/components/ui/progress.tsx` - Progress bar UI component
- ✅ `src/components/ui/skeleton.tsx` - Loading skeleton UI component
- ✅ `src/components/ui/alert.tsx` - Alert UI component

### API Endpoints

- ✅ `src/app/api/v1/subscriptions/current/route.ts` - Get current subscription details
- ✅ `src/app/api/v1/subscriptions/usage/route.ts` - Get usage metrics vs limits

---

## Pricing Tiers Implemented

### 🚀 Starter - "Launch" Plan

- **Monthly Fee:** $0
- **Transaction Fee:** 4.0%
- **Limits:** 200 transactions/month, 1 organization, 1 team member
- **Features:** Basic storefront, customer portal, basic analytics

### 📈 Growth - "Business" Plan

- **Monthly Fee:** $149
- **Transaction Fee:** 2.0%
- **Limits:** 3,000 transactions/month, 3 organizations, 5 team members
- **Features:** Partial white-label, API access, webhooks, Zapier, RBAC

### 🎯 Scale - "White Label Pro" Plan

- **Monthly Fee:** $499
- **Transaction Fee:** 1.0%
- **Limits:** Unlimited
- **Features:** Full white-label, custom domain, priority processing, audit logs

### 🏢 Enterprise - "Infrastructure Partner" Plan

- **Monthly Fee:** $1,000+ (custom)
- **Transaction Fee:** 0.5%
- **Limits:** Unlimited
- **Features:** Dedicated infrastructure, SLA contracts, dedicated support

---

## Key Features Implemented

### ✅ Pricing Configuration (`src/lib/pricing.ts`)

```typescript
- SubscriptionTier enum (starter, growth, scale, enterprise)
- TIER_FEATURES object with complete feature matrix
- TIER_INFO object with marketing copy
- getTierInfo() - Get tier details
- canAccessFeature() - Check feature access
- checkLimit() - Check usage limits
- calculateTransactionFee() - Calculate fees
- getNextTier() - Get upgrade path
- isApproachingLimit() - Check 80% threshold
- getAllTiers() - Get all tiers in order
```

### ✅ Database Models

#### Subscription Model

- organizationId, tier, status
- Billing: monthlyFee, transactionFeePercentage
- Stripe integration fields
- Usage tracking for current period
- Tier change history
- Trial and cancellation support

#### Invoice Model

- invoiceNumber (auto-generated)
- Line items array
- Payment tracking
- Stripe integration
- Auto-calculate totals

#### Organization Model (Updated)

- subscriptionTier field
- transactionFeePercentage field
- limits object (organizations, teamMembers, transactionsPerMonth)
- usage object (current usage tracking)
- features object (feature flags)

### ✅ Public Pricing Page (`/pricing`)

- Hero section with billing toggle (monthly/annual)
- 4 pricing tier cards with highlights
- "Most Popular" badge on Growth plan
- Feature comparison table
- FAQ section
- CTA section

### ✅ Billing Dashboard (`/dashboard/billing`)

- Current plan overview
- Usage metrics with progress bars
- Transaction, team member, and organization counters
- Approaching limit warnings (80% threshold)
- Upgrade prompts
- Feature list
- Payment method management
- Billing history

### ✅ Upgrade Prompts Component

- Generic UpgradePrompt with customizable messaging
- TransactionLimitPrompt - When approaching transaction limit
- TeamMemberLimitPrompt - When at team member limit
- FeatureLockedPrompt - For locked features
- WhiteLabelPrompt - For white-label upgrade
- APIAccessPrompt - For API access upgrade

### ✅ API Endpoints

#### GET `/api/v1/subscriptions/current`

Returns:

- Current tier and tier name
- Subscription status
- Monthly fee and transaction fee %
- Billing period dates
- Usage metrics (transactions, team members, organizations)
- Remaining limits
- All features available to tier

#### GET `/api/v1/subscriptions/usage`

Returns:

- Current billing period
- Transaction usage vs limit (with percentage)
- Team member usage vs limit
- Organization usage vs limit
- "Approaching limit" flags (80% threshold)
- Warnings array
- shouldUpgrade recommendation

---

## Usage Examples

### Check Feature Access

```typescript
import { canAccessFeature, SubscriptionTier } from '@/lib/pricing';

const tier = organization.subscriptionTier as SubscriptionTier;

if (!canAccessFeature(tier, 'apiAccess')) {
  return <FeatureLockedPrompt
    currentTier={tier}
    featureName="API Access"
    targetTier={SubscriptionTier.GROWTH}
  />;
}
```

### Check Limits Before Action

```typescript
import { checkLimit } from '@/lib/pricing';

const limit = checkLimit(tier, 'maxTeamMembers', currentTeamCount);

if (!limit.allowed) {
  return <TeamMemberLimitPrompt
    currentTier={tier}
    currentCount={currentTeamCount}
    limit={limit.limit as number}
  />;
}

// Proceed with adding team member
```

### Calculate Transaction Fees

```typescript
import { calculateTransactionFee } from "@/lib/pricing";

const amount = 100; // $100 transaction
const fee = calculateTransactionFee(tier, amount);

console.log(`Transaction: $${amount}, Fee: $${fee.toFixed(2)}`);
```

### Show Upgrade Prompt

```typescript
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { getNextTier } from '@/lib/pricing';

const nextTier = getNextTier(currentTier);

if (nextTier && isApproachingLimit) {
  return (
    <UpgradePrompt
      currentTier={currentTier}
      targetTier={nextTier}
      reason="You're approaching your monthly limit"
      featureBlocked="Transaction processing"
    />
  );
}
```

---

## Next Steps

### 🔄 Immediate (Already Implemented)

- ✅ Core pricing configuration
- ✅ Database models
- ✅ Public pricing page
- ✅ Billing dashboard
- ✅ API endpoints
- ✅ Upgrade prompts

### 📋 Recommended Next Steps

1. **Feature Gating Middleware**
   - Create middleware to check `canAccessFeature()` before API access
   - Add limit checks to transaction processing
   - Add limit checks to team member invitations
   - Add limit checks to organization creation

2. **Transaction Fee Calculation**
   - Import `calculateTransactionFee()` in transaction processing
   - Add fee to Transaction model
   - Display fees in transaction UI
   - Include fees in monthly invoices

3. **Stripe Integration**

   ```bash
   npm install stripe @stripe/stripe-js
   ```

   - Create Stripe customer on signup
   - Create Stripe subscription on upgrade
   - Handle webhooks for payment events
   - Sync subscription status

4. **Usage Tracking**
   - Call usage API endpoint on dashboard load
   - Show real-time usage metrics
   - Send email notifications at 80% and 100%
   - Auto-upgrade flow

5. **Testing**
   - Test tier upgrades/downgrades
   - Test limit enforcement
   - Test fee calculations
   - Test upgrade prompts
   - Test billing calculations

6. **Migration Script**
   ```bash
   # Create script to migrate existing organizations to new schema
   node scripts/migrate-to-pricing-tiers.js
   ```

   - Set default tier (Starter)
   - Initialize usage counters
   - Set transaction fee percentages
   - Copy features from old subscription model

---

## Testing the Implementation

### 1. View Pricing Page

```bash
# Start dev server
npm run dev

# Open browser to:
http://localhost:3000/pricing
```

### 2. View Billing Dashboard

```bash
# Login and navigate to:
http://localhost:3000/dashboard/billing
```

### 3. Test API Endpoints

```bash
# Get current subscription
curl -X GET http://localhost:3000/api/v1/subscriptions/current \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Get usage metrics
curl -X GET http://localhost:3000/api/v1/subscriptions/usage \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

### 4. Test Feature Gates

```typescript
// Add to any protected feature
import { canAccessFeature } from '@/lib/pricing';

if (!canAccessFeature(organization.subscriptionTier, 'webhooks')) {
  return <FeatureLockedPrompt
    currentTier={organization.subscriptionTier}
    featureName="Webhooks"
  />;
}
```

---

## Migration Guide

### For Existing Organizations

All existing organizations will default to **Starter** tier with:

- 200 transactions/month limit
- 4% transaction fee
- Grace period: 30 days to upgrade if over limits

### Rollout Phases

1. **Phase 1: Soft Launch** ✅ COMPLETE
   - Database models created
   - Pricing configuration added
   - UI pages built
   - API endpoints ready

2. **Phase 2: Feature Gates** (Next)
   - Add middleware checks
   - Show upgrade prompts
   - Enforce soft limits with warnings

3. **Phase 3: Stripe Integration**
   - Connect Stripe
   - Enable payments
   - Handle subscriptions

4. **Phase 4: Hard Limits**
   - Enforce transaction limits
   - Block actions when over limit
   - Require upgrade to continue

5. **Phase 5: Public Launch**
   - Announce pricing publicly
   - Marketing campaign
   - Customer migration complete

---

## Architecture Decisions

1. **Tiered Pricing Model**: Freemium + usage-based hybrid
   - Free tier for acquisition
   - Paid tiers for conversion
   - Enterprise for high-value customers

2. **Feature Gates**: Boolean and partial flags
   - `false` = Not available
   - `true` = Fully available
   - `"partial"` or `"limited"` = Basic version available

3. **Usage Tracking**: Real-time counters
   - Monthly transaction count
   - Team member count
   - Organization count
   - Cached in Organization model
   - Recalculated on API calls

4. **Limit Enforcement**: Progressive warnings
   - 80% = Warning notification
   - 100% = Require upgrade
   - Grace period for existing users

---

## Documentation

All pricing documentation is in `AGENTS.md` for AI agents to reference when:

- Implementing new features
- Adding feature gates
- Calculating fees
- Showing upgrade prompts
- Enforcing limits

---

## Support

For questions or issues:

1. Check `AGENTS.md` for pricing specifications
2. Review this implementation guide
3. Test using the API endpoints
4. Check console logs for errors

---

**Implementation Status:** ✅ COMPLETE (Phase 1)

**Next Phase:** Feature Gates & Stripe Integration
