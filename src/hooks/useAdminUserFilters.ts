"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UseAdminUserFiltersParams {
  initialSearch?: string;
}

export function useAdminUserFilters({
  initialSearch = "",
}: UseAdminUserFiltersParams = {}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearch("");
    router.push("/admin/users");
  };

  return {
    search,
    setSearch,
    handleSearch,
    handleClearSearch,
  };
}
