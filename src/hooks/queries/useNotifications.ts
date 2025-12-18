import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { markAllNotificationsAsReadAction } from "@/actions/notifications/notification-actions";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { notificationAPIService } from "@/services/notification";

export function useNotificationSummary() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.notifications.summary(),
    queryFn: notificationAPIService.fetchNotificationSummary,
    enabled: !!session.data,
  });
}

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPIService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.summary(),
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsReadAction,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(
          `Marked ${response.data?.count || 0} notifications as read`
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.summary(),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.history(),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark notifications as read");
    },
  });
}
