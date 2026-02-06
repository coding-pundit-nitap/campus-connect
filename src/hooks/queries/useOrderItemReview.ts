import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { reviewApiService } from "@/services";

export const useOrderItemReview = (order_item_id: string) => {
  return useQuery({
    queryKey: queryKeys.products.reviews(order_item_id),
    queryFn: () => reviewApiService.fetchReviewByOrderItemId(order_item_id),
    enabled: !!order_item_id,
    staleTime: 1000 * 60 * 5,
  });
};
