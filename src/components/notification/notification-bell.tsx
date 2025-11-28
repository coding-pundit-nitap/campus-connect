"use client";

import { Bell, Info, ShieldAlert, ShieldX, ThumbsUp } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import {
  useLiveNotifications,
  useMarkNotificationsAsRead,
  useNotificationSummary,
} from "@/hooks";
import { cn } from "@/lib/cn";
import { NotificationType } from "@/types/prisma.types";

import { Avatar, AvatarFallback } from "../ui/avatar";
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
import { Skeleton } from "../ui/skeleton";

const notificationConfig = {
  INFO: { Icon: Info, className: "text-blue-500" },
  SUCCESS: { Icon: ThumbsUp, className: "text-green-500" },
  WARNING: { Icon: ShieldAlert, className: "text-yellow-500" },
  ERROR: { Icon: ShieldX, className: "text-red-500" },
  DEFAULT: { Icon: Bell, className: "text-gray-500" },
};

const getNotificationConfig = (type?: NotificationType) => {
  if (!type) {
    return notificationConfig.DEFAULT;
  }
  return notificationConfig[type] || notificationConfig.DEFAULT;
};

export function OrderNotificationBell() {
  useLiveNotifications();
  const { data, isLoading } = useNotificationSummary();
  const { mutate: markAsRead } = useMarkNotificationsAsRead();

  const unreadCount = data?.unreadCount.total || 0;

  const allNotifications = useMemo(() => {
    if (!data?.unreadNotifications && !data?.unreadBroadcasts) {
      return [];
    }
    if (!data?.unreadNotifications) {
      return data.unreadBroadcasts;
    }
    if (!data?.unreadBroadcasts) {
      return data.unreadNotifications;
    }
    const combined = [...data.unreadNotifications, ...data.unreadBroadcasts];
    return combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data]);

  const displayCount = Math.max(unreadCount, allNotifications.length);

  const handleOpenChange = (open: boolean) => {
    if (!open && data) {
      const notification_ids = data.unreadNotifications.map((n) => n.id);
      const broadcast_notification_ids = data.unreadBroadcasts.map((b) => b.id);

      if (
        notification_ids.length > 0 ||
        broadcast_notification_ids.length > 0
      ) {
        markAsRead({
          notificationIds: notification_ids,
          broadcastIds: broadcast_notification_ids,
        });
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {displayCount > 9 ? "9+" : displayCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex items-center justify-between p-3">
          <span className="font-semibold">Notifications</span>
          {displayCount > 0 && (
            <Badge variant="secondary">{displayCount} New</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            // Enhanced Skeleton Loader
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="grow space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-1/4" />
                </div>
              </div>
            ))
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground">
                You have no new notifications.
              </p>
            </div>
          ) : (
            // Styled Notification List
            allNotifications.map((notification) => {
              const { Icon, className } = getNotificationConfig(
                notification.type as NotificationType
              );
              return (
                <DropdownMenuItem key={notification.id} className="p-0">
                  <Link
                    href={notification.action_url || ("#" as Route)}
                    className="flex w-full items-start gap-3 p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={cn("bg-transparent", className)}
                      >
                        <Icon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grow">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="flex w-full cursor-pointer items-center justify-center p-3 text-sm font-medium text-primary"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
