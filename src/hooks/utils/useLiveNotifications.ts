"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { NotificationSummaryType } from "@/services/notification";
import { BroadcastNotification, Notification } from "@/types/prisma.types";

interface NotificationEvent {
  data: string;
}

const MAX_RETRY_DELAY = 30000;
const INITIAL_RETRY_DELAY = 1000;
const TOAST_THROTTLE_MS = 5000;

export function useLiveNotifications() {
  const session = useSession();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastTimeRef = useRef(0);

  const isAuthenticated = !!session.data;

  const handleNewNotification = useCallback(
    (event: NotificationEvent): void => {
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

            const now = Date.now();
            if (now - lastToastTimeRef.current >= TOAST_THROTTLE_MS) {
              toast.success(newNotification.message);
              lastToastTimeRef.current = now;
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
      } catch {}
    },
    [queryClient]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        retryCountRef.current = 0;
      };

      eventSource.addEventListener("new_notification", handleNewNotification);
      eventSource.addEventListener("new_broadcast", handleNewNotification);

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
          MAX_RETRY_DELAY
        );
        retryCountRef.current += 1;

        retryTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, handleNewNotification]);
}
