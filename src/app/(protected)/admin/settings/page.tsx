import {
  Activity,
  CheckCircle,
  Database,
  History,
  Server,
  Settings,
} from "lucide-react";
import { Metadata, Route } from "next";
import Link from "next/link";

import {
  getAuditLogStatsAction,
  getRecentAuditLogsAction,
} from "@/actions/admin";
import {
  getCleanupStatsAction,
  getPlatformOverviewAction,
  getSystemHealthAction,
} from "@/actions/admin/settings-actions";
import { User } from "@/auth";
import { CleanupCard } from "@/components/admin/settings/cleanup-card";
import { ClientDate } from "@/components/shared/client-date";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import authUtils from "@/lib/utils/auth.utils.server";

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
  description: "Admin settings and system information",
};

export default async function AdminSettingsPage() {
  const user: User = await authUtils.getUserData();

  let systemHealth = null;
  let cleanupStats = null;
  let platformOverview = null;
  let auditStats = null;
  let recentActivity = null;

  try {
    const [
      healthResponse,
      cleanupResponse,
      overviewResponse,
      auditResponse,
      activityResponse,
    ] = await Promise.all([
      getSystemHealthAction(),
      getCleanupStatsAction(),
      getPlatformOverviewAction(),
      getAuditLogStatsAction(),
      getRecentAuditLogsAction(5),
    ]);

    if (healthResponse.success) systemHealth = healthResponse.data;
    if (cleanupResponse.success) cleanupStats = cleanupResponse.data;
    if (overviewResponse.success) platformOverview = overviewResponse.data;
    if (auditResponse.success) auditStats = auditResponse.data;
    if (activityResponse.success) recentActivity = activityResponse.data;
  } catch {
    // Handle errors silently; data will remain null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        </div>
        <p className="text-muted-foreground">
          System health, cleanup tools, and administrative information
        </p>
      </div>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Database connectivity and system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    systemHealth.database.connected
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {systemHealth.database.connected ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Activity className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">
                    {systemHealth.database.connected
                      ? "Connected"
                      : "Disconnected"}{" "}
                    ({systemHealth.database.responseTime}ms)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Total Records</p>
                  <p className="text-sm text-muted-foreground">
                    {systemHealth.stats.totalRecords.toLocaleString()} entries
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Audit Log Range</p>
                  <p className="text-sm text-muted-foreground">
                    {systemHealth.stats.oldestAuditLog
                      ? `Since ${new Date(systemHealth.stats.oldestAuditLog).toLocaleDateString()}`
                      : "No logs yet"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Overview */}
      {platformOverview && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>Comprehensive platform statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.users.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xs text-green-600">
                  {platformOverview.users.active} active
                </p>
              </div>
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.shops.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Shops</p>
                <p className="text-xs text-green-600">
                  {platformOverview.shops.verified} verified
                </p>
              </div>
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.products.total}
                </p>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xs text-amber-600">
                  {platformOverview.products.outOfStock} out of stock
                </p>
              </div>
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.orders.total}
                </p>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-xs text-blue-600">
                  {platformOverview.orders.pending} pending
                </p>
              </div>
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.reviews.total}
                </p>
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="text-xs text-yellow-600">
                  ★ {platformOverview.reviews.averageRating.toFixed(1)} avg
                </p>
              </div>
              <div className="space-y-1 p-3 border rounded-lg">
                <p className="text-2xl font-bold">
                  {platformOverview.payouts.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
                <p className="text-xs text-muted-foreground">
                  ₹{platformOverview.payouts.totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cleanup Tools */}
        {cleanupStats && <CleanupCard stats={cleanupStats} />}

        {/* Recent Admin Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </span>
              <Link
                href={"/admin/audit-logs" as Route}
                className="text-sm font-normal text-primary hover:underline"
              >
                View All →
              </Link>
            </CardTitle>
            <CardDescription>
              {auditStats
                ? `${auditStats.todayLogs} actions today`
                : "Recent admin actions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-muted-foreground">
                        {log.admin_name}
                      </span>
                    </div>
                    <ClientDate date={log.created_at} format="datetime" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Administrator Info */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge>ADMIN</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="font-mono text-xs">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
