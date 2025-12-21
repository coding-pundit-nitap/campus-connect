"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updatePayoutStatusAction } from "@/actions/admin";
import { PayoutStatus } from "@/types/prisma.types";

export function useUpdatePayoutStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      payoutId,
      status,
    }: {
      payoutId: string;
      status: PayoutStatus;
    }) => {
      const response = await updatePayoutStatusAction({
        payout_id: payoutId,
        status,
      });
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Payout status updated to ${variables.status}`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update payout status");
    },
  });
}
