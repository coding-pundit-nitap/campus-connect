"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addShopDeliveryBuildingAction,
  createBuildingAction,
  removeShopDeliveryBuildingAction,
} from "@/actions/building/building-actions";
import { queryKeys } from "@/lib/query-keys";
import { buildingApiService } from "@/services/building";

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: buildingApiService.getBuildings,
    staleTime: 60_000,
  });
}

export function useShopDeliveryBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings.shopDelivery(),
    queryFn: buildingApiService.getShopDeliveryBuildings,
    staleTime: 30_000,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBuildingAction,
    onSuccess: () => {
      toast.success("Building saved.");
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save building");
    },
  });
}

export function useAddShopDeliveryBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addShopDeliveryBuildingAction,
    onSuccess: () => {
      toast.success("Delivery building added.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildings.shopDelivery(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add delivery building");
    },
  });
}

export function useRemoveShopDeliveryBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeShopDeliveryBuildingAction,
    onSuccess: () => {
      toast.success("Delivery building removed.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildings.shopDelivery(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove delivery building");
    },
  });
}

export function usePublicShopDeliveryBuildings(shopId: string) {
  return useQuery({
    queryKey: ["buildings", "public", shopId],
    queryFn: () => buildingApiService.getPublicShopDeliveryBuildings(shopId),
    enabled: !!shopId,
    staleTime: 60_000,
  });
}
