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
import { Card, CardContent } from "@/components/ui/card";
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

function extractHostelBlock(snapshot: string): string | null {
  try {
    const parsed = JSON.parse(snapshot) as { hostel_block?: unknown };
    const block = parsed?.hostel_block;
    return typeof block === "string" && block.trim() !== "" ? block : null;
  } catch {
    return null;
  }
}

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useOrderSearchQuery(debouncedSearchTerm, filters);

  const orders = data?.pages.flatMap((page) => page.orders) || [];

  // Derive available blocks from the current dataset dynamically
  const pages = data?.pages;

  const availableBlocks = useMemo(() => {
    if (!pages) return [];
    const blocks = pages
      .flatMap((page) => page.orders)
      .map((o) => extractHostelBlock(o.delivery_address_snapshot))
      .filter(
        (block): block is string =>
          typeof block === "string" && block.trim() !== ""
      );
    return Array.from(new Set(blocks)).sort();
  }, [pages]);

  const { lastElementRef } = useInfiniteScroll({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  });

  // --- Filter Guard Logic ---
  const handleFilterChange = (setterFn: () => void) => {
    if (selectedOrders.length > 0) {
      toast.warning(
        "Changing filters will clear your order selection. Continue?",
        {
          duration: Infinity,
          action: {
            label: "Continue",
            onClick: () => {
              setSelectedOrders([]);
              setterFn();
            },
          },
          cancel: {
            label: "Cancel",
            onClick: () => {},
          },
        }
      );
    } else {
      setterFn();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    handleFilterChange(() => {
      setSearchTerm(newSearchTerm);
      debouncedSetQuery(newSearchTerm);
    });
  };

  const handleStatusChange = (status?: OrderStatus) => {
    handleFilterChange(() => setFilters((prev) => ({ ...prev, status })));
  };

  const handleDateChange = (dateRange?: DateRange) => {
    handleFilterChange(() => setFilters((prev) => ({ ...prev, dateRange })));
  };

  const handleHostelBlockChange = (hostelBlock?: string) => {
    handleFilterChange(() => setFilters((prev) => ({ ...prev, hostelBlock })));
  };

  const clearFilters = () => {
    handleFilterChange(() => {
      setSearchTerm("");
      setDebouncedSearchTerm("");
      setFilters({});
    });
  };

  // --- Selection Logic ---
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
    <div
      className={cn(
        "container mx-auto space-y-6 p-4 md:p-6",
        selectedOrders.length > 0 && "pb-24"
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Shop Orders</h1>
        <p className="text-muted-foreground">
          Search, filter, and manage all incoming orders.
        </p>
      </div>

      {/* Filter Panel */}
      <Card className="shadow-sm">
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
                  availableBlocks={availableBlocks}
                />
                <DateRangePicker
                  date={filters.dateRange}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order List */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="space-y-0">
          {isLoading && (
            <div className="p-4">
              <OrderCardSkeletonList count={4} />
            </div>
          )}

          {!isLoading && orders.length === 0 && (
            <div className="p-8">
              <EmptyState
                title={
                  hasActiveFilters ? "No matching orders" : "No orders yet"
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for."
                    : "When customers place orders, they'll appear here."
                }
                icon={
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </div>
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
            <div className="p-4">
              <OrderCardSkeletonList count={2} />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Selection Bar */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-300 ease-out">
          <div className="container mx-auto p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={areAllSelected}
                onChange={(checked) => handleSelectAll(!!checked)}
                aria-label="Select all orders"
                className="shadow-sm"
              />
              <span className="font-semibold text-sm">
                {selectedOrders.length} Selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrders([])}
                className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>

            <BatchOrderStatusUpdater
              onUpdate={handleBatchUpdate}
              isUpdating={isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
