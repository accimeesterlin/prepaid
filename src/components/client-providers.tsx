"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PostHogProvider } from "@/components/posthog-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </PostHogProvider>
  );
}
