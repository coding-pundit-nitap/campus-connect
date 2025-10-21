import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [orderStatusFilter, setOrderStatusFilter] =
    useState(initialOrderStatus);
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState(initialPaymentStatus);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (orderStatusFilter !== "all")
      params.set("order_status", orderStatusFilter);
    if (paymentStatusFilter !== "all")
      params.set("payment_status", paymentStatusFilter);
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearch("");
    const params = new URLSearchParams();
    if (orderStatusFilter !== "all")
      params.set("order_status", orderStatusFilter);
    if (paymentStatusFilter !== "all")
      params.set("payment_status", paymentStatusFilter);
    router.push(`/admin/orders?${params.toString()}`);
  };

  return {
    search,
    orderStatusFilter,
    paymentStatusFilter,
    setSearch,
    setOrderStatusFilter,
    setPaymentStatusFilter,
    handleSearch,
    handleClearSearch,
  };
}
