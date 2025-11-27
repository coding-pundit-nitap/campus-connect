"use client";

import { BroadcastNotification, Notification } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { NotificationSummaryType } from "@/services/notification";

interface NotificationEvent {
  data: string;
}

export function useLiveNotifications() {
  const session = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session.data) {
      return;
    }

    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onopen = () => {};

    const handleNewNotification = (event: NotificationEvent): void => {
      try {
        const newNotification: Notification | BroadcastNotification =
          JSON.parse(event.data);

        const isBroadcast = !("user_id" in newNotification);

        queryClient.setQueryData(
          queryKeys.notifications.summary(),
          (oldSummary: NotificationSummaryType | undefined) => {
            if (!oldSummary) {
              return undefined;
            }

            const exists = isBroadcast
              ? oldSummary.unreadBroadcasts.some(
                  (n) => n.id === newNotification.id
                )
              : oldSummary.unreadNotifications.some(
                  (n) => n.id === newNotification.id
                );

            if (exists) {
              return oldSummary;
            }

            toast.success(newNotification.message);

            return {
              ...oldSummary,
              unreadNotifications: isBroadcast
                ? oldSummary.unreadNotifications
                : [newNotification, ...oldSummary.unreadNotifications],
              unreadBroadcasts: !isBroadcast
                ? oldSummary.unreadBroadcasts
                : [newNotification, ...oldSummary.unreadBroadcasts],
              unreadCount: {
                notifications:
                  oldSummary.unreadCount.notifications + (isBroadcast ? 0 : 1),
                broadcasts:
                  oldSummary.unreadCount.broadcasts + (isBroadcast ? 1 : 0),
                total: oldSummary.unreadCount.total + 1,
              },
            };
          }
        );
      } catch {}
    };
    eventSource.addEventListener("new_notification", handleNewNotification);
    eventSource.addEventListener("new_broadcast", handleNewNotification);

    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, [queryClient, session.data]);
}
