"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  startIndividualDeliveryAction,
  verifyIndividualOrderOtpAction,
} from "@/actions";
import { queryKeys } from "@/lib/query-keys";

export function useStartIndividualDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => startIndividualDeliveryAction(orderId),
    onSuccess: (response) => {
      toast.success(response.details || "Delivery started");
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batch.vendorDashboard(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start delivery");
    },
  });
}

export function useVerifyIndividualOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) =>
      verifyIndividualOrderOtpAction(orderId, otp),
    onSuccess: (response) => {
      toast.success(response.details || "Order verified");
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batch.vendorDashboard(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid OTP");
    },
  });
}
