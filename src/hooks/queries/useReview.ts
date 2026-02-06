import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createReviewAction,
  updateReviewAction,
} from "@/actions/product/review-action";
import { queryKeys } from "@/lib/query-keys";

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReviewAction,
    onError: () => {
      toast.error("Failed to submit review. Please try again.");
    },
    onSuccess: (_data, { product_id }) => {
      toast.success("Review submitted successfully!");

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.reviews(product_id),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReviewAction,
    onError: () => {
      toast.error("Failed to update review. Please try again.");
    },
    onSuccess: (_data, { product_id }) => {
      toast.success("Review updated successfully!");

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.reviews(product_id),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product_id),
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};
