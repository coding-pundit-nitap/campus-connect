"use client";

import { CalendarIcon, FilterX, X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@/generated/client";
import { cn } from "@/lib/cn";
import { OrderFilters } from "@/services";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  BATCHED: "Batched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface OrderFilterBarProps {
  filters: OrderFilters;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onDateRangeChange: (
    dateFrom: string | undefined,
    dateTo: string | undefined
  ) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function OrderFilterBar({
  filters,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: OrderFilterBarProps) {
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onDateRangeChange(date?.toISOString(), dateTo?.toISOString());
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onDateRangeChange(dateFrom?.toISOString(), date?.toISOString());
  };

  const handleClearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onDateRangeChange(undefined, undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Select
        value={filters.status || ""}
        onValueChange={(value) =>
          onStatusChange(value ? (value as OrderStatus) : undefined)
        }
      >
        <SelectTrigger className="w-[160px] rounded-xl border-2 bg-card hover:bg-muted transition-all duration-200 hover:scale-[1.02] shadow-xs hover:border-primary/50">
          <SelectValue placeholder="Order Status" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal rounded-xl border-2 bg-card hover:bg-muted transition-all duration-200 hover:scale-[1.02] shadow-xs hover:border-primary/50",
              !dateFrom && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? dateFrom.toLocaleDateString() : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={handleDateFromChange}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal rounded-xl border-2 bg-card hover:bg-muted transition-all duration-200 hover:scale-[1.02] shadow-xs hover:border-primary/50",
              !dateTo && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? dateTo.toLocaleDateString() : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={handleDateToChange}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {(dateFrom || dateTo) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearDates}
          className="h-9 w-9 rounded-xl hover:bg-muted hover:text-destructive transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onClearFilters();
            setDateFrom(undefined);
            setDateTo(undefined);
          }}
          className="ml-auto rounded-xl border-2 hover:bg-muted hover:border-destructive/50 hover:text-destructive transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
        >
          <FilterX className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
