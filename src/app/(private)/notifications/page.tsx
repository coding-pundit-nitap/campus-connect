"use client";

import {
  Bell,
  CheckCheck,
  Filter,
  Info,
  Loader2,
  ShieldAlert,
  ShieldX,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll, useNotificationHistory } from "@/hooks";
import { useMarkAllNotificationsAsRead } from "@/hooks/queries/useNotifications";
import { cn } from "@/lib/cn";
import { NotificationCategory, NotificationType } from "@/types/prisma.types";

const notificationConfig = {
  INFO: {
    Icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  SUCCESS: {
    Icon: ThumbsUp,
    iconColor: "text-green-500",
    bgColor: "bg-green-500",
  },
  WARNING: {
    Icon: ShieldAlert,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-500",
  },
  ERROR: {
    Icon: ShieldX,
    iconColor: "text-red-500",
    bgColor: "bg-red-500",
  },
  DEFAULT: {
    Icon: Bell,
    iconColor: "text-gray-500",
    bgColor: "bg-gray-500",
  },
};

const categoryLabels: Record<NotificationCategory, string> = {
  GENERAL: "General",
  ORDER: "Orders",
  SYSTEM: "System",
  ANNOUNCEMENT: "Announcements",
};

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case "INFO":
      return notificationConfig.INFO;
    case "SUCCESS":
      return notificationConfig.SUCCESS;
    case "WARNING":
      return notificationConfig.WARNING;
    case "ERROR":
      return notificationConfig.ERROR;
    default:
      return notificationConfig.DEFAULT;
  }
};

export default function NotificationHistoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    NotificationCategory | "ALL"
  >("ALL");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationHistory();

  const { lastElementRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const { mutate: markAllAsRead, isPending } = useMarkAllNotificationsAsRead();

  const allNotifications =
    data?.pages.flatMap((page) => page.notifications) ?? [];

  const notifications =
    selectedCategory === "ALL"
      ? allNotifications
      : allNotifications.filter((n) => n.category === selectedCategory);

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  if (status === "pending") {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-6">
        <Skeleton className="mb-8 h-9 w-64" />
        <div className="relative space-y-8">
          <div className="absolute left-4 top-2 h-full w-0.5 bg-gray-200 dark:bg-gray-800" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="relative flex items-start gap-6">
              <Skeleton className="relative z-10 mt-1 h-8 w-8 shrink-0 rounded-full" />
              <div className="grow space-y-2 pt-1">
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <ShieldX className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">
          Failed to Load Notifications
        </h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (allNotifications.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Bell className="h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">No Notifications Yet</h2>
        <p className="text-muted-foreground">
          We'll let you know when something new comes up.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Notification History
        </h1>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {selectedCategory === "ALL"
                  ? "All"
                  : categoryLabels[selectedCategory]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCategory("ALL")}>
                All Categories
              </DropdownMenuItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() =>
                    setSelectedCategory(key as NotificationCategory)
                  }
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isPending || unreadCount === 0}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark All Read
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {notifications.length === 0 && selectedCategory !== "ALL" ? (
        <div className="flex h-40 flex-col items-center justify-center text-center">
          <Bell className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-muted-foreground">
            No {categoryLabels[selectedCategory].toLowerCase()} notifications.
          </p>
          <Button
            variant="link"
            onClick={() => setSelectedCategory("ALL")}
            className="mt-1"
          >
            View all notifications
          </Button>
        </div>
      ) : (
        <div className="relative space-y-8">
          <div className="absolute left-4 top-2 hidden h-full w-0.5 bg-gray-200 dark:bg-gray-800 sm:block" />

          {notifications.map((notification, index) => {
            const { Icon, iconColor, bgColor } = getNotificationConfig(
              notification.type as NotificationType
            );
            const isLastElement = index === notifications.length - 1;

            return (
              <div
                key={notification.id}
                ref={isLastElement ? lastElementRef : null}
                className="relative flex items-start gap-4 sm:gap-6"
              >
                <div className="relative z-10 flex h-9 shrink-0 items-center justify-center">
                  <span
                    className={cn(
                      "absolute -right-1 -top-1 z-20 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                      bgColor,
                      notification.read && "hidden"
                    )}
                  />
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full bg-background",
                      iconColor
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <Card
                  className={cn(
                    "grow transition-colors",
                    !notification.read && "border-primary/20 bg-muted/40"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        {notification.title}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground capitalize">
                        {notification.category?.toLowerCase()}
                      </span>
                    </div>
                    <CardDescription>
                      {new Date(notification.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <Button variant="link" size="sm" className="mt-2 p-0">
                        <a
                          href={notification.action_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Details
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex h-10 items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin" />}
        {!hasNextPage && !isFetchingNextPage && (
          <div className="text-sm text-muted-foreground">
            You've reached the end.
          </div>
        )}
      </div>
    </div>
  );
}
