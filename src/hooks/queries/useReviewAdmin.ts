"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteReviewAction } from "@/actions/admin";

export function useDeleteReview() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await deleteReviewAction(reviewId);
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: () => {
      toast.success("Review deleted successfully");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
}
