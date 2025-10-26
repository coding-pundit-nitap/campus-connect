"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  forceSignOutUserAction,
  makeUserAdminAction,
  removeUserAdminAction,
} from "@/actions/admin";

export function usePromoteUser() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await makeUserAdminAction(userId);
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to promote user");
    },
  });
}

export function useDemoteUser() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await removeUserAdminAction(userId);
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove admin privileges");
    },
  });
}

export function useForceSignOutUser() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await forceSignOutUserAction(userId);
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success(data.details);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sign out user");
    },
  });
}
