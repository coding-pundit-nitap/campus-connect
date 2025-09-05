import { useInfiniteQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { shopAPIService } from "@/services/api/shop-api.service";

export const useAllShops = () => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.all,
    queryFn: ({ pageParam }) =>
      shopAPIService.fetchShops({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
