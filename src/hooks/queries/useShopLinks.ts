"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createShopAction, updateShopAction } from "@/actions";
import { queryKeys } from "@/lib/query-keys";

export function useShopLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShopAction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.byUser(),
      });
      if (data.success) {
        toast.success(data.details || "Shop linked successfully!");
      }
    },
    onError: () => {
      toast.error("Failed to link shop.");
    },
  });
}

export function useShopUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.byUser(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.all,
      });
    },
  });
}
