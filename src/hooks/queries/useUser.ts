"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateUser } from "@/actions/user";
import { queryKeys } from "@/lib/query-keys";
import { userAPIService } from "@/services/user";

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
