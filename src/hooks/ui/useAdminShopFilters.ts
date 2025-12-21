"use client";
import { useUrlFilters } from "@/hooks/utils/useUrlFilters";

interface ShopFilterValues {
  search: string;
  statusFilter: string;
  verificationFilter: string;
}

interface UseAdminShopFiltersProps {
  initialSearch?: string;
  initialStatus?: string;
  initialVerification?: string;
}

export function useAdminShopFilters({
  initialSearch = "",
  initialStatus = "all",
  initialVerification = "all",
}: UseAdminShopFiltersProps = {}) {
  const { filters, updateFilter, applyFilters, clearFilter } =
    useUrlFilters<ShopFilterValues>({
      basePath: "/admin/shops",
      initialValues: {
        search: initialSearch,
        statusFilter: initialStatus,
        verificationFilter: initialVerification,
      },
      paramMapping: {
        statusFilter: "is_active",
        verificationFilter: "verification_status",
      },
    });

  return {
    search: filters.search,
    statusFilter: filters.statusFilter,
    verificationFilter: filters.verificationFilter,
    setSearch: (value: string) => updateFilter("search", value),
    setStatusFilter: (value: string) => updateFilter("statusFilter", value),
    setVerificationFilter: (value: string) =>
      updateFilter("verificationFilter", value),
    handleSearch: () => applyFilters(),
    handleClearSearch: () => clearFilter("search"),
  };
}
