"use client";

import { BroadcastNotification, Notification } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query-keys";

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

    eventSource.addEventListener("connected", (event) => {
      console.log(
        "Successfully connected to the notification stream:",
        JSON.parse(event.data)
      );
    });

    const handleNewNotification = (event: NotificationEvent): void => {
      try {
        const newNotification: Notification | BroadcastNotification =
          JSON.parse(event.data);

        const isBroadcast = !("user_id" in newNotification);

        queryClient.setQueryData<{
          unreadNotifications: Notification[];
          unreadBroadcasts: BroadcastNotification[];
        }>(queryKeys.notifications.unread, (oldData) => {
          if (!oldData) {
            return isBroadcast
              ? {
                  unreadNotifications: [],
                  unreadBroadcasts: [newNotification],
                }
              : {
                  unreadNotifications: [newNotification],
                  unreadBroadcasts: [],
                };
          }

          const existsInNotifications = oldData.unreadNotifications.some(
            (n) => n.id === newNotification.id
          );
          const existsInBroadcasts = oldData.unreadBroadcasts.some(
            (n) => n.id === newNotification.id
          );

          if (existsInNotifications || existsInBroadcasts) {
            return oldData;
          }

          return isBroadcast
            ? {
                ...oldData,
                unreadBroadcasts: [
                  newNotification,
                  ...(oldData.unreadBroadcasts || []),
                ],
              }
            : {
                ...oldData,
                unreadNotifications: [
                  newNotification,
                  ...(oldData.unreadNotifications || []),
                ],
              };
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });
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
