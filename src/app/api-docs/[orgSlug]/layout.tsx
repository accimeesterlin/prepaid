"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ApiDocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link
                  href={`/api-docs/${orgSlug}`}
                  className="text-2xl font-bold text-indigo-600"
                >
                  API Documentation
                </Link>
                <nav className="hidden md:flex space-x-4">
                  <Link
                    href={`/api-docs/${orgSlug}#getting-started`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Getting Started
                  </Link>
                  <Link
                    href={`/api-docs/${orgSlug}#authentication`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Authentication
                  </Link>
                  <Link
                    href={`/api-docs/${orgSlug}#endpoints`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Endpoints
                  </Link>
                  <Link
                    href={`/api-docs/${orgSlug}#webhooks`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Webhooks
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Prepaid Minutes API. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
}
