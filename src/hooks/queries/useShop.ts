"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleShopStatusAction } from "@/actions/shops/toggle-status-action";
import { queryKeys } from "@/lib/query-keys";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { shopAPIService } from "@/services/shop";
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

export const useToggleShopStatus = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleShopStatusAction(shopId),
    onSuccess: (response) => {
      toast.success(response.details);
      queryClient.invalidateQueries({ queryKey: queryKeys.shops.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shops.byUser() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle shop status");
    },
  });
};
