import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { notificationAPIService } from "@/services/api";

export function useUnreadNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: notificationAPIService.fetchUnreadNotifications,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: notificationAPIService.fetchUnreadCount,
  });
}

export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPIService.markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}
