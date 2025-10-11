import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { queryKeys } from "@/lib/query-keys";
import { notificationAPIService } from "@/services/api";

export function useNotificationSummary() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.notifications.summary(),
    queryFn: notificationAPIService.fetchNotificationSummary,
    enabled: session.status === "authenticated",
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
