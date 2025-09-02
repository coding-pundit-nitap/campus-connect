import { useInfiniteQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { shopAPIService } from "@/services/shop.service";

export const useAllShops = () => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.all,
    queryFn: ({ pageParam }) =>
      shopAPIService.fetchShops({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
