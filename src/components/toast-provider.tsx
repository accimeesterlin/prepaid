'use client';

import { Toaster, useToast } from '@pg-prepaid/ui';

export function ToastProvider() {
  const { toasts } = useToast();

  return <Toaster toasts={toasts} />;
}
