import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/lib/query-keys";
import shopServices from "@/services/shop.services";

export function useShopLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shopServices.createShop,
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
