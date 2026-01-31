"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@pg-prepaid/ui";
import {
  LayoutDashboard,
  Send,
  History,
  Settings,
  Key,
  LogOut,
  Menu,
  X,
} from "lucide-react";

function CustomerPortalContent({
  children,
  orgSlug,
  isAuthPage,
}: {
  children: React.ReactNode;
  orgSlug: string;
  isAuthPage: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: t("customer.portal.menu.dashboard"),
      href: `/customer-portal/${orgSlug}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: t("customer.portal.menu.sendMinutes"),
      href: `/customer-portal/${orgSlug}/send-minutes`,
      icon: Send,
    },
    {
      name: t("customer.portal.menu.transactions"),
      href: `/customer-portal/${orgSlug}/transactions`,
      icon: History,
    },
    {
      name: t("customer.portal.menu.settings"),
      href: `/customer-portal/${orgSlug}/settings`,
      icon: Settings,
    },
    {
      name: t("customer.portal.menu.apiKeys"),
      href: `/customer-portal/${orgSlug}/api-keys`,
      icon: Key,
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/v1/customer-auth/logout", {
      method: "POST",
    });
    router.push(`/customer-portal/${orgSlug}/login`);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-screen lg:h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b lg:hidden">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t("customer.portal.menu.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-full">
        {/* Mobile menu button */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

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
      <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-30 flex-shrink-0">
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
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex-1 overflow-hidden">
          <CustomerPortalContent orgSlug={orgSlug} isAuthPage={isAuthPage}>
            {children}
          </CustomerPortalContent>
        </div>
      </div>
    </LanguageProvider>
  );
}
