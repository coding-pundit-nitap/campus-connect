"use client";

import { NotificationType } from "@prisma/client";
import { Bell, Info, Loader2, ThumbsUpIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks";
import { useNotificationHistory } from "@/hooks/tanstack/useNotificationHistory";

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

export default function NotificationHistoryPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationHistory();

  const { lastElementRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  if (status === "pending") {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-9 w-64 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card className="py-4 gap-2" key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-48" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return <div className="text-center p-4">Error loading notifications.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Notification History</h1>
      <div className="space-y-4">
        {data?.pages.map((page, i) => (
          <div className="space-y-4" key={i}>
            {page.notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <Card className="py-4 gap-2" key={notification.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span>{notification.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{notification.message}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
      <div
        ref={lastElementRef}
        className="h-10 flex justify-center items-center mt-4"
      >
        {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin" />}
      </div>
      {!hasNextPage && (
        <div className="text-center text-muted-foreground mt-4">
          No more notifications.
        </div>
      )}
    </div>
  );
}
