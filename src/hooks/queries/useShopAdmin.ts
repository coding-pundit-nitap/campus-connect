import { SellerVerificationStatus } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  activateShopAction,
  deactivateShopAction,
  deleteShopAction,
  updateShopVerificationAction,
} from "@/actions/admin";

export function useActivateShop() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const response = await activateShopAction(shopId);

      if (!response.success) {
        throw new Error(response.details);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to activate shop");
    },
  });
}

export function useDeactivateShop() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const response = await deactivateShopAction(shopId);

      if (!response.success) {
        throw new Error(response.details);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate shop");
    },
  });
}

export function useDeleteShop() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const response = await deleteShopAction(shopId);

      if (!response.success) {
        throw new Error(response.details);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete shop");
    },
  });
}

export function useUpdateShopVerification() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      shopId,
      status,
    }: {
      shopId: string;
      status: SellerVerificationStatus;
    }) => {
      const response = await updateShopVerificationAction(shopId, status);

      if (!response.success) {
        throw new Error(response.details);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update verification status");
    },
  });
}
