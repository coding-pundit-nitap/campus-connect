"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrderActionsDropdown } from "@/components/shared/order-actions-dropdown";
import { OrderFilterBar } from "@/components/shared/order-filter-bar";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
} from "@/hooks/tanstack/useOrders";
import { useOrderFilters } from "@/hooks/useOrderFilters";
import { SerializedOrderWithDetails } from "@/types";
import { CursorPaginatedResponse } from "@/types/response.types";

import { OrderDetailsDialog } from "./order-details-dialog";

interface OrdersTableProps {
  initialData: CursorPaginatedResponse<SerializedOrderWithDetails>;
  searchParams: {
    cursor?: string;
    search?: string;
    order_status?: string;
    payment_status?: string;
  };
}

export function OrdersTable({ initialData, searchParams }: OrdersTableProps) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] =
    useState<SerializedOrderWithDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const filters = useOrderFilters({
    initialSearch: searchParams.search,
    initialOrderStatus: searchParams.order_status,
    initialPaymentStatus: searchParams.payment_status,
  });

  const { mutate: updateOrderStatus, isPending: isUpdatingOrder } =
    useUpdateOrderStatus();
  const { mutate: updatePaymentStatus, isPending: isUpdatingPayment } =
    useUpdatePaymentStatus();

  const isPending = isUpdatingOrder || isUpdatingPayment;

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams);
    if (initialData.nextCursor) {
      params.set("cursor", initialData.nextCursor);
    }
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleViewDetails = (order: SerializedOrderWithDetails) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <OrderFilterBar
        search={filters.search}
        orderStatusFilter={filters.orderStatusFilter}
        paymentStatusFilter={filters.paymentStatusFilter}
        onSearchChange={filters.setSearch}
        onOrderStatusChange={filters.setOrderStatusFilter}
        onPaymentStatusChange={filters.setPaymentStatusFilter}
        onSearch={filters.handleSearch}
        onClearSearch={filters.handleClearSearch}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    #{order.display_id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {order.user?.name || "N/A"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.user?.phone || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{order.shop.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">₹{order.total_price}</span>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.order_status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge
                      status={order.payment_status}
                      paymentMethod={order.payment_method}
                      showMethod
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{order.created_at}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderActionsDropdown
                      onViewDetails={() => handleViewDetails(order)}
                      onUpdateOrderStatus={(status) =>
                        updateOrderStatus({ orderId: order.id, status })
                      }
                      onUpdatePaymentStatus={(status) =>
                        updatePaymentStatus({ orderId: order.id, status })
                      }
                      disabled={isPending}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {initialData.hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}
    </div>
  );
}
