import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Metadata, Route } from "next";
import Link from "next/link";

import {
  getDashboardAnalyticsAction,
  getPayoutStatsAction,
  getRecentAuditLogsAction,
  getReviewStatsAction,
} from "@/actions/admin";
import { ClientDate } from "@/components/shared/client-date";
import { SharedCard } from "@/components/shared/shared-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Campus Connect",
  description: "Administrative dashboard for managing Campus Connect",
};

// Navigation items configuration
const QUICK_ACTIONS = [
  {
    href: "/admin/users",
    title: "Manage Users",
    description: "View, promote, and manage accounts",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    href: "/admin/shops",
    title: "Manage Shops",
    description: "Activate, verify, and manage shops",
    icon: ShoppingBag,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    href: "/admin/orders",
    title: "Manage Orders",
    description: "View and update order statuses",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    href: "/admin/payouts",
    title: "Manage Payouts",
    description: "Track and manage shop payouts",
    icon: Wallet,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    href: "/admin/reviews",
    title: "Moderate Reviews",
    description: "Review and moderate content",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    href: "/admin/categories",
    title: "View Categories",
    description: "Browse product categories",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    href: "/admin/audit-logs",
    title: "Audit Logs",
    description: "View admin action history",
    icon: Activity,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    href: "/admin/broadcasts",
    title: "Send Broadcasts",
    description: "Send system-wide notifications",
    icon: Bell,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Configure system settings",
    icon: Settings,
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800/50",
  },
];

export default async function AdminDashboardPage() {
  let analytics = null;
  let recentActivity = null;
  let payoutStats = null;
  let reviewStats = null;
  let error = null;

  try {
    const [analyticsRes, activityRes, payoutsRes, reviewsRes] =
      await Promise.all([
        getDashboardAnalyticsAction(),
        getRecentAuditLogsAction(5),
        getPayoutStatsAction(),
        getReviewStatsAction(),
      ]);

    if (analyticsRes.success) analytics = analyticsRes.data;
    else error = analyticsRes.details;

    if (activityRes.success) recentActivity = activityRes.data;
    if (payoutsRes.success) payoutStats = payoutsRes.data;
    if (reviewsRes.success) reviewStats = reviewsRes.data;
  } catch {
    error = "Failed to load analytics";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Key Metrics - Hero Stats */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Users
              </CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.users.totalUsers}
              </div>
              <p className="text-sm text-blue-100">
                +{analytics.users.recentUsers} this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                Active Shops
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.shops.activeShops}
              </div>
              <p className="text-sm text-emerald-100">
                {analytics.shops.totalShops} total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Total Orders
              </CardTitle>
              <Package className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.orders.totalOrders}
              </div>
              <p className="text-sm text-orange-100">
                {analytics.orders.newOrders} new today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Today&apos;s Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{analytics.orders.todayRevenue.toFixed(0)}
              </div>
              <p className="text-sm text-purple-100">
                {analytics.orders.completedOrders} completed orders
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Stats Row */}
      {(payoutStats || reviewStats) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {payoutStats && (
            <>
              <SharedCard
                title="Pending Payouts"
                titleClassName="text-sm font-medium"
                headerContent={
                  <CreditCard className="h-4 w-4 text-amber-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {payoutStats.pendingPayouts}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{Number(payoutStats.totalPendingAmount).toLocaleString()}{" "}
                  pending
                </p>
              </SharedCard>
              <SharedCard
                title="Completed Payouts"
                titleClassName="text-sm font-medium"
                headerContent={
                  <CreditCard className="h-4 w-4 text-green-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {payoutStats.paidPayouts}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{Number(payoutStats.totalPaidAmount).toLocaleString()} paid
                  out
                </p>
              </SharedCard>
            </>
          )}
          {reviewStats && (
            <>
              <SharedCard
                title="Total Reviews"
                titleClassName="text-sm font-medium"
                headerContent={<Star className="h-4 w-4 text-yellow-500" />}
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {reviewStats.totalReviews}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reviewStats.recentReviews} this week
                </p>
              </SharedCard>
              <SharedCard
                title="Average Rating"
                titleClassName="text-sm font-medium"
                headerContent={
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                }
                headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
              >
                <div className="text-2xl font-bold">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">out of 5 stars</p>
              </SharedCard>
            </>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href as Route}>
              <Card className="hover:bg-accent/50 transition-all cursor-pointer hover:shadow-md group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity & Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest admin actions</CardDescription>
            </div>
            <Link
              href={"/admin/audit-logs" as Route}
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {log.admin_name}
                        </p>
                      </div>
                    </div>
                    <ClientDate date={log.created_at} format="datetime" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Health */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Health</CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Users Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Users
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">Active</span>
                    <span className="font-medium">
                      {analytics.users.activeUsers}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">Admins</span>
                    <span className="font-medium">
                      {analytics.users.totalAdmins}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shops Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Shops
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">Verified</span>
                    <span className="font-medium text-green-600">
                      {analytics.shops.verifiedShops}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium text-amber-600">
                      {analytics.shops.pendingVerification}
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Orders
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col p-2 bg-muted/50 rounded text-center">
                    <span className="text-lg font-bold text-blue-600">
                      {analytics.orders.newOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">New</span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/50 rounded text-center">
                    <span className="text-lg font-bold text-orange-600">
                      {analytics.orders.preparingOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Preparing
                    </span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/50 rounded text-center">
                    <span className="text-lg font-bold text-green-600">
                      {analytics.orders.completedOrders}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Payments */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Payments
                </h4>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Pending Payments</span>
                  <span className="font-medium text-amber-600">
                    {analytics.orders.pendingPayments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
