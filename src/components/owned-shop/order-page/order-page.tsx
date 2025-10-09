"use client";

import { OrderStatus } from "@prisma/client";
import { debounce } from "lodash";
import React, { useMemo, useState, useTransition } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { batchUpdateOrderStatusAction } from "@/actions/order/order-actions";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { SharedSearchBar } from "@/components/shared/shared-search-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { useInfiniteScroll, useOrderSearchQuery } from "@/hooks";

import { BatchOrderStatusUpdater } from "./batch-order-status-updater";
import OrderCard from "./order-card";
import OrderFilter from "./order-filter";

export default function OrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filters, setFilters] = useState<{
    status?: OrderStatus;
    dateRange?: DateRange;
  }>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const debouncedSetQuery = useMemo(
    () => debounce((q: string) => setDebouncedSearchTerm(q), 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSetQuery(newSearchTerm);
  };

  const handleStatusChange = (status?: OrderStatus) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleDateChange = (dateRange?: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange }));
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useOrderSearchQuery(debouncedSearchTerm, filters);

  const orders = data?.pages.flatMap((page) => page.orders) || [];

  const { lastElementRef } = useInfiniteScroll({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  });

  const handleSelectionChange = (orderId: string, isSelected: boolean) => {
    setSelectedOrders((prev) =>
      isSelected ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(orders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBatchUpdate = (status: OrderStatus) => {
    startTransition(async () => {
      const response = await batchUpdateOrderStatusAction({
        orderIds: selectedOrders,
        status,
      });
      if (response.success) {
        toast.success(response.details);
        setSelectedOrders([]);
      } else {
        toast.error(response.details);
      }
    });
  };

  const areAllSelected =
    orders.length > 0 && selectedOrders.length === orders.length;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Shop Orders</h1>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <SharedSearchBar
          placeholder="Search Orders..."
          value={searchTerm}
          onChange={handleSearchChange}
          showSuggestionsDropdown={false}
        />
        <OrderFilter
          selectedStatus={filters.status}
          onStatusChange={handleStatusChange}
        />
        <DateRangePicker
          date={filters.dateRange}
          onDateChange={handleDateChange}
        />
      </div>

      <div className="sticky top-0 bg-background z-10 py-2 mb-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={areAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all orders on this page"
            />
            {selectedOrders.length > 0 ? (
              <span className="text-sm font-medium">
                {selectedOrders.length} selected
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Select All</span>
            )}
          </div>
          {selectedOrders.length > 0 && (
            <BatchOrderStatusUpdater
              onUpdate={handleBatchUpdate}
              isUpdating={isPending}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-center">Loading orders...</p>}
        {!isLoading && orders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No orders found.
          </p>
        )}

        {orders.map((order, index) => {
          const isLastElement = index === orders.length - 1;
          return (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelectionChange={handleSelectionChange}
              lastElementRef={isLastElement ? lastElementRef : undefined}
            />
          );
        })}

        {isFetchingNextPage && <p className="text-center">Loading more...</p>}
      </div>
    </div>
  );
}
