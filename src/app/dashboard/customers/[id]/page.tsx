"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  User,
  Edit,
  Trash2,
  Save,
  X,
  Receipt,
  Calendar,
  ChevronDown,
} from "lucide-react";

const COUNTRIES = [
  "Papua New Guinea",
  "Australia",
  "New Zealand",
  "Fiji",
  "Solomon Islands",
  "Vanuatu",
  "Samoa",
  "Tonga",
  "Kiribati",
  "Micronesia",
  "United States",
  "United Kingdom",
  "Canada",
  "Philippines",
  "Indonesia",
].sort();
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@pg-prepaid/ui";
import { DashboardLayout } from "@/components/dashboard-layout";

interface Customer {
  _id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  country?: string;
  currentBalance?: number;
  balanceCurrency?: string;
  totalAssigned?: number;
  totalUsed?: number;
  metadata: {
    totalPurchases: number;
    totalSpent: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BalanceHistory {
  _id: string;
  type: string;
  previousBalance: number;
  newBalance: number;
  amount: number;
  description: string;
  createdAt: string;
  adminId?: {
    name: string;
  };
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState<
    "assign" | "adjust" | "reset"
  >("assign");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    name: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  useEffect(() => {
    fetchCustomer();
    fetchBalanceHistory();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/v1/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFormData({
          phoneNumber: data.phoneNumber,
          email: data.email || "",
          name: data.name || "",
          country: data.country || "",
        });
      } else if (response.status === 404) {
        setMessage({ type: "error", text: "Customer not found" });
      }
    } catch (_error) {
      console.error("Failed to fetch customer:", _error);
      setMessage({ type: "error", text: "Failed to load customer details" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomer(updatedCustomer);
        setEditing(false);
        setMessage({ type: "success", text: "Customer updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to update customer",
        });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Failed to update customer" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/v1/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/customers");
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to delete customer",
        });
        setShowDeleteModal(false);
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Failed to delete customer" });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setFormData({
        phoneNumber: customer.phoneNumber,
        email: customer.email || "",
        name: customer.name || "",
        country: customer.country || "",
      });
    }
    setEditing(false);
    setMessage(null);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchBalanceHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/v1/customers/${customerId}/balance/history`,
      );
      if (response.ok) {
        const data = await response.json();
        setBalanceHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch balance history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBalanceAction = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const endpoint =
        balanceAction === "assign"
          ? `/api/v1/customers/${customerId}/balance`
          : `/api/v1/customers/${customerId}/balance`;

      const method = balanceAction === "assign" ? "POST" : "PUT";

      const body: any = {
        description: balanceDescription || `Balance ${balanceAction}`,
      };

      if (balanceAction === "assign") {
        body.amount = parseFloat(balanceAmount);
      } else if (balanceAction === "adjust") {
        body.type = "adjustment";
        body.amount = parseFloat(balanceAmount);
      } else if (balanceAction === "reset") {
        body.type = "reset";
        body.newBalance = parseFloat(balanceAmount);
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Balance ${balanceAction}ed successfully!`,
        });
        setShowBalanceModal(false);
        setBalanceAmount("");
        setBalanceDescription("");
        await fetchCustomer();
        await fetchBalanceHistory();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error?.message || `Failed to ${balanceAction} balance`,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Failed to ${balanceAction} balance` });
    } finally {
      setSaving(false);
    }
  };

  const openBalanceModal = (action: "assign" | "adjust" | "reset") => {
    setBalanceAction(action);
    setBalanceAmount("");
    setBalanceDescription("");
    setShowBalanceModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customer details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The customer you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/dashboard/customers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Customer Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage customer information
            </p>
          </div>
          {!editing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {customer.name || "Unnamed Customer"}
                </CardTitle>
                <CardDescription>
                  Customer since {formatDate(customer.createdAt)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {editing ? (
                    <input
                      type="tel"
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>{customer.phoneNumber}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {editing ? (
                    <input
                      type="email"
                      placeholder="Email address"
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  ) : (
                    <span>{customer.email || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {editing ? (
                    <input
                      type="text"
                      placeholder="Full name"
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <span>{customer.name || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {editing ? (
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search or select country"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        value={formData.country}
                        onChange={(e) => {
                          setFormData({ ...formData, country: e.target.value });
                          setCountrySearch(e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      {showCountryDropdown && filteredCountries.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCountries.map((country) => (
                            <div
                              key={country}
                              className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                              onClick={() => {
                                setFormData({ ...formData, country });
                                setShowCountryDropdown(false);
                                setCountrySearch("");
                              }}
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{customer.country || "Not provided"}</span>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={saving || !formData.phoneNumber}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Purchase Statistics */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Purchase Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Receipt className="h-4 w-4" />
                    <span>Total Purchases</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {customer.metadata.totalPurchases}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      customer.metadata.totalSpent,
                      customer.metadata.currency,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Management Card */}
        {customer.currentBalance !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle>Balance Management</CardTitle>
              <CardDescription>Manage customer prepaid balance</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current Balance Display */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <p className="text-sm opacity-90">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {customer.balanceCurrency}{" "}
                    {customer.currentBalance?.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                  <p className="text-sm opacity-90">Total Assigned</p>
                  <p className="text-2xl font-bold">
                    {customer.balanceCurrency}{" "}
                    {customer.totalAssigned?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                  <p className="text-sm opacity-90">Total Used</p>
                  <p className="text-2xl font-bold">
                    {customer.balanceCurrency}{" "}
                    {customer.totalUsed?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Balance Actions */}
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={() => openBalanceModal("assign")}
                  className="flex-1"
                >
                  Assign Balance
                </Button>
                <Button
                  onClick={() => openBalanceModal("adjust")}
                  variant="outline"
                  className="flex-1"
                >
                  Adjust Balance
                </Button>
                <Button
                  onClick={() => openBalanceModal("reset")}
                  variant="outline"
                  className="flex-1"
                >
                  Reset Balance
                </Button>
              </div>

              {/* Balance History */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Balance History</h3>
                {loadingHistory ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : balanceHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No balance history
                  </p>
                ) : (
                  <div className="space-y-3">
                    {balanceHistory.slice(0, 10).map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {entry.type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.createdAt)}
                            {entry.adminId && ` by ${entry.adminId.name}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${entry.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {entry.amount >= 0 ? "+" : ""}
                            {customer.balanceCurrency}{" "}
                            {Math.abs(entry.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.balanceCurrency}{" "}
                            {entry.previousBalance.toFixed(2)} →{" "}
                            {customer.balanceCurrency}{" "}
                            {entry.newBalance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Action Modal */}
        <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {balanceAction === "assign" && "Assign Balance"}
                {balanceAction === "adjust" && "Adjust Balance"}
                {balanceAction === "reset" && "Reset Balance"}
              </DialogTitle>
              <DialogDescription>
                {balanceAction === "assign" &&
                  "Add balance to this customer's account"}
                {balanceAction === "adjust" &&
                  "Adjust the customer's balance by a specific amount (positive or negative)"}
                {balanceAction === "reset" &&
                  "Set the customer's balance to a specific value"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {balanceAction === "reset" ? "New Balance" : "Amount"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Optional note about this balance change"
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBalanceModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBalanceAction}
                disabled={saving || !balanceAmount}
              >
                {saving
                  ? "Processing..."
                  : `${balanceAction === "assign" ? "Assign" : balanceAction === "adjust" ? "Adjust" : "Reset"} Balance`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Customer:{" "}
                <span className="font-semibold">
                  {customer.name || customer.phoneNumber}
                </span>
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
