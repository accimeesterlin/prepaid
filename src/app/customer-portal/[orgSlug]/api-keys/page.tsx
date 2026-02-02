"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Button, Input, Label, Alert, AlertDescription, toast } from "@pg-prepaid/ui";

interface ApiKey {
  _id: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export default function ApiKeysPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    scopes: [] as string[],
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const availableScopes = [
    { value: "balance:read", label: "Read Balance" },
    { value: "transactions:read", label: "Read Transactions" },
    { value: "transactions:create", label: "Create Transactions" },
    { value: "topup:send", label: "Send Top-ups" },
    { value: "customer:read", label: "Read Profile" },
    { value: "customer:update", label: "Update Profile" },
  ];

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  useEffect(() => {
    if (orgSlug) {
      loadApiKeys();
    }
  }, [orgSlug]);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/customer-portal/${orgSlug}/login`);
          return;
        }
        throw new Error("Failed to load API keys");
      }

      const data = await res.json();
      setApiKeys(data.data || []);
    } catch (err: any) {
      setError(err.message || t("api.keys.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newKeyData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create API key");
      }

      setCreatedKey(data.data.fullKey);
      setNewKeyData({ name: "", scopes: [] });
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || t("api.keys.createError"));
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm(t("api.keys.revokeConfirm"))) return;

    try {
      const res = await fetch(`/api/v1/api-keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to revoke API key");
      }

      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || t("api.keys.revokeError"));
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("api.keys.title")}
          </h1>
          <Button
            onClick={() => {
              setShowCreateModal(true);
              setCreatedKey(null);
            }}
          >
            {t("api.keys.createNew")}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t("api.keys.noKeys")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.name")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.key")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.scopes")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.lastUsed")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("api.keys.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {key.keyPrefix}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : t("api.keys.table.neverUsed")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          key.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {key.isActive
                          ? t("api.keys.table.active")
                          : t("api.keys.table.revoked")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {key.isActive && (
                        <button
                          onClick={() => handleRevoke(key._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t("api.keys.table.revoke")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            {createdKey ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t("api.keys.modal.keyCreated")}
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    {t("api.keys.modal.copyWarning")}
                  </p>
                  <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all">
                    {createdKey}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(createdKey);
                    toast({
                      title: "Copied!",
                      description: t("api.keys.modal.copied"),
                      variant: "success",
                    });
                  }}
                  className="w-full mb-2"
                >
                  {t("api.keys.modal.copyKey")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKey(null);
                  }}
                  className="w-full"
                >
                  {t("api.keys.modal.close")}
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t("api.keys.modal.createTitle")}
                </h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label className="mb-1">
                      {t("api.keys.modal.keyName")}
                    </Label>
                    <Input
                      type="text"
                      required
                      value={newKeyData.name}
                      onChange={(e) =>
                        setNewKeyData({ ...newKeyData, name: e.target.value })
                      }
                      placeholder={t("api.keys.modal.keyNamePlaceholder")}
                    />
                  </div>

                  <div>
                    <Label className="mb-2">
                      {t("api.keys.modal.selectScopes")}
                    </Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableScopes.map((scope) => (
                        <label key={scope.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newKeyData.scopes.includes(scope.value)}
                            onChange={() => toggleScope(scope.value)}
                            className="mr-2 h-4 w-4 text-primary focus:ring-ring border-input rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {scope.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={newKeyData.scopes.length === 0}
                      className="flex-1"
                    >
                      {t("api.keys.modal.create")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1"
                    >
                      {t("api.keys.modal.cancel")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
