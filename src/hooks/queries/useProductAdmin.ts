"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteProductAction } from "@/actions/admin";

export function useDeleteProduct() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await deleteProductAction(productId);
      if (!response.success) {
        toast.error(response.details);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}
