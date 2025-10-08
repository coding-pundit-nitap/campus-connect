"use client";
import { NotificationType } from "@prisma/client";
import { Bell, Info, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  useMarkNotificationsAsRead,
  useUnreadNotificationCount,
  useUnreadNotifications,
} from "@/hooks/tanstack/useNotifications";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function OrderNotificationBell() {
  useLiveNotifications();

  const { data: unreadData, isLoading } = useUnreadNotifications();
  const { data: unreadCountResponse } = useUnreadNotificationCount();
  const { mutate: markAsRead } = useMarkNotificationsAsRead();

  const unreadCount = unreadCountResponse?.count || 0;

  const allNotifications = useMemo(() => {
    if (!unreadData) return [];
    const combined = [
      ...unreadData.unreadNotifications,
      ...unreadData.unreadBroadcasts,
    ];
    return combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [unreadData]);
  const displayCount = Math.max(unreadCount, allNotifications.length);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "INFO":
        return Info;
      case "SUCCESS":
        return ThumbsUpIcon;
      default:
        return Bell;
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && unreadData) {
      const notification_ids = unreadData.unreadNotifications.map((n) => n.id);
      const broadcast_notification_ids = unreadData.unreadBroadcasts.map(
        (b) => b.id
      );

      if (
        notification_ids.length > 0 ||
        broadcast_notification_ids.length > 0
      ) {
        markAsRead({
          notification_ids,
          broadcast_notification_ids,
        });
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayCount > 99 ? "99+" : displayCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div>Loading...</div>
        ) : allNotifications.length === 0 ? (
          <div className="p-4 text-sm text-center text-muted-foreground">
            No unread notifications.
          </div>
        ) : (
          allNotifications.map((notification) => {
            const Icon = getNotificationIcon(
              notification.type as NotificationType
            );
            return (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-4"
              >
                <Link
                  href={notification.action_url || "#"}
                  className="flex w-full items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {notification.message}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="w-full text-center cursor-pointer"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
