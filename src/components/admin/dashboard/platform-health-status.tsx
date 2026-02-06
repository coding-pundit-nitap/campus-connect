"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardAnalytics {
  users: {
    totalUsers: number;
    recentUsers: number;
    activeUsers: number;
    totalAdmins: number;
  };
  shops: {
    totalShops: number;
    activeShops: number;
    verifiedShops: number;
    pendingVerification: number;
  };
  orders: {
    totalOrders: number;
    newOrders: number;
    todayRevenue: number;
    completedOrders: number;
    batchedOrders: number;
    pendingPayments: number;
  };
}

interface PlatformHealthStatusProps {
  analytics: DashboardAnalytics;
}

export function PlatformHealthStatus({ analytics }: PlatformHealthStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Health</CardTitle>
        <CardDescription>Key metrics at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Users
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Active</span>
              <span className="font-medium">{analytics.users.activeUsers}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Admins</span>
              <span className="font-medium">{analytics.users.totalAdmins}</span>
            </div>
          </div>
        </div>

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
                {analytics.orders.batchedOrders}
              </span>
              <span className="text-xs text-muted-foreground">Batched</span>
            </div>
            <div className="flex flex-col p-2 bg-muted/50 rounded text-center">
              <span className="text-lg font-bold text-green-600">
                {analytics.orders.completedOrders}
              </span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>

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
  );
}
