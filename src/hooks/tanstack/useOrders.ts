import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { orderAPIService, sellerAPIService } from "@/services/api";

export function useUserOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => orderAPIService.fetchUserOrders(),
  });
}

export function useOrder(order_id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(order_id),
    queryFn: () => orderAPIService.fetchOrderById(order_id),
    enabled: !!order_id,
  });
}

export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.seller.orders(),
    queryFn: sellerAPIService.fetchSellerOrders,
  });
}
