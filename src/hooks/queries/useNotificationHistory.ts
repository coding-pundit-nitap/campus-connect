"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { notificationAPIService } from "@/services/notification";

export const useNotificationHistory = () => {
  const session = useSession();
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.history(),
    queryFn: ({ pageParam }) =>
      notificationAPIService.fetchNotificationHistory({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: !!session.data,
  });
};
