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
import { queryKeys } from "@/lib/query-keys";
import { vendorApiService } from "@/services";

export function useVendorDashboard() {
  return useQuery({
    queryKey: queryKeys.batch.vendorDashboard(),
    queryFn: vendorApiService.getVendorDetails,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
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
