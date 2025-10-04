"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query-keys";

export function useLiveNotifications() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onopen = () => {
      console.log("Connection to notification stream opened.");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (
          payload.type === "new_notification" ||
          payload.type === "new_broadcast"
        ) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.unread,
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount,
          });
        }
      } catch (e) {
        console.error("Error parsing notification:", e);
      }
    };

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
