"use client";
import { User } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { loginAction } from "@/actions/authentication/login-actions";
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
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      confirmPassword: string;
    }) => userAPIService.registerUser(data),
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

/**
 * Hook to handle user authentication with credential validation, session management, and navigation.
 *
 * This hook provides a complete user login flow including credential submission,
 * authentication processing, success/error handling, automatic navigation, and
 * session management. It's designed for login forms, authentication pages, and
 * protected route access flows.
 *
 * @returns UseMutationResult for user login with credential data and session handling
 *
 */
export function useLoginUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      loginAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
      toast.success(data.details);
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Login failed: " + error.message);
    },
  });
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
