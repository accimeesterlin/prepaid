import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";
import { ClientProviders } from "@/components/client-providers";
import { PWAInstaller } from "@/components/pwa-installer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mobile Top-Up | Prepaid Minutes Platform",
  description: "Send mobile top-ups worldwide instantly. Fast, secure, and reliable prepaid mobile recharge service.",
  applicationName: "Mobile Top-Up",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mobile Top-Up",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Mobile Top-Up",
    title: "Mobile Top-Up | Prepaid Minutes Platform",
    description: "Send mobile top-ups worldwide instantly. Fast, secure, and reliable prepaid mobile recharge service.",
  },
  twitter: {
    card: "summary",
    title: "Mobile Top-Up | Prepaid Minutes Platform",
    description: "Send mobile top-ups worldwide instantly. Fast, secure, and reliable prepaid mobile recharge service.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
        <ToastProvider />
        <PWAInstaller />
      </body>
    </html>
  );
}
