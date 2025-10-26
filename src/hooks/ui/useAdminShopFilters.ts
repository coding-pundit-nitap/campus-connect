import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [verificationFilter, setVerificationFilter] =
    useState(initialVerification);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    if (statusFilter !== "all") {
      params.set("is_active", statusFilter);
    }
    if (verificationFilter !== "all") {
      params.set("verification_status", verificationFilter);
    }
    router.push(`/admin/shops?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearch("");
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("is_active", statusFilter);
    }
    if (verificationFilter !== "all") {
      params.set("verification_status", verificationFilter);
    }
    router.push(`/admin/shops?${params.toString()}`);
  };

  return {
    search,
    statusFilter,
    verificationFilter,
    setSearch,
    setStatusFilter,
    setVerificationFilter,
    handleSearch,
    handleClearSearch,
  };
}
