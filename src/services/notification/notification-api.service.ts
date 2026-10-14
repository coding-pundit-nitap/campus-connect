import { Route } from "next";

import { BroadcastNotification, Notification } from "@/generated/client";
import axiosInstance from "@/lib/axios";

import { apiGet } from "../api-client";

export type NotificationSummaryType = {
  unreadNotifications: (Omit<Notification, "action_url"> & {
    action_url: Route;
  })[];
  unreadBroadcasts: (Omit<BroadcastNotification, "action_url"> & {
    action_url: Route;
  })[];
  unreadCount: {
    notifications: number;
    broadcasts: number;
    total: number;
  };
};

interface PaginatedNotificationsResponse {
  data: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
  notifications: number;
  broadcasts: number;
}

class NotificationAPIService {
  async fetchNotificationHistory({
    limit = 20,
    cursor,
  }: {
    limit?: number;
    cursor: string | null;
  }): Promise<PaginatedNotificationsResponse> {
    return apiGet<PaginatedNotificationsResponse>("notifications/history", {
      params: { limit, cursor: cursor || undefined },
    });
  }

  async markAsRead(data: {
    notificationIds?: string[];
    broadcastIds?: string[];
  }) {
    if (
      (data.notificationIds?.length ?? 0) === 0 &&
      (data.broadcastIds?.length ?? 0) === 0
    ) {
      return;
    }
    await axiosInstance.patch("notifications/mark-as-read", data);
  }

  async fetchNotificationSummary() {
    return apiGet<NotificationSummaryType>("notifications/summary");
  }

  async subscribePush(subscription: PushSubscriptionJSON | PushSubscription) {
    await axiosInstance.post("notifications/push-subscribe", subscription);
  }

  async unsubscribePush(endpoint: string) {
    await axiosInstance.delete("notifications/push-subscribe", {
      params: { endpoint },
    });
  }
}

export const notificationAPIService = new NotificationAPIService();
export default notificationAPIService;
