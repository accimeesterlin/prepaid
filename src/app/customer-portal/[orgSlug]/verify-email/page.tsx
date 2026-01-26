"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  // Auto-verify if token is in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && orgSlug) {
      handleVerify(token);
    }
  }, [searchParams, orgSlug]);

  const handleVerify = async (token: string) => {
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/v1/customer-auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, orgSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Verification failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/customer-portal/${orgSlug}/login`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("verification.verifyEmail.error"));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/customer-auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Resend failed");
      }

      alert(t("verification.verifyEmail.resendSuccess"));
    } catch (err: any) {
      setError(err.message || t("verification.verifyEmail.resendError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {verifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t("verification.verifyEmail.verifying")}
              </h1>
            </>
          ) : success ? (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t("verification.verifyEmail.successTitle")}
              </h1>
              <p className="text-gray-600">
                {t("verification.verifyEmail.successMessage")}
              </p>
            </>
          ) : (
            <>
              <div className="text-purple-500 text-5xl mb-4">✉</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t("verification.verifyEmail.title")}
              </h1>
              <p className="text-gray-600 mb-6">
                {t("verification.verifyEmail.message")}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t("verification.verifyEmail.resending")
                  : t("verification.verifyEmail.resendButton")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
