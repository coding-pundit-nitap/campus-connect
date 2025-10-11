"use client";

import { BroadcastNotification, Notification } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query-keys";
import { NotificationSummaryType } from "@/services/api/notification-api.service";

interface NotificationEvent {
  data: string;
}

export function useLiveNotifications() {
  const session = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (session.status !== "authenticated") return;

    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onopen = () => {
      console.log("Connection to notification stream opened.");
    };

    const handleNewNotification = (event: NotificationEvent): void => {
      try {
        const newNotification: Notification | BroadcastNotification =
          JSON.parse(event.data);

        const isBroadcast = !("user_id" in newNotification);

        queryClient.setQueryData(
          queryKeys.notifications.summary(),
          (oldSummary: NotificationSummaryType | undefined) => {
            if (!oldSummary) return undefined;

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
      } catch (e: unknown) {
        console.error("Error processing new notification:", e);
      }
    };
    eventSource.addEventListener("new_notification", handleNewNotification);
    eventSource.addEventListener("new_broadcast", handleNewNotification);

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };
    return () => {
      eventSource.close();
      console.log("Connection to notification stream closed.");
    };
  }, [queryClient, session.status]);
}
