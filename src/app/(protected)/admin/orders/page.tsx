import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Metadata } from "next";

import { getAllOrdersAction } from "@/actions/admin";
import { OrdersTable } from "@/components/admin/orders/orders-table";

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
  let error = null;

  try {
    const response = await getAllOrdersAction({
      cursor,
      search,
      order_status: order_status as OrderStatus | undefined,
      payment_status: payment_status as PaymentStatus | undefined,
      limit: 20,
    });

    if (response.success) {
      orders = response.data;
    } else {
      error = response.details;
    }
  } catch {
    error = "Failed to load orders";
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">
          View and update order statuses and payment information
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {orders && (
        <OrdersTable initialData={orders} searchParams={await searchParams} />
      )}
    </div>
  );
}
