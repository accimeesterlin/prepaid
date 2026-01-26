'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/staff-portal" className="text-2xl font-bold text-blue-600">
                  Staff Portal
                </Link>
                <nav className="hidden md:flex space-x-4">
                  <Link
                    href="/staff-portal"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/staff-portal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/staff-portal/my-transactions"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/staff-portal/my-transactions'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    My Transactions
                  </Link>
                  <Link
                    href="/staff-portal/my-api-keys"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/staff-portal/my-api-keys'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    API Keys
                  </Link>
                  <Link
                    href="/staff-portal/my-account"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/staff-portal/my-account'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    My Account
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Prepaid Minutes Staff Portal. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
}
