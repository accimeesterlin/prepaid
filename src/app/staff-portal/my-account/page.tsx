"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  currentBalance?: number;
  totalAssigned?: number;
  totalUsed?: number;
  permissions: string[];
}

export default function MyAccountPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { } = useTranslation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || "Failed to load user data"}
      </div>
    );
  }

  const hasBalance = user.currentBalance !== undefined;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Name
            </label>
            <p className="text-lg text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Role
            </label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {user.role}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              User ID
            </label>
            <p className="text-sm text-gray-500 font-mono">{user._id}</p>
          </div>
        </div>
      </div>

      {/* Balance Information (if applicable) */}
      {hasBalance && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Balance Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <p className="text-sm text-blue-100">Current Balance</p>
              <p className="text-2xl font-bold">
                ${user.currentBalance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
              <p className="text-sm text-green-100">Total Assigned</p>
              <p className="text-2xl font-bold">
                ${user.totalAssigned?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <p className="text-sm text-purple-100">Total Used</p>
              <p className="text-2xl font-bold">
                ${user.totalUsed?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Permissions</h2>
        {user.permissions && user.permissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {user.permissions.map((permission) => (
              <div
                key={permission}
                className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">{permission}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No specific permissions assigned</p>
        )}
      </div>
    </div>
  );
}
