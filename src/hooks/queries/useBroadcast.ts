import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendBroadcastNotificationAction } from "@/actions/admin";
import { BroadcastFormData } from "@/validations";

export function useSendBroadcast() {
  return useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      const response = await sendBroadcastNotificationAction(data);

      if (!response.success) {
        throw new Error(response.details);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.details);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send broadcast");
    },
  });
}
