"use client";

import { NotificationType } from "@prisma/client";
import {
  Bell,
  Info,
  Loader2,
  ShieldAlert,
  ShieldX,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks";
import { useNotificationHistory } from "@/hooks/tanstack/useNotificationHistory";
import { cn } from "@/lib/utils";

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

// --- Main Page Component ---

export default function NotificationHistoryPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationHistory();

  const { lastElementRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  if (status === "pending") {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-6">
        <Skeleton className="mb-8 h-9 w-64" />
        <div className="relative space-y-8">
          {/* Timeline Line */}
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

  // Enhanced Error State
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

  // Enhanced Empty State
  if (notifications.length === 0) {
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
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        Notification History
      </h1>

      <div className="relative space-y-8">
        <div className="absolute left-4 top-2 hidden h-full w-0.5 bg-gray-200 dark:bg-gray-800 sm:block" />

        {notifications.map((notification, index) => {
          const { Icon, iconColor, bgColor } = getNotificationConfig(
            notification.type
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
                  <CardTitle className="text-base font-semibold">
                    {notification.title}
                  </CardTitle>
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
