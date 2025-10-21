import {
  Bell,
  Package,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardAnalyticsAction } from "@/actions/admin";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Dashboard | Campus Connect",
  description: "Administrative dashboard for managing Campus Connect",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/?error=unauthorized");
  }

  let analytics = null;
  let error = null;

  try {
    const response = await getDashboardAnalyticsAction();
    if (response.success) {
      analytics = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load analytics";
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, shops, orders, and broadcast notifications
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.users.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.users.recentUsers} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.shops.totalShops}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.shops.activeShops} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.orders.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.orders.newOrders} new orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{analytics.orders.todayRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.orders.completedOrders} completed orders
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href={"/admin/users" as Route}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">
                Manage Users
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View, promote, and manage user accounts
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={"/admin/shops" as Route}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">
                Manage Shops
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activate, deactivate, and delete shops
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={"/admin/orders" as Route}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">
                Manage Orders
              </CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and update order statuses
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={"/admin/broadcasts" as Route}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">
                Send Broadcasts
              </CardTitle>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Send notifications to all users
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={"/admin/settings" as Route}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Settings</CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure system settings
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Users
                </span>
                <span className="font-medium">
                  {analytics.users.totalUsers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Admins</span>
                <span className="font-medium">
                  {analytics.users.totalAdmins}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Regular Users
                </span>
                <span className="font-medium">
                  {analytics.users.totalRegularUsers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  New This Week
                </span>
                <span className="font-medium">
                  {analytics.users.recentUsers}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shop Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Shops
                </span>
                <span className="font-medium">
                  {analytics.shops.totalShops}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Shops
                </span>
                <span className="font-medium">
                  {analytics.shops.activeShops}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Verified Shops
                </span>
                <span className="font-medium">
                  {analytics.shops.verifiedShops}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Verification
                </span>
                <span className="font-medium">
                  {analytics.shops.pendingVerification}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Orders
                </span>
                <span className="font-medium">
                  {analytics.orders.totalOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="font-medium">
                  {analytics.orders.newOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Preparing</span>
                <span className="font-medium">
                  {analytics.orders.preparingOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {analytics.orders.completedOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <span className="font-medium">
                  {analytics.orders.cancelledOrders}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Today's Revenue
                </span>
                <span className="font-medium">
                  ₹{analytics.orders.todayRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Payments
                </span>
                <span className="font-medium">
                  {analytics.orders.pendingPayments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Recent Orders
                </span>
                <span className="font-medium">
                  {analytics.orders.recentOrders}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
