import { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getOrderStatsAction,
  getShopStatsAction,
  getUserStatsAction,
} from "@/actions/admin";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings | Admin Dashboard",
  description: "Admin settings and system information",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/?error=unauthorized");
  }

  let systemStats = null;
  try {
    const [userStats, shopStats, orderStats] = await Promise.all([
      getUserStatsAction(),
      getShopStatsAction(),
      getOrderStatsAction(),
    ]);

    if (userStats.success && shopStats.success && orderStats.success) {
      systemStats = {
        users: userStats.data,
        shops: shopStats.data,
        orders: orderStats.data,
      };
    }
  } catch {
    // Handle errors silently; systemStats will remain null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          System information and administrative tools
        </p>
      </div>

      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>Current database record counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-3xl font-bold">
                  {systemStats.users.totalUsers}
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemStats.users.totalAdmins} admins
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Shops
                </p>
                <p className="text-3xl font-bold">
                  {systemStats.shops.totalShops}
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemStats.shops.activeShops} active
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-3xl font-bold">
                  {systemStats.orders.totalOrders}
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemStats.orders.completedOrders} completed
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue
                </p>
                <p className="text-3xl font-bold">
                  ₹{systemStats.orders.todayRevenue.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Today's revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Administrator Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge>ADMIN</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="font-mono text-xs">{session.user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Tools</CardTitle>
          <CardDescription>
            Quick access to common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">
                  View and manage user accounts, promote admins
                </p>
              </div>
              <a
                href="/admin/users"
                className="text-sm text-primary hover:underline"
              >
                Manage →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Shop Management</p>
                <p className="text-sm text-muted-foreground">
                  Activate, verify, and manage shops
                </p>
              </div>
              <a
                href="/admin/shops"
                className="text-sm text-primary hover:underline"
              >
                Manage →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Order Management</p>
                <p className="text-sm text-muted-foreground">
                  View and update order statuses
                </p>
              </div>
              <a
                href="/admin/orders"
                className="text-sm text-primary hover:underline"
              >
                Manage →
              </a>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Broadcast Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Send system-wide announcements to all users
                </p>
              </div>
              <a
                href="/admin/broadcasts"
                className="text-sm text-primary hover:underline"
              >
                Send →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
