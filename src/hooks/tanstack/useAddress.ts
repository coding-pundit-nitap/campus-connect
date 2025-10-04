"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAddressAction,
  deleteAddressAction,
  getUserAddressesAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "@/actions/user-address/user-address-actions";
import { queryKeys } from "@/lib/query-keys";

export function useUserAddresses() {
  return useQuery({
    queryKey: queryKeys.users.addresses(),
    queryFn: getUserAddressesAction,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddressAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.addresses() });
      toast.success("Address created successfully");
    },
    onError: () => {
      toast.error("Error creating address");
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAddressAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.addresses() });
      toast.success("Address updated successfully");
    },
    onError: () => {
      toast.error("Error updating address");
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddressAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.addresses() });
      toast.success("Address deleted successfully");
    },
    onError: () => {
      toast.error("Error deleting address");
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultAddressAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.addresses() });
      toast.success("Default address updated successfully");
    },
  });
}
