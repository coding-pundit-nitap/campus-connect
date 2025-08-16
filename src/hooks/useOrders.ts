import { useQuery } from "@tanstack/react-query";
import {
  orderAPIService,
  sellerAPIService,
  userAPIService,
} from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

export function useUserOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => orderAPIService.fetchUserOrders(),
  });
}

export function useSpecificUserOrders(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.orders(userId),
    queryFn: () => userAPIService.fetchUserOrders({ user_id: userId }),
    enabled: !!userId,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderAPIService.fetchOrderById(orderId),
    enabled: !!orderId,
  });
}

export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.seller.orders(),
    queryFn: () => sellerAPIService.fetchSellerOrders(),
  });
}
