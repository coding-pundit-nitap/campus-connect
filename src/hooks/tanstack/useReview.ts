import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createReviewAction } from "@/actions/product/review-action";
import { queryKeys } from "@/lib/query-keys";

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReviewAction,
    onError: (error) => {
      console.error("Error creating review:", error);
      toast.error("Failed to submit review. Please try again.");
    },
    onSuccess: (_data, { product_id }) => {
      toast.success("Review submitted successfully!");

      // Invalidate all review-related queries for this product
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.reviews(product_id),
      });

      // Invalidate the product detail query to update rating and review count
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });

      // Invalidate all products queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};
