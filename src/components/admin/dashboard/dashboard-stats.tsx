"use client";

import { Package, ShoppingBag, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardAnalytics {
  users: { totalUsers: number; recentUsers: number };
  shops: { totalShops: number; activeShops: number };
  orders: {
    totalOrders: number;
    newOrders: number;
    todayRevenue: number;
    completedOrders: number;
  };
}

interface DashboardStatsProps {
  analytics: DashboardAnalytics;
}

export function DashboardStats({ analytics }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-100">
            Total Users
          </CardTitle>
          <Users className="h-5 w-5 text-blue-200" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.users.totalUsers}</div>
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
  );
}
