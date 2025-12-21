"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateProfileImageAction } from "@/actions/user/profile-image-action";
import { queryKeys } from "@/lib/query-keys";

export function useProfileImageUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileImageAction,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Profile picture updated!");
        queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload profile picture.");
    },
  });
}
