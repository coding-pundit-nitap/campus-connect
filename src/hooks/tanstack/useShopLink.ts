import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createShopAction } from "@/actions/shop/shop-actions";
import { queryKeys } from "@/lib/query-keys";

export function useShopLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShopAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shops.byUser(),
      });
      toast.success("Shop linked successfully!");
    },
    onError: () => {
      toast.error("Failed to link shop.");
    },
  });
}
