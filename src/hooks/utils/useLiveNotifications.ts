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
const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

export function useLiveNotifications() {
  const session = useSession();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastTimeRef = useRef(0);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

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

    let lastPingAt = Date.now();

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = lastEventIdRef.current
        ? `/api/notifications/stream?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`
        : `/api/notifications/stream`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        retryCountRef.current = 0;
        lastPingAt = Date.now();
      };

      eventSource.addEventListener("new_notification", (event) => {
        if (event.lastEventId) lastEventIdRef.current = event.lastEventId;
        handleNewNotification(event);
      });
      eventSource.addEventListener("new_broadcast", (event) => {
        if (event.lastEventId) lastEventIdRef.current = event.lastEventId;
        handleNewNotification(event);
      });
      eventSource.addEventListener("ping", () => {
        lastPingAt = Date.now();
      });

      watchdogRef.current = setInterval(() => {
        if (Date.now() - lastPingAt > SSE_HEARTBEAT_INTERVAL_MS * 2) {
          eventSource.close();
          eventSourceRef.current = null;
          if (watchdogRef.current) {
            clearInterval(watchdogRef.current);
          }
          connect();
        }
      }, SSE_HEARTBEAT_INTERVAL_MS);

      eventSource.onerror = () => {
        if (watchdogRef.current) {
          clearInterval(watchdogRef.current);
        }
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
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
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
