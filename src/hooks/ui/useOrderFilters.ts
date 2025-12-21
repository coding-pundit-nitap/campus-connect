"use client";
import { useUrlFilters } from "@/hooks/utils/useUrlFilters";

interface OrderFilterValues {
  search: string;
  orderStatusFilter: string;
  paymentStatusFilter: string;
}

interface UseOrderFiltersProps {
  initialSearch?: string;
  initialOrderStatus?: string;
  initialPaymentStatus?: string;
}

export function useOrderFilters({
  initialSearch = "",
  initialOrderStatus = "all",
  initialPaymentStatus = "all",
}: UseOrderFiltersProps = {}) {
  const { filters, updateFilter, applyFilters, clearFilter } =
    useUrlFilters<OrderFilterValues>({
      basePath: "/admin/orders",
      initialValues: {
        search: initialSearch,
        orderStatusFilter: initialOrderStatus,
        paymentStatusFilter: initialPaymentStatus,
      },
      paramMapping: {
        orderStatusFilter: "order_status",
        paymentStatusFilter: "payment_status",
      },
    });

  return {
    search: filters.search,
    orderStatusFilter: filters.orderStatusFilter,
    paymentStatusFilter: filters.paymentStatusFilter,
    setSearch: (value: string) => updateFilter("search", value),
    setOrderStatusFilter: (value: string) =>
      updateFilter("orderStatusFilter", value),
    setPaymentStatusFilter: (value: string) =>
      updateFilter("paymentStatusFilter", value),
    handleSearch: () => applyFilters(),
    handleClearSearch: () => clearFilter("search"),
  };
}
