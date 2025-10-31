# CLAUDE.md

KmCrLGmEfVJ6LcSgMMA2pS

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a prepaid minutes/mobile top-up platform built with Next.js 15 and MongoDB. The application allows organizations to manage prepaid mobile services, process transactions, and integrate with payment providers and mobile top-up services (like DingConnect).

## Development Commands

### Essential Commands

- `yarn dev` - Start the development server with Turbopack
- `yarn build` - Build the production application with Turbopack
- `yarn start` - Start the production server
- `yarn lint` - Run ESLint
- `yarn typecheck` - Run TypeScript type checking across all packages

### Package Manager

This project uses **Yarn 1.22.22**. Always use `yarn` commands, not `npm`.

## Architecture Overview

### Monorepo Structure

This is a Yarn workspaces monorepo with the following organization:

```
apps/
  web/          # Main Next.js application (currently at root level)
packages/
  db/           # Database models and connection (@pg-prepaid/db)
  types/        # Shared TypeScript types and enums (@pg-prepaid/types)
  ui/           # Shared UI components (@pg-prepaid/ui)
```

### TypeScript Path Aliases

Configured in root `tsconfig.json`:

- `@/*` - Root src directory
- `@pg-prepaid/db` - Database package
- `@pg-prepaid/types` - Types package
- `@pg-prepaid/ui` - UI components package

### Application Structure

**Next.js App Router** (located in `src/`):

- `src/app/` - App Router pages and layouts
  - `api/` - API routes with versioning (currently v1)
  - `dashboard/` - Dashboard pages
  - `login/`, `signup/` - Authentication pages
- `src/lib/` - Utility libraries
  - `auth.ts` - JWT token management using jose library
  - `auth-middleware.ts` - Authentication middleware for API routes
  - `api-error.ts`, `api-response.ts` - Standardized API patterns
  - `logger.ts` - Logging utilities
- `src/middleware.ts` - Next.js middleware for request handling, CORS, and request IDs
- `src/components/` - React components

### Database Package (`packages/db/`)

**Connection Management:**

- Uses singleton pattern (`DatabaseConnection` class)
- Mongoose with connection pooling (default: 10 max, 2 min)
- Environment variables: `MONGODB_URI` and `MONGODB_DB_NAME`

**Models:** (all exported from `packages/db/src/index.ts`)

- `User` - User authentication and roles
- `Org` - Organization/tenant data (legacy model)
- `Organization` - Extended organization model with settings and subscription
- `UserOrganization` - Junction table for multi-tenant support (users can belong to multiple orgs)
- `Customer` - Customer information
- `Product` - Product catalog with resale settings (discounts, country restrictions, pricing)
- `Transaction` - Transaction records for customer orders
- `Integration` - Third-party integrations (DingConnect, Reloadly)
- `Wallet` - Organization wallet for balance management
- `WalletTransaction` - Wallet transaction history (deposits, purchases, refunds)
- `PaymentProvider` - Payment provider configurations (Stripe, PayPal, PGPay)

### Types Package (`packages/types/`)

**Enums exported:**

- `UserRole` - admin, operator, viewer
- `TransactionStatus` - created, payment_pending, confirmed, failed, refunded, etc.
- `PaymentProvider` - stripe, paypal, pgpay
- `PaymentStatus` - pending, authorized, captured, failed, refunded
- `WebhookEventStatus` - pending, processing, processed, failed
- `AuditAction` - create, update, delete, login, topup_request, etc.

### API Structure

**Version:** v1 (located in `src/app/api/v1/`)

**Endpoints:**

**Authentication & Organizations:**
- `/api/v1/auth` - Authentication (login, signup, logout, me)
- `/api/v1/organizations` - List user's organizations (multi-tenant)
- `/api/v1/organizations/create` - Create a new organization
- `/api/v1/organizations/switch` - Switch active organization context
- `/api/v1/organizations/invite` - Invite users to an organization (admin only)
- `/api/v1/organizations/members` - List members of an organization
- `/api/v1/organization` - Organization settings

**Products & Catalog:**
- `/api/v1/products` - Product catalog management (CRUD)
- `/api/v1/products/[id]` - Get, update, delete specific product
- `/api/v1/products/sync` - Sync products from DingConnect or Reloadly

**Wallet & Payments:**
- `/api/v1/wallet` - Get wallet details, update settings
- `/api/v1/wallet/deposit` - Add funds to wallet
- `/api/v1/wallet/transactions` - Wallet transaction history

**Integrations:**
- `/api/v1/integrations` - Integration management (DingConnect, Reloadly)
- `/api/v1/integrations/test` - Test integration connection

**Customers & Transactions:**
- `/api/v1/customers` - Customer management
- `/api/v1/dashboard` - Dashboard metrics and analytics

**Health Checks:**
- `/api/health`, `/api/live`, `/api/ready` - Health check endpoints

**API Patterns:**

- All API routes return standardized responses using `api-response.ts`
- Errors use `ApiError` class with status codes
- Authentication via JWT stored in HttpOnly cookies
- Request IDs automatically added for tracing (via middleware)

### Authentication Flow

1. **Password hashing:** bcrypt with salt rounds = 10
2. **Token generation:** JWT using `jose` library (HS256 algorithm)
3. **Session storage:** HttpOnly cookies with 7-day expiration
4. **Token verification:** `verifyToken()` from `src/lib/auth.ts`
5. **Protected routes:** Use `auth-middleware.ts` in API route handlers

**Session Payload Structure:**

```typescript
{
  userId: string;
  email: string;
  roles: UserRole[];
  orgId: string;
}
```

## Environment Configuration

See `.env.example` for all required environment variables:

**Required:**

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name (default: pg-prepaid)
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `NODE_ENV` - development/production
- `ALLOWED_ORIGIN` - CORS origin

**Future Integration Variables** (commented in .env.example):

- DingConnect API credentials (Phase 2)
- Payment provider credentials: Stripe, PayPal, PGPay (Phase 3)

## Development Workflow

### Database Connection

Database connection must be established before accessing models. The singleton pattern ensures only one connection:

```typescript
import { dbConnection } from "@pg-prepaid/db";
await dbConnection.connect();
```

### Adding New API Routes

1. Create route handler in `src/app/api/v1/{endpoint}/route.ts`
2. Use `auth-middleware.ts` for protected routes
3. Return responses using `api-response.ts` helpers
4. Handle errors with `ApiError` class

### Adding New Models

1. Create model in `packages/db/src/models/`
2. Export from `packages/db/src/index.ts`
3. Define TypeScript interfaces
4. Use Mongoose schemas with timestamps

### Working with Types

Import shared types from `@pg-prepaid/types`:

```typescript
import { UserRole, TransactionStatus } from "@pg-prepaid/types";
```

## Code Quality

### Pre-commit Hooks

Husky is configured for git hooks (check `.husky/` directory)

### Linting & Type Checking

- Run `yarn lint` before committing
- Run `yarn typecheck` to catch TypeScript errors across all packages
- ESLint configured with Next.js rules

### User Notifications

**NEVER use `alert()`, `confirm()`, or `prompt()` - Use Toast Notifications Instead**

The application uses a custom toast notification system for all user feedback:

**Import:**
```typescript
import { toast } from '@pg-prepaid/ui';
```

**Usage:**
```typescript
// Success notification
toast({
  title: 'Success',
  description: 'Operation completed successfully!',
  variant: 'success',
});

// Error notification
toast({
  title: 'Error',
  description: 'Something went wrong. Please try again.',
  variant: 'error',
});

// Warning notification
toast({
  title: 'Warning',
  description: 'This action requires confirmation.',
  variant: 'warning',
});

// Default notification
toast({
  title: 'Info',
  description: 'Here is some information.',
  variant: 'default',
});

// Custom duration (default is 4000ms, 0 means no auto-dismiss)
toast({
  title: 'Persistent',
  description: 'This will stay until manually closed.',
  duration: 0,
});
```

**Toast Component Location:**
- Component: `packages/ui/src/components/toast.tsx`
- Hook: `packages/ui/src/hooks/use-toast.tsx`
- Provider: `src/components/toast-provider.tsx` (already added to root layout)

**Available Variants:**
- `success` - Green toast for successful operations
- `error` - Red toast for errors and failures
- `warning` - Yellow toast for warnings
- `default` - Default styling for general information

**Best Practices:**
- Always provide both `title` and `description` for clarity
- Use appropriate variants for different types of feedback
- Keep descriptions concise and actionable
- Toast notifications auto-dismiss after 4 seconds (customizable)
- Multiple toasts can be shown simultaneously (max 5)
- Toasts appear in the top-right corner of the screen

## Key Dependencies

- **Next.js 15.5.6** - App Router with Turbopack
- **React 19.1.0** - Latest React version
- **Mongoose 8.1.0** - MongoDB ODM
- **jose 5.2.0** - JWT implementation
- **bcryptjs 2.4.3** - Password hashing
- **Zod 3.22.4** - Schema validation
- **Tailwind CSS 4** - Styling
- **recharts** - Charts for dashboard
- **date-fns** - Date utilities
- **lucide-react** - Icons

## Multi-Tenant Architecture

This application supports true multi-tenancy where users can belong to multiple organizations:

### Data Model

- **UserOrganization** junction table links users to organizations with specific roles
- Users can have different roles in different organizations
- Session tokens include the active `orgId` for the current context
- All data queries should be scoped by `orgId` from the session

### Creating Organizations

1. **Create New Org:** `POST /api/v1/organizations/create` with `{ name, switchToNew? }`
2. **Automatic Setup:** Creator becomes admin and `UserOrganization` record is created
3. **Optional Switch:** `switchToNew` parameter (default: true) switches to the new org immediately
4. **UI:** "Create New Organization" button in the `OrganizationSwitcher` dropdown opens a dialog

### Organization Switching

1. **List Organizations:** `GET /api/v1/organizations` returns all orgs the user belongs to
2. **Switch Context:** `POST /api/v1/organizations/switch` with `{ orgId }` updates the session
3. **UI Component:** `OrganizationSwitcher` component in sidebar shows dropdown of all user's organizations
4. **Session Updates:** Switching orgs creates a new JWT with updated `orgId` and organization-specific `roles`

### Inviting Users

1. **Invite API:** `POST /api/v1/organizations/invite` with `{ email, roles, orgId? }`
2. **Admin Only:** Only users with admin role can invite others to the organization
3. **Existing Users:** Users must already have an account (signup first)
4. **Member Management:** View members at `/dashboard/settings/members` or `GET /api/v1/organizations/members`
5. **Reactivation:** Inviting an inactive member reactivates their membership

### Implementation Notes

- On signup, a `UserOrganization` record is automatically created
- The session payload includes `orgId` which must be used to scope all database queries
- Users can create unlimited organizations and belong to multiple organizations
- Users can invite existing users to their organizations (admin role required)
- The `isCurrent` flag in the organizations list indicates the active organization
- Switching organizations triggers a page refresh to reload data in the new context
- Creating an organization and switching to it happens atomically with a new session token

## Prepaid Minutes Resale Platform Architecture

### Overview

This platform enables organizations to:
1. **Fund their account** via wallet deposits
2. **Sync products** from DingConnect or Reloadly (mobile operators worldwide)
3. **Configure resale settings** with custom pricing, discounts, and country restrictions
4. **Integrate payment providers** (PGPay, PayPal, Stripe) for customer payments
5. **Sell prepaid minutes** through a customer-facing portal
6. **Process top-ups** automatically via DingConnect/Reloadly APIs

### Wallet System

**Purpose:** Organizations must fund their account before they can process customer top-ups.

**Models:**
- `Wallet` - Tracks organization balance, reserved balance, and available balance
- `WalletTransaction` - Audit trail of all wallet activities (deposits, purchases, refunds)

**Balance Types:**
- `balance` - Total funds in wallet
- `reservedBalance` - Amount reserved for pending transactions
- `availableBalance` - `balance - reservedBalance` (what can be spent)

**Wallet Methods:**
- `hasAvailableBalance(amount)` - Check if sufficient funds
- `reserve(amount)` - Reserve funds for a pending transaction
- `releaseReservation(amount)` - Release reserved funds
- `deduct(amount, reserved)` - Deduct from balance (optionally from reserved)
- `deposit(amount)` - Add funds to wallet

**API Endpoints:**
- `GET /api/v1/wallet` - Get wallet details
- `PATCH /api/v1/wallet` - Update wallet settings (low balance threshold, auto-reload)
- `POST /api/v1/wallet/deposit` - Add funds (manual for now, payment provider integration coming)
- `GET /api/v1/wallet/transactions` - Transaction history with pagination

### Product Catalog & Resale Settings

**Product Sync:**

Organizations can sync products from DingConnect or Reloadly using:
```
POST /api/v1/products/sync
{
  "provider": "dingconnect" | "reloadly",
  "filters": {
    "countryIso": "PG",  // Optional
    "providerCode": "DIGICEL_PNG"  // Optional
  }
}
```

The sync process:
1. Fetches products from provider API
2. Creates or updates products in local catalog
3. Sets default 10% markup on cost price
4. Enables auto-sync for future updates

**Resale Configuration:**

Each product has a `resaleSettings` object that controls:

1. **Country Restrictions:**
   - `allowedCountries` - ISO codes of countries where product can be sold (empty = all)
   - `blockedCountries` - ISO codes of countries to block

2. **Custom Pricing:**
   - `customPricing.enabled` - Enable country-specific pricing
   - `customPricing.priceByCountry` - Map of country code to custom price

3. **Discounts:**
   - `discount.enabled` - Enable discount
   - `discount.type` - 'percentage' or 'fixed'
   - `discount.value` - Discount amount
   - `discount.startDate` / `endDate` - Optional time bounds
   - `discount.minPurchaseAmount` - Minimum purchase to qualify

4. **Purchase Limits:**
   - `limits.minQuantity` - Minimum purchase quantity
   - `limits.maxQuantity` - Maximum purchase quantity
   - `limits.maxPerCustomer` - Maximum per customer per day

**Product Methods:**
- `getEffectivePrice(countryCode?)` - Calculate final price with discounts and country pricing
- `isAvailableInCountry(countryCode)` - Check if product can be sold in country
- `validateQuantity(quantity)` - Validate quantity against limits

### DingConnect Integration

**Service Location:** `src/lib/services/dingconnect.service.ts`

**Configuration:** Only requires API key (simplified setup)

**Available Methods:**
- `getBalance()` - Check account balance
- `getProducts(filters?)` - Fetch available products
- `getProviders(filters?)` - Fetch operators/providers
- `estimatePrices(params)` - Estimate transfer costs
- `sendTransfer(params)` - Execute top-up
- `validateTransfer(params)` - Validate before sending
- `testConnection()` - Test API credentials

**Product Sync Flow:**
1. Fetch products from DingConnect API
2. Fetch operators for additional metadata
3. Map DingConnect products to internal Product model
4. Set cost price from DingConnect, calculate sell price with markup
5. Track sync status and errors

### Payment Provider Integration

**Model:** `PaymentProvider`

**Supported Providers:**
- Stripe - Credit/debit cards
- PayPal - PayPal accounts
- PGPay - Papua New Guinea payment gateway

**Configuration:**
- Each provider requires specific credentials (API keys, secrets, etc.)
- Supports sandbox and production environments
- Can set currency restrictions, min/max amounts
- Optional platform fees (percentage + fixed)

**Settings:**
- `acceptedCurrencies` - Which currencies to accept
- `feePercentage` - Platform fee as percentage
- `fixedFee` - Fixed fee per transaction
- `autoCapture` - Automatically capture authorized payments

### Transaction Processing Flow

**Customer Purchase Flow:**

1. **Customer selects product** from customer-facing portal
2. **Country validation** - Check if product available in customer's country
3. **Price calculation** - `product.getEffectivePrice(countryCode)` with discounts
4. **Payment processing** - Customer pays via configured payment provider
5. **Wallet reservation** - Reserve cost price from organization wallet
6. **Top-up execution** - Call DingConnect/Reloadly API to deliver top-up
7. **Transaction completion:**
   - Deduct reserved amount from wallet
   - Update product sales metrics
   - Create transaction record
8. **Error handling:**
   - Release wallet reservation on failure
   - Initiate refund if payment captured
   - Log failure reason

**Transaction Status Flow:**
```
pending -> paid -> processing -> completed
                              -> failed -> refunded
```

### Integration Testing

**DingConnect Test:**
```
POST /api/v1/integrations/test
{
  "provider": "dingconnect",
  "credentials": { "apiKey": "your-key" }
}
```

Returns balance and currency if successful.

### Data Isolation & Security

**Multi-Tenant Scoping:**
- All database queries MUST include `orgId: session.orgId`
- Wallets are per-organization
- Products are per-organization (different orgs can have different pricing)
- Payment providers are per-organization

**Wallet Security:**
- Only active wallets can process transactions
- Balance reservation prevents double-spending
- Audit trail in `WalletTransaction` for all operations
- Low balance warnings configurable

## Notes

- This is a multi-tenant application with full support for users belonging to multiple organizations
- Organizations fund their wallet, sync products, and resell prepaid minutes with custom pricing
- DingConnect integration simplified to only require API key
- Product sync imports operator products and allows customization for resale
- Payment providers can be configured per organization for customer payments
- All API routes are versioned (currently v1) for future compatibility
- The middleware adds request IDs to all requests for tracing
- Always scope database queries by `orgId` from the session to ensure proper data isolation
