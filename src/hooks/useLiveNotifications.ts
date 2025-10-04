"use client";

import { Notification } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query-keys";

interface NotificationEvent {
  data: string;
}

export function useLiveNotifications() {
  const queryClient = useQueryClient();
  useEffect(() => {
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
        const newNotification: Notification = JSON.parse(event.data);
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });
        queryClient.setQueryData<Notification[]>(
          queryKeys.notifications.unread,
          (oldData) => {
            if (!oldData) {
              return [newNotification];
            }
            if (oldData.some((n) => n.id === newNotification.id)) {
              return oldData;
            }
            return [newNotification, ...oldData];
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
  }, [queryClient]);
}
