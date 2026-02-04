"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Shield,
  User,
  FileText,
  Settings,
  CreditCard,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: "success" | "failed";
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

const actionIcons: Record<string, any> = {
  create: CheckCircle2,
  update: Settings,
  delete: XCircle,
  read: FileText,
  login: User,
  logout: User,
  payment: CreditCard,
  invite: Users,
  default: Shield,
};

const actionColors: Record<string, string> = {
  create: "text-green-600 bg-green-50",
  update: "text-blue-600 bg-blue-50",
  delete: "text-red-600 bg-red-50",
  read: "text-gray-600 bg-gray-50",
  login: "text-purple-600 bg-purple-50",
  logout: "text-orange-600 bg-orange-50",
  payment: "text-emerald-600 bg-emerald-50",
  invite: "text-indigo-600 bg-indigo-50",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAuditLogs();
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch("/api/v1/subscriptions/current");
      if (response.ok) {
        const data = await response.json();
        const tier = data.organization?.subscriptionTier || "starter";
        // Only Scale and Enterprise tiers have audit logs
        setHasAccess(tier === "scale" || tier === "enterprise");
      }
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Resource", "Status", "IP Address"].join(
        ",",
      ),
      ...filteredLogs.map((log) =>
        [
          new Date(log.timestamp).toISOString(),
          log.userEmail,
          log.action,
          log.resource,
          log.status,
          log.ipAddress || "N/A",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">
              Track all actions and changes in your organization
            </p>
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Audit logs are available on <strong>Scale</strong> and{" "}
              <strong>Enterprise</strong> plans. Upgrade your plan to access
              detailed audit trails and security monitoring.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise-Grade Security</CardTitle>
              <CardDescription>
                Get complete visibility into your organization&apos;s activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Complete Activity Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Track all user actions, changes, and system events
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Security Monitoring</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor login attempts, permission changes, and suspicious
                      activity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Compliance Ready</p>
                    <p className="text-sm text-muted-foreground">
                      Meet regulatory requirements with detailed audit trails
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Export & Reporting</p>
                    <p className="text-sm text-muted-foreground">
                      Download audit logs for external analysis and reporting
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button asChild>
                  <a href="/dashboard/billing">
                    Upgrade to Scale or Enterprise
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Complete activity log of all actions in your organization
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, or resource..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={exportLogs}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Entries */}
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading audit logs...
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
                <p className="text-sm mt-2">
                  {searchTerm ||
                  filterAction !== "all" ||
                  filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Activity will appear here as actions are performed"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => {
              const ActionIcon = actionIcons[log.action] || actionIcons.default;
              const colorClass =
                actionColors[log.action] || actionColors.default;

              return (
                <Card key={log.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.userEmail}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground capitalize">
                            {log.action}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {log.resource}
                          </span>
                          {log.resourceId && (
                            <Badge variant="secondary" className="text-xs">
                              {log.resourceId}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          <Badge
                            variant={
                              log.status === "success"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
