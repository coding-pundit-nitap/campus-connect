import { AlertTriangle, CheckCircle, Clock, Package } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { OrderStatus, PaymentStatus } from "@/../prisma/generated/client";
import { getAllOrdersAction, getOrderStatsAction } from "@/actions/admin";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Order Management | Admin Dashboard",
  description: "View and manage all orders",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
    order_status?: string;
    payment_status?: string;
  }>;
}) {
  const { cursor, search, order_status, payment_status } = await searchParams;

  let orders = null;
  let stats = null;
  let error = null;

  try {
    const [ordersRes, statsRes] = await Promise.all([
      getAllOrdersAction({
        cursor,
        search,
        order_status: order_status as OrderStatus | undefined,
        payment_status: payment_status as PaymentStatus | undefined,
        limit: 20,
      }),
      getOrderStatsAction(),
    ]);

    if (ordersRes.success) orders = ordersRes.data;
    else error = ordersRes.details;

    if (statsRes.success) stats = statsRes.data;
  } catch {
    error = "Failed to load orders";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Package className="h-7 w-7 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">
            Order Management
          </h1>
        </div>
        <p className="text-muted-foreground">
          View and manage customer orders, payments, and delivery status
        </p>
        <div className="text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-primary">
            Dashboard
          </Link>
          {" / "}
          <span>Orders</span>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentOrders} new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Orders</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.newOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.batchedOrders}
              </div>
              <p className="text-xs text-muted-foreground">In batch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Delivered successfully
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payment
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground">
                Payment not verified
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {orders && (
        <OrdersTable initialData={orders} searchParams={await searchParams} />
      )}
    </div>
  );
}
