import { BroadcastNotification, Notification } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";

interface PaginatedNotificationsResponse {
  notifications: Notification[];
  nextCursor?: string;
}

interface UnreadCountResponse {
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
    const url = `notifications/history?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedNotificationsResponse>>(
        url
      );
    return response.data.data;
  }

  async fetchUnreadCount(): Promise<UnreadCountResponse> {
    const url = `notifications/unread-count`;
    const response =
      await axiosInstance.get<ActionResponse<UnreadCountResponse>>(url);
    return response.data.data;
  }

  async markNotificationsAsRead(ids: {
    notification_ids?: string[];
    broadcast_notification_ids?: string[];
  }) {
    const { data } = await axiosInstance.patch<ActionResponse<null>>(
      "notifications",
      ids
    );
    return data.data;
  }
  async fetchUnreadNotifications() {
    const { data } = await axiosInstance.get<
      ActionResponse<{
        unreadNotifications: Notification[];
        unreadBroadcasts: BroadcastNotification[];
      }>
    >("notifications/unread");
    return data.data;
  }
}

export const notificationAPIService = new NotificationAPIService();
export default notificationAPIService;
