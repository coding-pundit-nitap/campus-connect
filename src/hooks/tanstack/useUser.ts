"use client";
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
