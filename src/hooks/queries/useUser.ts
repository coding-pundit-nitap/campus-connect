"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
