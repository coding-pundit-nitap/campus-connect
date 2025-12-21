"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { runCleanupAction } from "@/actions/admin/settings-actions";

export function useRunCleanup() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (type: "notifications" | "sessions" | "carts") => {
      const response = await runCleanupAction(type);
      if (!response.success) {
        throw new Error(response.details);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Cleaned up ${data.data.deletedCount} records`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to run cleanup");
    },
  });
}
