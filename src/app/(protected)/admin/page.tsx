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

import { getDashboardAnalyticsAction } from "@/actions/admin";
import { SharedCard } from "@/components/shared/shared-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Dashboard | Campus Connect",
  description: "Administrative dashboard for managing Campus Connect",
};

export default async function AdminDashboardPage() {
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
          <SharedCard
            title="Total User"
            titleClassName="text-sm font-medium"
            headerContent={<Users className="h-4 w-4 text-muted-foreground" />}
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              {analytics.users.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.users.recentUsers} new this week
            </p>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Active Users
              </span>
              <span className="font-medium">{analytics.users.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Inactive Users
              </span>
              <span className="font-medium">
                {analytics.users.inactiveUsers}
              </span>
            </div>
          </SharedCard>
          <SharedCard
            title="Total Shops"
            titleClassName="text-sm font-medium"
            headerContent={
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              {analytics.shops.totalShops}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.shops.recentShops} active
            </p>
          </SharedCard>
          <SharedCard
            title="Total Orders"
            titleClassName="text-sm font-medium"
            headerContent={
              <Package className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              {analytics.orders.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.orders.recentOrders} new orders
            </p>
          </SharedCard>
          <SharedCard
            title="Today's Revenue"
            titleClassName="text-sm font-medium"
            headerContent={
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
          >
            <div className="text-2xl font-bold">
              ₹{analytics.orders.todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.orders.completedOrders} completed orders
            </p>
          </SharedCard>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href={"/admin/users" as Route}>
          <SharedCard
            title="Manage Users"
            titleClassName="text-sm font-medium"
            headerContent={<Users className="h-4 w-4 text-muted-foreground" />}
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
            className="hover:bg-accent transition-colors cursor-pointer"
          >
            <p className="text-sm text-muted-foreground">
              View, promote, and manage user accounts
            </p>
          </SharedCard>
        </Link>

        <Link href={"/admin/shops" as Route}>
          <SharedCard
            title="Manage Shops"
            titleClassName="text-sm font-medium"
            headerContent={
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
            className="hover:bg-accent transition-colors cursor-pointer"
          >
            <p className="text-sm text-muted-foreground">
              Activate, deactivate, and delete shops
            </p>
          </SharedCard>
        </Link>

        <Link href={"/admin/orders" as Route}>
          <SharedCard
            title="Manage Orders"
            titleClassName="text-sm font-medium"
            headerContent={
              <Package className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
            className="hover:bg-accent transition-colors cursor-pointer"
          >
            <p className="text-sm text-muted-foreground">
              View and update order statuses
            </p>
          </SharedCard>
        </Link>

        <Link href={"/admin/broadcasts" as Route}>
          <SharedCard
            title="Send Broadcasts"
            titleClassName="text-sm font-medium"
            headerContent={<Bell className="h-4 w-4 text-muted-foreground" />}
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
            className="hover:bg-accent transition-colors cursor-pointer"
          >
            <p className="text-sm text-muted-foreground">
              Send notifications to all users
            </p>
          </SharedCard>
        </Link>

        <Link href={"/admin/settings" as Route}>
          <SharedCard
            title="Settings"
            titleClassName="text-sm font-medium"
            headerContent={
              <Settings className="h-4 w-4 text-muted-foreground" />
            }
            headerClassName="flex flex-row items-center justify-between space-y-0 pb-2"
            contentClassName=""
            className="hover:bg-accent transition-colors cursor-pointer"
          >
            <p className="text-sm text-muted-foreground">
              Configure system settings
            </p>
          </SharedCard>
        </Link>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <SharedCard
            title="User Statistics"
            titleClassName="text-sm font-medium"
          >
            <div className="space-y-2">
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
            </div>
          </SharedCard>

          <SharedCard
            title="Shop Statistics"
            titleClassName="text-sm font-medium"
          >
            <div className="space-y-2">
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
            </div>
          </SharedCard>

          <SharedCard
            title="Order Statistics"
            titleClassName="text-sm font-medium"
          >
            <div className="space-y-2">
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
            </div>
          </SharedCard>

          <SharedCard
            title="Payment Statistics"
            titleClassName="text-sm font-medium"
          >
            <div className="space-y-2">
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
            </div>
          </SharedCard>
        </div>
      )}
    </div>
  );
}
