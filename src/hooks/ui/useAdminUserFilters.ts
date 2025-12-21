"use client";
import { useUrlFilters } from "@/hooks/utils/useUrlFilters";

interface UserFilterValues {
  search: string;
}

interface UseAdminUserFiltersParams {
  initialSearch?: string;
}

export function useAdminUserFilters({
  initialSearch = "",
}: UseAdminUserFiltersParams = {}) {
  const { filters, updateFilter, applyFilters, clearAllFilters } =
    useUrlFilters<UserFilterValues>({
      basePath: "/admin/users",
      initialValues: { search: initialSearch },
    });

  return {
    search: filters.search,
    setSearch: (value: string) => updateFilter("search", value),
    handleSearch: () => applyFilters(),
    handleClearSearch: clearAllFilters,
  };
}
