'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent } from '@pg-prepaid/ui';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    setOrderId(orderIdParam);

    // Simulate verification delay
    // In production, you might want to poll an API endpoint to check transaction status
    setTimeout(() => {
      setStatus('success');
      setMessage('Your payment has been received! Your top-up will be processed shortly.');
    }, 2000);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {status === 'loading' && (
              <>
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                  <p className="text-muted-foreground">{message}</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h1>
                  <p className="text-muted-foreground">{message}</p>
                  {orderId && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Order ID: <span className="font-mono">{orderId}</span>
                    </p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                  <p className="text-green-800">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="list-disc list-inside text-green-700 mt-2 space-y-1 text-left">
                    <li>Payment verification is complete</li>
                    <li>Your top-up is being processed</li>
                    <li>You&apos;ll receive an email confirmation shortly</li>
                    <li>The top-up will be delivered within a few minutes</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/')}
                  >
                    Return Home
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push('/store/trellis')}
                  >
                    Send Another Top-up
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
                  <p className="text-muted-foreground">{message}</p>
                  {orderId && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Order ID: <span className="font-mono">{orderId}</span>
                    </p>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  Please contact support if you were charged but didn&apos;t receive your top-up.
                </div>

                <Button onClick={() => router.push('/store/trellis')} className="w-full">
                  Try Again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
