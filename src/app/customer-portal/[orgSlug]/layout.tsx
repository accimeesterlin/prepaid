"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function CustomerPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  const isAuthPage =
    pathname?.includes("/login") || pathname?.includes("/register");

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link
                  href={`/customer-portal/${orgSlug}`}
                  className="text-2xl font-bold text-purple-600"
                >
                  Customer Portal
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                {!isAuthPage && (
                  <button
                    onClick={async () => {
                      await fetch("/api/v1/customer-auth/logout", {
                        method: "POST",
                      });
                      router.push(`/customer-portal/${orgSlug}/login`);
                    }}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Prepaid Minutes. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
}
