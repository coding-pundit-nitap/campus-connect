"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleAcceptingOrdersAction } from "@/actions";
import { shopAPIService } from "@/di/container";
import { queryKeys } from "@/lib/query-keys";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
type Props = {
  initialData: ShopWithOwnerDetails[];
  initialNextCursor: string | null;
};
export const useAllShops = ({ initialData, initialNextCursor }: Props) => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.all,
    queryFn: async ({ pageParam }) =>
      shopAPIService.fetchShops({ cursor: pageParam }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialData.length > 0
        ? {
            pages: [
              {
                data: initialData,
                nextCursor: initialNextCursor,
              },
            ],
            pageParams: [null],
          }
        : undefined,
    enabled: initialData.length === 0,
  });
};

export function useToggleAcceptingOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleAcceptingOrdersAction,
    onSuccess: () => {
      toast.success("Shop accepting orders updated successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.shops.byUser() });
      queryClient.invalidateQueries({ queryKey: queryKeys.shops.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to toggle shop accepting orders");
    },
  });
}
