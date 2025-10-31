import Link from 'next/link';
import { Button } from '@pg-prepaid/ui';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">PG Prepaid Minutes</h1>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Prepaid Minutes Platform for Your Business
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Sell prepaid minutes globally with DingConnect integration. Set your own pricing, manage multiple sellers, and track everything in real-time.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg">Start Selling Now</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Platform Features</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">🌍</div>
                <h4 className="text-xl font-semibold mb-2">Global Coverage</h4>
                <p className="text-muted-foreground">
                  Send prepaid top-ups to 150+ countries through DingConnect integration
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">💰</div>
                <h4 className="text-xl font-semibold mb-2">Flexible Pricing</h4>
                <p className="text-muted-foreground">
                  Set your own margins and pricing strategies. Support for Stripe, PayPal, and PGPay
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">👥</div>
                <h4 className="text-xl font-semibold mb-2">Multi-Tenant</h4>
                <p className="text-muted-foreground">
                  Manage multiple sellers under your organization with role-based access control
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-xl font-semibold mb-2">Real-Time Tracking</h4>
                <p className="text-muted-foreground">
                  Monitor all transactions, delivery status, and revenue in real-time
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-xl font-semibold mb-2">Secure & Compliant</h4>
                <p className="text-muted-foreground">
                  Enterprise-grade security with PII protection and audit logging
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="text-xl font-semibold mb-2">Instant Processing</h4>
                <p className="text-muted-foreground">
                  Fast top-up delivery with automatic reconciliation and retry logic
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PG Prepaid Minutes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
