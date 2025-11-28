"use client";

import { debounce } from "lodash";
import React, { useMemo, useState, useTransition } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { batchUpdateOrderStatusAction } from "@/actions/orders/order-actions";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { SharedSearchBar } from "@/components/shared/shared-search-bar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useInfiniteScroll, useOrderSearchQuery } from "@/hooks";
import { OrderStatus } from "@/types/prisma.types";

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
    setSelectedOrders([]);
  };

  const handleStatusChange = (status?: OrderStatus) => {
    setFilters((prev) => ({ ...prev, status }));
    setSelectedOrders([]);
  };

  const handleDateChange = (dateRange?: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange }));
    setSelectedOrders([]);
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
        setSelectedOrders([]);
      } else {
        toast.error(response.details);
      }
    });
  };

  const areAllSelected =
    orders.length > 0 && selectedOrders.length === orders.length;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Orders</h1>
        <p className="text-muted-foreground">
          Search, filter, and manage all incoming orders.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold">Filter & Search</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-4 p-4 pt-2 md:grid-cols-3">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader className="sticky top-0 z-10 border-b ">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={areAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all orders on this page"
              />
              <div className="text-sm ">
                {selectedOrders.length > 0 ? (
                  <span className="font-medium">
                    {selectedOrders.length} selected
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select orders</span>
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
            {isLoading && <p>Loading orders...</p>}
            {!isLoading && orders.length === 0 && <p>No orders found.</p>}
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

            {isFetchingNextPage && (
              <p className="text-center">Loading more...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
