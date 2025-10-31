# PG Prepaid Minutes Platform - Jira Tickets

## Project Overview
A B2B platform that allows sellers to sell prepaid mobile minutes to their customers with integrated payment processing and DingConnect API for telecom top-ups.

**Tech Stack:**
- Frontend: Next.js 15, React 19, TypeScript, shadcn/ui
- Backend: Next.js API Routes with versioning (/api/v1/)
- Database: MongoDB with Mongoose
- Payment Gateways: Stripe, PayPal, PGPay
- Telecom API: DingConnect

---

## EPIC 1: Foundation & Authentication ✅
**Status:** Completed
**Description:** Core authentication system and project setup

### PG-1: Project Setup and Infrastructure
**Type:** Task
**Priority:** Highest
**Story Points:** 5

**Description:**
Set up the monorepo structure with Next.js 15, TypeScript, and configure the development environment.

**Acceptance Criteria:**
- [x] Next.js 15 project initialized with TypeScript
- [x] Monorepo structure with packages (ui, db, types, config)
- [x] shadcn/ui components configured
- [x] MongoDB connection setup with Mongoose
- [x] Environment variables configuration
- [x] ESLint and Prettier configured

**Technical Notes:**
- Use yarn workspaces for monorepo
- Configure Tailwind CSS v4 with shadcn/ui theme

---

### PG-2: User Authentication System
**Type:** Story
**Priority:** Highest
**Story Points:** 8

**Description:**
Implement a secure JWT-based authentication system for sellers with signup, login, and session management.

**Acceptance Criteria:**
- [x] User model with Mongoose (email, password hash, roles, orgId)
- [x] POST /api/v1/auth/signup endpoint
- [x] POST /api/v1/auth/login endpoint
- [x] POST /api/v1/auth/logout endpoint
- [x] GET /api/v1/auth/me endpoint
- [x] JWT token generation and validation
- [x] Password hashing with bcrypt
- [x] HTTP-only cookie session management
- [x] Middleware for route protection

**Technical Notes:**
- Use jose library for JWT
- Store JWT in HTTP-only cookies
- Hash passwords with bcryptjs (12 rounds)

---

### PG-3: Authentication UI Pages
**Type:** Story
**Priority:** High
**Story Points:** 5

**Description:**
Create signup and login pages using shadcn/ui components.

**Acceptance Criteria:**
- [x] /signup page with form validation
- [x] /login page with form validation
- [x] /dashboard page (protected route)
- [x] Form validation with Zod
- [x] Error handling and user feedback
- [x] Responsive design
- [x] Loading states

**Design Notes:**
- Follow shadcn/ui design patterns
- Use Card, Button, Input components
- Clean, professional appearance

---

## EPIC 2: Product Catalog & DingConnect Integration
**Status:** Not Started
**Description:** Integration with DingConnect API and product catalog management

### PG-4: DingConnect API Integration - Authentication
**Type:** Task
**Priority:** High
**Story Points:** 5

**Description:**
Implement DingConnect API client with authentication and error handling.

**Acceptance Criteria:**
- [ ] DingConnect API client class/service
- [ ] API key authentication implementation
- [ ] Error handling and retry logic
- [ ] Rate limiting handling
- [ ] Request/response logging
- [ ] API health check endpoint
- [ ] Environment configuration for API credentials

**Technical Notes:**
- Base URL: https://api.dingconnect.com
- Store API key in environment variables
- Implement exponential backoff for retries
- Create DingConnect service in packages/api-clients

**API Documentation:**
- Review DingConnect API docs for authentication requirements
- Implement OAuth2 or API key based on their spec

---

### PG-5: Fetch and Store Operators from DingConnect
**Type:** Story
**Priority:** High
**Story Points:** 8

**Description:**
Fetch available mobile operators from DingConnect and store them in MongoDB for faster access.

**Acceptance Criteria:**
- [ ] Operator model in Mongoose (name, country, code, logo, regions, status)
- [ ] GET /api/v1/operators endpoint (list all operators with filtering)
- [ ] GET /api/v1/operators/:id endpoint (single operator details)
- [ ] POST /api/v1/admin/operators/sync endpoint (sync from DingConnect)
- [ ] Background job to sync operators daily
- [ ] Caching strategy for operator data
- [ ] Search and filter capabilities (by country, region, status)

**Technical Notes:**
- Store operator metadata: name, country code, currency, regions
- Include operator logo URLs
- Flag operators as active/inactive based on DingConnect availability
- Implement pagination for large lists

**DingConnect Integration:**
- Call DingConnect operators endpoint
- Map DingConnect data to internal schema
- Handle API pagination if applicable

---

### PG-6: Product Catalog - Create Products
**Type:** Story
**Priority:** High
**Story Points:** 8

**Description:**
Allow sellers to create products (prepaid minute packages) with pricing and DingConnect product mapping.

**Acceptance Criteria:**
- [ ] Product model (name, description, operatorId, dingConnectProductId, sellPrice, costPrice, currency, isActive)
- [ ] POST /api/v1/products endpoint (create product)
- [ ] GET /api/v1/products endpoint (list seller's products)
- [ ] GET /api/v1/products/:id endpoint (product details)
- [ ] PUT /api/v1/products/:id endpoint (update product)
- [ ] DELETE /api/v1/products/:id endpoint (soft delete)
- [ ] Validation for pricing (sellPrice >= costPrice)
- [ ] Organization-level product isolation

**Technical Notes:**
- Products belong to an organization
- Store both cost price (from DingConnect) and sell price (seller's markup)
- Calculate profit margin
- Support multiple currencies

**Business Rules:**
- Sellers can only manage their own products
- Sell price must be >= cost price
- Products must be linked to valid operators

---

### PG-7: Product Catalog - Admin UI
**Type:** Story
**Priority:** High
**Story Points:** 8

**Description:**
Create a professional product management interface for sellers to manage their catalog.

**Acceptance Criteria:**
- [ ] /dashboard/products page with data table
- [ ] /dashboard/products/new page (create product form)
- [ ] /dashboard/products/:id/edit page (edit product form)
- [ ] Product listing with search, filter, sort
- [ ] Operator selection dropdown (with country grouping)
- [ ] DingConnect product selection
- [ ] Price calculator (cost + markup = sell price)
- [ ] Bulk actions (activate/deactivate multiple)
- [ ] Product status toggle
- [ ] Delete confirmation dialog

**Design Requirements:**
- Use shadcn/ui DataTable component
- Use Form components with Zod validation
- Responsive design for mobile
- Loading skeletons
- Empty states with call-to-action

**User Experience:**
- Auto-calculate sell price from cost + margin %
- Show profit margin percentage
- Preview product before saving
- Inline editing for quick updates

---

### PG-8: Fetch DingConnect Product Pricing
**Type:** Story
**Priority:** High
**Story Points:** 5

**Description:**
Fetch real-time pricing for prepaid products from DingConnect and display to sellers.

**Acceptance Criteria:**
- [ ] GET /api/v1/dingconnect/products endpoint (fetch products by operator)
- [ ] Cache DingConnect pricing (TTL: 1 hour)
- [ ] Display wholesale prices to sellers
- [ ] Currency conversion if needed
- [ ] Price change notifications
- [ ] Historical pricing data (optional)

**Technical Notes:**
- Cache pricing in Redis or MongoDB with TTL
- Update cache on product sync
- Show sellers both current and historical costs

---

## EPIC 3: Payment Gateway Integrations
**Status:** Not Started
**Description:** Integrate multiple payment providers for customer transactions

### PG-9: Stripe Payment Integration
**Type:** Story
**Priority:** High
**Story Points:** 13

**Description:**
Integrate Stripe for credit/debit card payments with Stripe Checkout.

**Acceptance Criteria:**
- [ ] Stripe SDK integration
- [ ] POST /api/v1/payments/stripe/create-checkout endpoint
- [ ] POST /api/v1/payments/stripe/webhook endpoint (handle payment events)
- [ ] Payment model (amount, currency, status, gatewayId, customerId, orgId)
- [ ] Stripe customer creation
- [ ] Stripe checkout session creation
- [ ] Webhook signature verification
- [ ] Handle payment success/failure events
- [ ] Refund capability
- [ ] Payment status tracking

**Technical Notes:**
- Use Stripe Checkout for hosted payment page
- Store Stripe customer ID on user/customer model
- Implement webhook endpoint at /api/v1/payments/stripe/webhook
- Verify webhook signatures
- Handle these events: payment_intent.succeeded, payment_intent.failed, charge.refunded

**Environment Variables:**
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

**Security:**
- Never log full card details
- Use Stripe's PCI-compliant checkout
- Validate all webhook events

---

### PG-10: PayPal Payment Integration
**Type:** Story
**Priority:** High
**Story Points:** 13

**Description:**
Integrate PayPal for alternative payment method.

**Acceptance Criteria:**
- [ ] PayPal SDK integration (@paypal/checkout-server-sdk)
- [ ] POST /api/v1/payments/paypal/create-order endpoint
- [ ] POST /api/v1/payments/paypal/capture endpoint
- [ ] POST /api/v1/payments/paypal/webhook endpoint
- [ ] Sandbox and production mode support
- [ ] PayPal order creation
- [ ] Payment capture flow
- [ ] Webhook event handling
- [ ] Refund support

**Technical Notes:**
- Use PayPal Server SDK
- Support both sandbox and live modes
- Store PayPal order ID and payer ID
- Handle PAYMENT.CAPTURE.COMPLETED event

**Environment Variables:**
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- PAYPAL_MODE (sandbox/live)
- PAYPAL_WEBHOOK_ID

---

### PG-11: PGPay Integration (Papua Guinea Local Payment)
**Type:** Story
**Priority:** Medium
**Story Points:** 13

**Description:**
Integrate PGPay for local Papua Guinea payment processing.

**Acceptance Criteria:**
- [ ] PGPay API client implementation
- [ ] POST /api/v1/payments/pgpay/initiate endpoint
- [ ] POST /api/v1/payments/pgpay/webhook endpoint
- [ ] GET /api/v1/payments/pgpay/status/:transactionId endpoint
- [ ] Mobile money support
- [ ] Transaction status polling
- [ ] Webhook handling
- [ ] Error handling for local payment methods

**Technical Notes:**
- Research PGPay API documentation
- Support mobile money providers in PNG
- Implement transaction status checking
- Handle async payment confirmation

**Environment Variables:**
- PGPAY_API_KEY
- PGPAY_API_SECRET
- PGPAY_BASE_URL
- PGPAY_WEBHOOK_SECRET

---

### PG-12: Payment Gateway Selection UI
**Type:** Story
**Priority:** High
**Story Points:** 5

**Description:**
Create a checkout page allowing customers to select payment method.

**Acceptance Criteria:**
- [ ] /checkout page with payment method selection
- [ ] Display available payment methods (Stripe, PayPal, PGPay)
- [ ] Payment method icons and descriptions
- [ ] Redirect to appropriate payment flow
- [ ] Order summary display
- [ ] Loading states during payment processing
- [ ] Success/failure pages
- [ ] Payment receipt display

**Design Requirements:**
- Clean checkout flow
- Clear pricing breakdown
- Trust indicators (SSL, secure payment badges)
- Mobile-responsive
- Progress indicator

---

### PG-13: Payment Settings for Sellers
**Type:** Story
**Priority:** Medium
**Story Points:** 8

**Description:**
Allow sellers to configure which payment gateways they want to accept and enter their credentials.

**Acceptance Criteria:**
- [ ] PaymentSettings model (orgId, stripe{enabled, publicKey, secretKey}, paypal{enabled, clientId, secret}, pgpay{enabled, apiKey, secret})
- [ ] GET /api/v1/settings/payment endpoint
- [ ] PUT /api/v1/settings/payment endpoint
- [ ] /dashboard/settings/payment page
- [ ] Toggle for each payment gateway
- [ ] Secure credential storage (encrypted)
- [ ] Test mode vs production mode toggle
- [ ] Connection test for each gateway
- [ ] Webhook URL display

**Security:**
- Encrypt payment gateway credentials
- Never expose credentials in API responses
- Validate credentials before saving
- Audit log for credential changes

**Design:**
- Card-based layout for each gateway
- Toggle switches for enable/disable
- Masked credential inputs
- Test connection button

---

## EPIC 4: Transaction & Top-Up Management
**Status:** Not Started
**Description:** Core transaction flow from payment to DingConnect top-up

### PG-14: Customer Management
**Type:** Story
**Priority:** High
**Story Points:** 5

**Description:**
Create customer records for tracking purchases and phone numbers.

**Acceptance Criteria:**
- [ ] Customer model (orgId, phoneNumber, email, name, country, totalPurchases, metadata)
- [ ] POST /api/v1/customers endpoint (create customer)
- [ ] GET /api/v1/customers endpoint (list customers)
- [ ] GET /api/v1/customers/:id endpoint (customer details)
- [ ] PUT /api/v1/customers/:id endpoint (update customer)
- [ ] Customer search by phone/email
- [ ] Customer purchase history
- [ ] Organization-level customer isolation

**Technical Notes:**
- Store phone numbers in E.164 format
- Index on phoneNumber and email
- Track total purchase amount
- Store customer metadata (acquisition source, etc.)

---

### PG-15: Top-Up Transaction Flow
**Type:** Story
**Priority:** Highest
**Story Points:** 13

**Description:**
Implement the core transaction flow: Payment → Create Transaction → DingConnect Top-Up → Update Status.

**Acceptance Criteria:**
- [ ] Transaction model (orderId, orgId, customerId, productId, amount, status, paymentGateway, paymentId, dingConnectTransactionId, phoneNumber, operator, timestamps)
- [ ] POST /api/v1/transactions/create endpoint
- [ ] Transaction state machine (pending → processing → completed/failed)
- [ ] Integration with DingConnect send API
- [ ] Automatic retry logic for failed top-ups
- [ ] Transaction status webhooks
- [ ] Idempotency for duplicate requests
- [ ] Error logging and alerting

**Transaction States:**
1. `pending` - Payment initiated
2. `paid` - Payment confirmed
3. `processing` - Sending to DingConnect
4. `completed` - Top-up successful
5. `failed` - Top-up failed
6. `refunded` - Payment refunded

**Flow:**
1. Customer initiates purchase
2. Payment processed via gateway
3. On payment success → Create transaction record
4. Call DingConnect API to send top-up
5. Poll DingConnect for confirmation
6. Update transaction status
7. Send confirmation to customer

**Technical Notes:**
- Use database transactions for atomicity
- Implement idempotency keys
- Queue-based processing for reliability
- Retry failed top-ups with exponential backoff
- Log all DingConnect API calls

**Error Handling:**
- If DingConnect fails → Mark transaction for retry
- If payment succeeded but top-up fails → Automatic refund
- Alert admin for stuck transactions

---

### PG-16: Transaction History & Reporting
**Type:** Story
**Priority:** High
**Story Points:** 8

**Description:**
Create a comprehensive transaction dashboard with filtering, search, and export capabilities.

**Acceptance Criteria:**
- [ ] GET /api/v1/transactions endpoint (list with filters)
- [ ] GET /api/v1/transactions/:id endpoint (transaction details)
- [ ] /dashboard/transactions page
- [ ] Filter by date range, status, payment method, customer
- [ ] Search by order ID, phone number, customer name
- [ ] Export to CSV/Excel
- [ ] Transaction details modal
- [ ] Retry failed transaction action
- [ ] Refund transaction action
- [ ] Real-time status updates

**Design Requirements:**
- DataTable with sorting and pagination
- Status badges with color coding
- Date range picker
- Export button
- Transaction timeline view
- Filter chips

**Metrics to Display:**
- Total transactions
- Success rate
- Total revenue
- Failed transactions count
- Average transaction value

---

### PG-17: Transaction Notifications
**Type:** Story
**Priority:** Medium
**Story Points:** 5

**Description:**
Send email/SMS notifications for transaction status changes.

**Acceptance Criteria:**
- [ ] Email notification on successful top-up
- [ ] Email notification on failed top-up
- [ ] SMS notification option
- [ ] Transaction receipt email template
- [ ] Notification preferences per seller
- [ ] Webhook notifications for external systems

**Technical Notes:**
- Use email service (SendGrid, AWS SES, or Resend)
- Use SMS service (Twilio or similar)
- Queue-based notification system
- Template engine for emails
- Support multiple languages

---

## EPIC 5: Analytics & Reporting
**Status:** Not Started
**Description:** Business intelligence and reporting features

### PG-18: Dashboard Analytics
**Type:** Story
**Priority:** High
**Story Points:** 13

**Description:**
Create a comprehensive analytics dashboard for sellers to monitor their business.

**Acceptance Criteria:**
- [ ] /dashboard page redesign with analytics
- [ ] Revenue metrics (today, week, month, all-time)
- [ ] Transaction volume charts
- [ ] Success rate KPIs
- [ ] Top-performing products
- [ ] Customer growth chart
- [ ] Payment method breakdown
- [ ] Operator performance comparison
- [ ] Real-time updates
- [ ] Date range selector
- [ ] Export reports

**Metrics:**
- Total revenue (with trend)
- Transaction count (with trend)
- Success rate percentage
- Average order value
- Customer count
- Failed transaction analysis
- Revenue by operator
- Revenue by payment method
- Hourly/daily/monthly trends

**Design:**
- Card-based KPI layout
- Line/bar charts with recharts
- Responsive grid layout
- Loading states
- Empty states for new sellers

**Technical:**
- Aggregate queries in MongoDB
- Cache dashboard data (5-minute TTL)
- Use Chart.js or Recharts for visualizations

---

### PG-19: Financial Reports
**Type:** Story
**Priority:** Medium
**Story Points:** 8

**Description:**
Generate detailed financial reports for accounting and reconciliation.

**Acceptance Criteria:**
- [ ] GET /api/v1/reports/revenue endpoint
- [ ] GET /api/v1/reports/payouts endpoint
- [ ] /dashboard/reports page
- [ ] Revenue report (by date range)
- [ ] Profit/loss statement
- [ ] Transaction reconciliation report
- [ ] Tax report data
- [ ] Payment gateway fees breakdown
- [ ] Export to PDF and Excel
- [ ] Schedule automatic reports

**Report Types:**
- Daily sales summary
- Monthly revenue report
- Operator-wise breakdown
- Payment gateway reconciliation
- Profit margin analysis

---

### PG-20: Customer Analytics
**Type:** Story
**Priority:** Low
**Story Points:** 5

**Description:**
Provide insights into customer behavior and segmentation.

**Acceptance Criteria:**
- [ ] Customer lifetime value (LTV)
- [ ] Repeat purchase rate
- [ ] Customer segmentation (new, active, churned)
- [ ] Popular products per customer segment
- [ ] Customer acquisition source tracking
- [ ] Churn analysis

---

## EPIC 6: Organization & User Management
**Status:** Not Started
**Description:** Multi-user support and organization settings

### PG-21: Organization Settings
**Type:** Story
**Priority:** Medium
**Story Points:** 8

**Description:**
Allow sellers to manage their organization profile and settings.

**Acceptance Criteria:**
- [ ] Organization model (name, logo, email, phone, address, website, settings)
- [ ] GET /api/v1/organization endpoint
- [ ] PUT /api/v1/organization endpoint
- [ ] /dashboard/settings/organization page
- [ ] Upload organization logo
- [ ] Business information form
- [ ] Branding settings (colors, logo)
- [ ] Notification preferences
- [ ] Time zone settings
- [ ] Currency settings

**Design:**
- Tabbed settings interface
- Image upload with preview
- Color pickers for branding
- Save indicator

---

### PG-22: Team Management & Roles
**Type:** Story
**Priority:** Low
**Story Points:** 13

**Description:**
Support multiple users per organization with role-based access control.

**Acceptance Criteria:**
- [ ] Role model (admin, manager, operator, viewer)
- [ ] POST /api/v1/organization/users/invite endpoint
- [ ] GET /api/v1/organization/users endpoint
- [ ] PUT /api/v1/organization/users/:id/role endpoint
- [ ] DELETE /api/v1/organization/users/:id endpoint
- [ ] /dashboard/team page
- [ ] Invite team members via email
- [ ] Role assignment
- [ ] Permission matrix
- [ ] Activity log per user

**Roles:**
- **Admin:** Full access
- **Manager:** All except organization settings
- **Operator:** View and process transactions
- **Viewer:** Read-only access

---

### PG-23: API Keys for External Integration
**Type:** Story
**Priority:** Medium
**Story Points:** 8

**Description:**
Allow sellers to generate API keys for integrating with their own systems.

**Acceptance Criteria:**
- [ ] ApiKey model (orgId, name, key, hashedKey, permissions, lastUsedAt)
- [ ] POST /api/v1/api-keys endpoint (create key)
- [ ] GET /api/v1/api-keys endpoint (list keys)
- [ ] DELETE /api/v1/api-keys/:id endpoint (revoke key)
- [ ] /dashboard/developers page
- [ ] API key generation
- [ ] API key permissions (read-only, write)
- [ ] API documentation page
- [ ] Usage logs per API key
- [ ] Rate limiting per key

**Security:**
- Hash API keys (like passwords)
- Show full key only once on creation
- Rate limit API requests
- Audit log for API usage

---

## EPIC 7: System Administration
**Status:** Not Started
**Description:** Admin tools for platform management

### PG-24: Super Admin Dashboard
**Type:** Story
**Priority:** Medium
**Story Points:** 13

**Description:**
Create a super admin interface for platform management.

**Acceptance Criteria:**
- [ ] /admin route protection
- [ ] /admin/dashboard with platform metrics
- [ ] Organization management
- [ ] User management across orgs
- [ ] System health monitoring
- [ ] DingConnect sync status
- [ ] Failed transaction queue
- [ ] Activity logs
- [ ] Platform-wide analytics

**Metrics:**
- Total organizations
- Total users
- Total transactions
- Platform revenue
- System errors
- API health status

---

### PG-25: Audit Logging
**Type:** Task
**Priority:** Medium
**Story Points:** 5

**Description:**
Implement comprehensive audit logging for security and compliance.

**Acceptance Criteria:**
- [ ] AuditLog model (userId, orgId, action, resource, details, ipAddress, userAgent, timestamp)
- [ ] Log all sensitive actions (login, payment settings change, etc.)
- [ ] GET /api/v1/audit-logs endpoint
- [ ] /dashboard/audit-logs page
- [ ] Search and filter logs
- [ ] Export logs
- [ ] Retention policy (90 days)

**Actions to Log:**
- User login/logout
- Password changes
- Payment settings updates
- Product changes
- Transaction refunds
- Team member changes
- API key creation/deletion

---

### PG-26: System Notifications & Alerts
**Type:** Story
**Priority:** Medium
**Story Points:** 5

**Description:**
Alert system for critical events and errors.

**Acceptance Criteria:**
- [ ] Email alerts for failed transactions
- [ ] Slack/Discord webhook integration
- [ ] DingConnect API downtime alerts
- [ ] Payment gateway errors
- [ ] Low balance warnings
- [ ] Unusual activity detection
- [ ] Custom alert rules

---

## EPIC 8: Customer-Facing Features
**Status:** Not Started
**Description:** Features for end customers purchasing top-ups

### PG-27: Public Top-Up Widget
**Type:** Story
**Priority:** Medium
**Story Points:** 13

**Description:**
Create an embeddable widget that sellers can add to their websites for customers to purchase top-ups.

**Acceptance Criteria:**
- [ ] Embeddable JavaScript widget
- [ ] Customizable branding (colors, logo)
- [ ] Operator selection
- [ ] Product selection
- [ ] Phone number validation
- [ ] Payment flow
- [ ] Success/error handling
- [ ] Mobile responsive
- [ ] Documentation for integration

**Technical:**
- Vanilla JavaScript (no framework dependency)
- iframe-based or shadow DOM
- Customizable via data attributes
- Hosted on CDN

---

### PG-28: Customer Portal
**Type:** Story
**Priority:** Low
**Story Points:** 13

**Description:**
A portal where customers can view their purchase history and receipts.

**Acceptance Criteria:**
- [ ] /portal/:orgSlug route
- [ ] Customer login (email + SMS OTP)
- [ ] Purchase history
- [ ] Download receipts
- [ ] Reorder previous top-ups
- [ ] Save favorite phone numbers
- [ ] Transaction status tracking

---

## EPIC 9: DevOps & Production Readiness
**Status:** Not Started
**Description:** Deployment, monitoring, and production infrastructure

### PG-29: Error Tracking & Monitoring
**Type:** Task
**Priority:** High
**Story Points:** 5

**Description:**
Implement error tracking and application monitoring.

**Acceptance Criteria:**
- [ ] Sentry integration for error tracking
- [ ] Application performance monitoring
- [ ] API endpoint monitoring
- [ ] Uptime monitoring
- [ ] Error alerting
- [ ] Source map upload for better stack traces

**Tools:**
- Sentry for error tracking
- DataDog or New Relic for APM
- UptimeRobot for uptime monitoring

---

### PG-30: CI/CD Pipeline
**Type:** Task
**Priority:** High
**Story Points:** 8

**Description:**
Set up automated testing and deployment pipeline.

**Acceptance Criteria:**
- [ ] GitHub Actions workflow
- [ ] Automated tests on PR
- [ ] TypeScript type checking
- [ ] Linting
- [ ] Build verification
- [ ] Automated deployment to staging
- [ ] Production deployment workflow
- [ ] Database migration runner

**Environments:**
- Development (local)
- Staging
- Production

---

### PG-31: Database Backups & Disaster Recovery
**Type:** Task
**Priority:** High
**Story Points:** 5

**Description:**
Implement database backup strategy and disaster recovery plan.

**Acceptance Criteria:**
- [ ] Automated daily backups
- [ ] Point-in-time recovery capability
- [ ] Backup retention policy (30 days)
- [ ] Backup testing procedure
- [ ] Disaster recovery documentation
- [ ] Backup monitoring and alerts

---

### PG-32: Security Hardening
**Type:** Task
**Priority:** High
**Story Points:** 8

**Description:**
Implement security best practices for production.

**Acceptance Criteria:**
- [ ] Rate limiting on all APIs
- [ ] DDoS protection
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Security headers (helmet.js)
- [ ] Input validation on all endpoints
- [ ] Secrets management (AWS Secrets Manager or similar)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

---

### PG-33: Performance Optimization
**Type:** Task
**Priority:** Medium
**Story Points:** 5

**Description:**
Optimize application performance for production scale.

**Acceptance Criteria:**
- [ ] Database query optimization
- [ ] Index optimization
- [ ] Caching strategy (Redis)
- [ ] API response time monitoring
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] CDN for static assets

---

## EPIC 10: Nice-to-Have Features
**Status:** Backlog
**Description:** Future enhancements

### PG-34: Referral Program
**Type:** Feature
**Priority:** Low
**Story Points:** 13

**Description:**
Allow sellers to refer other sellers and earn commissions.

---

### PG-35: Promotional Codes & Discounts
**Type:** Feature
**Priority:** Low
**Story Points:** 8

**Description:**
Support discount codes and promotional campaigns.

---

### PG-36: Subscription Plans
**Type:** Feature
**Priority:** Low
**Story Points:** 13

**Description:**
Recurring top-ups for customers.

---

### PG-37: Multi-Language Support
**Type:** Feature
**Priority:** Low
**Story Points:** 8

**Description:**
Internationalization (i18n) support.

---

### PG-38: Mobile App
**Type:** Feature
**Priority:** Low
**Story Points:** 21

**Description:**
Native mobile app for sellers (React Native or Flutter).

---

## Summary

### Phase 1: MVP (8-10 weeks)
- Authentication ✅
- Product Catalog (PG-4 to PG-8)
- Payment Integration - Stripe (PG-9, PG-12)
- Transaction Flow (PG-14 to PG-16)
- Basic Dashboard (PG-18)

### Phase 2: Full Payment Support (4-6 weeks)
- PayPal Integration (PG-10)
- PGPay Integration (PG-11)
- Payment Settings (PG-13)
- Transaction Notifications (PG-17)

### Phase 3: Advanced Features (6-8 weeks)
- Financial Reports (PG-19)
- Organization Settings (PG-21)
- API Keys (PG-23)
- Admin Dashboard (PG-24)
- Audit Logging (PG-25)

### Phase 4: Customer Features (4-6 weeks)
- Public Widget (PG-27)
- Customer Portal (PG-28)
- Customer Analytics (PG-20)

### Phase 5: Production Launch (2-3 weeks)
- DevOps (PG-29 to PG-33)
- Security hardening
- Performance optimization
- Go-live preparation

---

## Story Point Guide
- **1-2:** Trivial task (< 4 hours)
- **3-5:** Simple task (1-2 days)
- **8:** Medium complexity (3-4 days)
- **13:** Complex task (1 week)
- **21:** Very complex (2 weeks)

## Priority Levels
- **Highest:** Must have for MVP
- **High:** Important for launch
- **Medium:** Should have post-launch
- **Low:** Nice to have

---

**Total Estimated Story Points:** ~350-400
**Estimated Timeline:** 6-9 months for full platform
**MVP Timeline:** 8-10 weeks
