'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerPortalIndex({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const router = useRouter();

  useEffect(() => {
    params.then((p) => {
      // Check if user is authenticated, redirect to dashboard or login
      fetch('/api/v1/customer-auth/me', { credentials: 'include' })
        .then((res) => {
          if (res.ok) {
            router.push(`/customer-portal/${p.orgSlug}/dashboard`);
          } else {
            router.push(`/customer-portal/${p.orgSlug}/login`);
          }
        })
        .catch(() => {
          router.push(`/customer-portal/${p.orgSlug}/login`);
        });
    });
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
}
