"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { loginAction } from "@/actions";
import { changePaswordAction } from "@/actions/authentication/change-password";
import { updateUser } from "@/actions/user";
import { queryKeys } from "@/lib/query-keys";
import { userAPIService } from "@/services/api";

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

export function useUser() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: userAPIService.getMe,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePaswordAction,
    onSuccess({ details }) {
      toast.success(details);
    },
    onError(error) {
      toast.error(error.message || "Faild to Change Password.");
    },
  });
}
