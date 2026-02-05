# PGPay Subscription Payment Integration

## Overview

The platform uses PGPay for processing all subscription upgrade payments. Since PGPay doesn't support automatic recurring subscriptions, users prepay for multiple months in advance (1, 3, 6, or 12 months). Users can pay using credit/debit cards, bank transfers, or mobile money through PGPay's secure checkout.

## Prepaid Model

### Available Options

- **1 Month** - Full price
- **3 Months** - 5% discount
- **6 Months** - 10% discount
- **12 Months** - 15% discount

### How It Works

1. User selects a tier and number of months to prepay
2. System calculates total amount with applicable discount
3. User completes one-time payment via PGPay
4. Subscription is activated for the full prepaid period
5. User must renew manually before expiration

## Environment Variables Required

```bash
PGPAY_USER_ID=your-pgpay-user-id-here
PGPAY_ENVIRONMENT=sandbox # or production
NEXT_PUBLIC_APP_URL=http://localhost:3001 # Your app URL
```

## How It Works

### 1. User Initiates Upgrade

- User selects tier to upgrade to
- User selects number of months to prepay (1, 3, 6, or 12)
- Frontend shows discounted price and total
- User clicks "Upgrade" button
- Frontend calls `POST /api/v1/subscriptions/upgrade` with tier and months

### 2. Payment Creation

- API calculates total amount:
  - Base: `monthlyFee × months`
  - Discount: 5% (3mo), 10% (6mo), 15% (12mo)
  - Final amount after discount
- API creates a PGPay payment request with:
  - Total amount for all months
  - Organization details
  - Success/error callback URLs
  - Webhook URL for async notification
  - Metadata including months and discount
- PGPay returns a checkout URL and token
- Organization stores pending upgrade with months info

### 3. User Completes Payment

- User is redirected to PGPay checkout
- User completes one-time payment for full period
- PGPay redirects back to success or cancel page

### 4. Webhook Processing

- PGPay sends webhook to `/api/v1/webhooks/pgpay/subscription`
- Webhook verifies payment with PGPay API
- If successful, updates organization:
  - Sets new subscriptionTier
  - Updates subscription dates (months × 30 days)
  - Stores prepaidMonths count
  - Clears pending upgrade
  - Records payment details with months

### 5. User Confirmation

- Success page shows confirmation
- User returns to dashboard with upgraded tier
- Subscription active for full prepaid peri,
  "months": 1 | 3 | 6 | 12
  }

````

**Response:**
```json
{
  "orderId": "sub-12345-growth-3m-1234567890",
  "token": "pgpay_token_123...",
  "redirectUrl": "https://checkout.pgecom.com/pay/...",
  "amount": 425.25,
  "monthlyFee": 149,
  "months": 3,
  "discount": 22.35th" | "scale" | "enterprise"
}
````

**Response:**

```json
{
  "orderId": "sub-12345-growth-1234567890",
  "token": "pgpay_token_123...",
  "redirectUrl": "https://checkout.pgecom.com/pay/...",
  "amount": 149,
  "tier": "Growth"
}
```

### POST `/api/v1/webhooks/pgpay/subscription`

Webhook handler for PGPay payment notifications.

**Request (from PGPay):**

```json
{
  "pgPayToken": "pgpay_token_123...",
  "orderId": "sub-12345-growth-1234567890",
  "status": "completed"
}
```

## Testing

### Sandbox Mode

1. Set `PGPAY_ENVIRONMENT=sandbox`
2. Use PGPay sandbox credentials
3. Test cards available in PGPay documentation

### Production Mode

1. Set `PGPAY_ENVIRONMENT=production`
2. Use production PGPAY_USER_ID
3. Real payments will be processed

## Security

- All payment processing happens on PGPay's secure platform
- No card details are stored on our servers
- Webhook requests are verified against PGPay API
- Pending upgrades expire after 30 minutes

## Troubleshooting

### Payment Not Completing

- Check webhook logs in server console
- Verify PGPAY_USER_ID is correct
- Ensure webhook URL is publicly accessible
- Check PGPay dashboard for payment status

### Webhook Not Received

- Verify `NEXT_PUBLIC_APP_URL` is correct and accessible
- Check PGPay webhook configuration
- Test webhook endpoint manually

### Subscription Not Upgrading

- Check server logs for webhook processing errors
- Verify payment status in PGPay dashboard
- Check organization's `subscription.pendingUpgrade` field
