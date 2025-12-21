"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getStockWatchesAction,
  isWatchingStockAction,
  toggleStockWatchAction,
} from "@/actions/products/stock-watch-actions";
import {
  getFavoriteShopsAction,
  toggleFavoriteShopAction,
} from "@/actions/shops/favorite-shops-actions";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export function useFavoriteShops() {
  return useQuery({
    queryKey: queryKeys.users.favorites,
    queryFn: async () => {
      const response = await getFavoriteShopsAction();
      if (!response.success) throw new Error(response.details);
      return response.data;
    },
  });
}

export function useToggleFavoriteShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavoriteShopAction,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.favorites });
        toast.success(
          data.data.isFavorite ? "Added to favorites" : "Removed from favorites"
        );
      }
    },
    onError: () => {
      toast.error("Failed to update favorites");
    },
  });
}

export function useStockWatches() {
  return useQuery({
    queryKey: queryKeys.users.stockWatches,
    queryFn: async () => {
      const response = await getStockWatchesAction();
      if (!response.success) throw new Error(response.details);
      return response.data;
    },
  });
}

export function useToggleStockWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleStockWatchAction,
    onSuccess: (data, productId) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.stockWatches,
        });
        queryClient.invalidateQueries({ queryKey: ["stock-watch", productId] });
        toast.success(
          data.data.isWatching ? "Now watching stock" : "Stopped watching stock"
        );
      }
    },
    onError: () => {
      toast.error("Failed to update stock watch");
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orders", "stats"],
    queryFn: async () => {
      const { orderAPIService } = await import("@/services");
      const response = await orderAPIService.fetchUserOrders({ limit: 10 });
      return response.data;
    },
  });
}

export function useIsWatchingStock(productId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["stock-watch", productId],
    queryFn: async () => isWatchingStockAction(productId),
    enabled: !!productId && enabled,
  });
}

type Session = {
  id: string;
  createdAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
  current?: boolean;
};

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const result = await authClient.listSessions();
      return (result.data as Session[]) || [];
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await authClient.revokeSession({ token: sessionId });
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session revoked successfully");
    },
    onError: () => {
      toast.error("Failed to revoke session");
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.revokeOtherSessions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("All other sessions have been signed out");
    },
    onError: () => {
      toast.error("Failed to sign out other sessions");
    },
  });
}
