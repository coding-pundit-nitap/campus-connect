import { Route } from "next";

import {
  BroadcastNotification,
  Notification,
} from "@/../prisma/generated/client";
import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";

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
    const url = `notifications/history`;
    const response = await axiosInstance.get<
      ActionResponse<PaginatedNotificationsResponse>
    >(url, {
      params: {
        limit,
        cursor: cursor || undefined,
      },
    });
    return response.data.data;
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
    const { data } = await axiosInstance.get<
      ActionResponse<NotificationSummaryType>
    >("notifications/summary");
    return data.data;
  }
}

export const notificationAPIService = new NotificationAPIService();
export default notificationAPIService;
