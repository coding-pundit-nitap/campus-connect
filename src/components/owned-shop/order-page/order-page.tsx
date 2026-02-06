"use client";

import { debounce } from "lodash";
import { Filter, Package, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { DateRangePicker } from "@/components/shared/date-range-picker";
import { SharedSearchBar } from "@/components/shared/shared-search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useBatchUpdateOrderStatus,
  useInfiniteScroll,
  useOrderSearchQuery,
} from "@/hooks";
import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

import { BatchOrderStatusUpdater } from "./batch-order-status-updater";
import HostelBlockFilter from "./hostel-block-filter";
import OrderCard from "./order-card";
import { OrderCardSkeletonList } from "./order-card-skeleton";
import OrderFilter from "./order-filter";

export default function OrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filters, setFilters] = useState<{
    status?: OrderStatus;
    dateRange?: DateRange;
    hostelBlock?: string;
  }>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { mutate: batchUpdateStatus, isPending } = useBatchUpdateOrderStatus(
    () => setSelectedOrders([])
  );

  const debouncedSetQuery = useMemo(
    () => debounce((q: string) => setDebouncedSearchTerm(q), 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSetQuery(newSearchTerm);
    if (selectedOrders.length > 0) {
      toast.info("Selection cleared due to filter change");
    }
    setSelectedOrders([]);
  };

  const handleStatusChange = (status?: OrderStatus) => {
    setFilters((prev) => ({ ...prev, status }));
    if (selectedOrders.length > 0) {
      toast.info("Selection cleared due to filter change");
    }
    setSelectedOrders([]);
  };

  const handleDateChange = (dateRange?: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange }));
    if (selectedOrders.length > 0) {
      toast.info("Selection cleared due to filter change");
    }
    setSelectedOrders([]);
  };

  const handleHostelBlockChange = (hostelBlock?: string) => {
    setFilters((prev) => ({ ...prev, hostelBlock }));
    if (selectedOrders.length > 0) {
      toast.info("Selection cleared due to filter change");
    }
    setSelectedOrders([]);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setFilters({});
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
    batchUpdateStatus({ orderIds: selectedOrders, status });
  };

  const areAllSelected =
    orders.length > 0 && selectedOrders.length === orders.length;

  const hasActiveFilters =
    !!debouncedSearchTerm ||
    !!filters.status ||
    !!filters.dateRange ||
    !!filters.hostelBlock;

  const activeFilterCount = [
    debouncedSearchTerm,
    filters.status,
    filters.dateRange,
    filters.hostelBlock,
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Shop Orders</h1>
        <p className="text-muted-foreground">
          Search, filter, and manage all incoming orders.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SharedSearchBar
                placeholder="Search by order ID, customer..."
                value={searchTerm}
                onChange={handleSearchChange}
                showSuggestionsDropdown={false}
              />
              <OrderFilter
                selectedStatus={filters.status}
                onStatusChange={handleStatusChange}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <HostelBlockFilter
                  selectedHostelBlock={filters.hostelBlock}
                  onHostelBlockChange={handleHostelBlockChange}
                />
                <DateRangePicker
                  date={filters.dateRange}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={cn("sticky top-0 z-10 border-b")}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={areAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all orders on this page"
                disabled={orders.length === 0}
              />
              <div className="text-sm">
                {selectedOrders.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {selectedOrders.length} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrders([])}
                      className="h-6 px-2 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {orders.length > 0
                      ? `${orders.length} order${orders.length !== 1 ? "s" : ""}`
                      : "Select orders"}
                  </span>
                )}
              </div>
            </div>
            {selectedOrders.length > 0 && (
              <BatchOrderStatusUpdater
                onUpdate={handleBatchUpdate}
                isUpdating={isPending}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {isLoading && <OrderCardSkeletonList count={4} />}

            {!isLoading && orders.length === 0 && (
              <EmptyState
                title={
                  hasActiveFilters ? "No matching orders" : "No orders yet"
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for."
                    : "When customers place orders, they'll appear here."
                }
                icon={<Package className="h-12 w-12 text-muted-foreground" />}
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            )}

            {!isLoading &&
              orders.map((order, index) => {
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

            {isFetchingNextPage && (
              <div className="py-4">
                <OrderCardSkeletonList count={2} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
