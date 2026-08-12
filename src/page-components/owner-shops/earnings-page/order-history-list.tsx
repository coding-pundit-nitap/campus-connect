"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

import { OrderFilterBar } from "@/components/shared/order-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorOrderHistory } from "@/hooks/queries/useVendorOrderHistory";
import { formatCurrency } from "@/lib/utils/currency";
import { getOrderStatusLabel } from "@/lib/utils/order-display";


export function OrderHistoryList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useVendorOrderHistory({
    page,
    pageSize: 20,
    search,
    status: orderStatusFilter === "all" ? "ALL" : orderStatusFilter,
    paymentStatus: paymentStatusFilter === "all" ? "ALL" : paymentStatusFilter,
  });

  const hasFilters =
    search !== "" ||
    orderStatusFilter !== "all" ||
    paymentStatusFilter !== "all";

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-base font-black text-foreground">
        Past orders
      </h2>

      <OrderFilterBar
        search={searchInput}
        orderStatusFilter={orderStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        onSearchChange={setSearchInput}
        onOrderStatusChange={(v) => {
          setOrderStatusFilter(v);
          setPage(1);
        }}
        onPaymentStatusChange={(v) => {
          setPaymentStatusFilter(v);
          setPage(1);
        }}
        onSearch={() => {
          setSearch(searchInput.trim());
          setPage(1);
        }}
        onClearSearch={() => {
          setSearchInput("");
          setSearch("");
          setPage(1);
        }}
      />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      )}

      {isError && (
        <EmptyState
          type="error"
          title="Couldn't load past orders"
          description="Please try refreshing the page."
        />
      )}

      {data && data.orders.length === 0 && (
        <EmptyState
          title={hasFilters ? "No matching orders" : "No orders yet"}
          description={
            hasFilters
              ? "Try a different search or clear your filters."
              : "Completed and cancelled orders will appear here."
          }
        />
      )}

      {data && data.orders.length > 0 && (
        <>
          <div className="space-y-2">
            {data.orders.map((order) => (
              <Link
                key={order.id}
                href={`/owner-shops/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-card/45 p-4 shadow-xs backdrop-blur-xl transition-all hover:border-blue-500/40 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-foreground">
                    {order.display_id}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                    {format(new Date(order.created_at), "d MMM, h:mm a")} ·{" "}
                    {order.user?.name || "Unknown"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-extrabold tabular-nums text-foreground">
                    {formatCurrency(order.total_price)}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-0.5 rounded-md px-1.5 py-0 text-[11px] font-bold"
                  >
                    {getOrderStatusLabel(order.order_status)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-11 rounded-xl px-4 text-xs font-bold"
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              {data.total} {data.total === 1 ? "order" : "orders"}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="h-11 rounded-xl px-4 text-xs font-bold"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
