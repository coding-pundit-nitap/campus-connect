import { BroadcastNotification, Notification } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";

export type NotificationSummaryType = {
  unreadNotifications: Notification[];
  unreadBroadcasts: BroadcastNotification[];
  unreadCount: {
    notifications: number;
    broadcasts: number;
    total: number;
  };
};

interface PaginatedNotificationsResponse {
  notifications: Notification[];
  nextCursor?: string;
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
    )
      return;
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
