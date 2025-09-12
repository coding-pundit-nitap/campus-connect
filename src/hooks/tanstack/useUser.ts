"use client";

import { User } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { loginAction } from "@/actions";
import { queryKeys } from "@/lib/query-keys";
import { userAPIService } from "@/services/api";

/**
 * Hook to handle user registration with form validation, mutation management, and automatic cache invalidation.
 *
 * This hook provides a complete user registration flow including form submission,
 * server-side validation, success/error handling, and automatic cache management.
 * It's designed for registration forms, sign-up pages, and user onboarding flows.
 *
 * @returns UseMutationResult for user registration with form data and response handling
 *
 */
export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPIService.registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      toast.success("Registration successful! Please log in.");
    },
    onError: (error) => {
      toast.error("Registration failed: " + error.message);
    },
  });
}

export function useLoginUserMutation() {
  return useMutation({
    mutationFn: loginAction,
  });
}

export function useLoginUser() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useLoginUserMutation();

  const loginUser = useCallback(
    (data: { email: string; password: string }) => {
      mutation.mutate(data, {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
          toast.success(result.details);
          router.push("/");
          router.refresh();
        },
        onError: (error) => {
          toast.error("Login failed: " + error.message);
        },
      });
    },
    [mutation, queryClient, router]
  );

  return {
    ...mutation,
    loginUser,
  };
}

/**
 * Hook to provide optimistic user data updates with local cache management and server synchronization.
 *
 * This hook enables immediate UI updates for user data changes while maintaining
 * data consistency through cache management and server synchronization. It's designed
 * for profile editing, user preferences, and any scenario requiring responsive user
 * data updates without waiting for server round-trips.
 *
 * @returns Object containing functions for local user updates and cache invalidation
 *
 */
export function useOptimisticUserUpdate() {
  const queryClient = useQueryClient();

  return {
    updateUserLocally: (user_id: string, updates: Partial<User>) => {
      queryClient.setQueryData(
        queryKeys.users.profile(user_id),
        (oldData: User | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
    },
    invalidateUser: (user_id: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(user_id),
      });
    },
  };
}
