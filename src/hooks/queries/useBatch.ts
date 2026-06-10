"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelBatchAction,
  completeBatchAction,
  lockBatchAction,
  startBatchDeliveryAction,
  unlockBatchAction,
  verifyOrderOtpAction,
} from "@/actions";
import {
  closeBatchAction,
  updateBatchCutoffTimeAction,
} from "@/actions/shop/batch-actions";
import {
  acceptOrderAction,
  rejectOrderAction,
  startDirectDeliveryAction,
  verifyDeliveryOtpAction,
} from "@/actions/shop/order-management-actions";
import { queryKeys } from "@/lib/query-keys";
import { vendorApiService } from "@/services";

export function useActiveBatchData() {
  return useQuery({
    queryKey: queryKeys.batch.active(),
    queryFn: vendorApiService.getActiveBatchData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}

export function useDirectDeliveriesData() {
  return useQuery({
    queryKey: queryKeys.batch.directDeliveries(),
    queryFn: vendorApiService.getDirectDeliveriesData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}

export function useDeliveryRunData() {
  return useQuery({
    queryKey: queryKeys.batch.deliveryRun(),
    queryFn: vendorApiService.getDeliveryRunData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}

export function useOrderConsoleData() {
  return useQuery({
    queryKey: queryKeys.batch.orderConsole(),
    queryFn: vendorApiService.getOrderConsoleData,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}

export function useNextSlot(shopId: string) {
  return useQuery({
    queryKey: queryKeys.batch.nextSlot(shopId),
    queryFn: () => vendorApiService.getNextSlot(shopId),
    enabled: !!shopId,
  });
}

export function useStartDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startBatchDeliveryAction,
    onSuccess: () => {
      toast.success("Delivery started! Orders marked as OUT_FOR_DELIVERY.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start delivery");
    },
  });
}

export function useCompleteBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeBatchAction,
    onSuccess: () => {
      toast.success("Batch completed! All orders delivered.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete batch");
    },
  });
}

export function useLockBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lockBatchAction,
    onSuccess: () => {
      toast.success("Batch locked! Orders moved to PREP MODE.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batch.vendorDashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to lock batch");
    },
  });
}

export function useUnlockBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlockBatchAction,
    onSuccess: () => {
      toast.success("Batch unlocked. Orders are accepting again.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batch.vendorDashboard(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unlock batch");
    },
  });
}

export function useCancelBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: string; reason: string }) =>
      cancelBatchAction(batchId, reason),
    onSuccess: () => {
      toast.success("Batch cancelled. Orders refunded.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel batch");
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) =>
      verifyOrderOtpAction(orderId, otp),
    onSuccess: () => {
      toast.success("Order verified and delivered!");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid OTP");
    },
  });
}

export function useBatchSlots(shopId: string) {
  return useQuery({
    queryKey: queryKeys.batch.all,
    queryFn: () => vendorApiService.getBatchSlots(shopId),
    enabled: !!shopId,
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptOrderAction,
    onSuccess: () => {
      toast.success("Order accepted successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept order");
    },
  });
}

export function useStartDirectDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startDirectDeliveryAction,
    onSuccess: () => {
      toast.success("Direct delivery started.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start direct delivery");
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      rejectOrderAction(orderId, reason),
    onSuccess: () => {
      toast.success("Order rejected successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject order");
    },
  });
}

export function useUpdateBatchCutoffTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      batchId,
      newCutoffTime,
    }: {
      batchId: string;
      newCutoffTime: Date;
    }) => updateBatchCutoffTimeAction(batchId, newCutoffTime),
    onSuccess: () => {
      toast.success("Batch cutoff time updated.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update batch time");
    },
  });
}

export function useCloseBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeBatchAction,
    onSuccess: () => {
      toast.success("Batch closed and locked for delivery.");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to close batch");
    },
  });
}

export function useVerifyDeliveryOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) =>
      verifyDeliveryOtpAction(orderId, otp),
    onSuccess: () => {
      toast.success("Order verified and delivered successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify OTP");
    },
  });
}
