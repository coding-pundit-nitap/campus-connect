import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createOrderAction } from "@/actions";
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

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrderAction,
    onSuccess: ({ details }) => {
      toast.success(details);
    },
    onError: ({ message }) => {
      toast.error(message || "Failed to place order.");
    },
  });
}
