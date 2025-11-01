'use client';

import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
