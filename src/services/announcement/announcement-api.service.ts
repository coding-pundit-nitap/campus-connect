import { SerializedAnnouncement } from "@/actions/vendor/announcement-actions";

import { apiGet } from "../api-client";

class AnnouncementAPIService {
  async fetchAnnouncements(
    shopType?: "ALL" | "CANTEEN" | "STATIONERY"
  ): Promise<SerializedAnnouncement[]> {
    return apiGet<SerializedAnnouncement[]>("announcements", {
      params: shopType && shopType !== "ALL" ? { type: shopType } : {},
    });
  }

  async fetchShopAnnouncements(): Promise<
    {
      id: string;
      title: string;
      message: string;
      expires_at: string;
      created_at: string;
      product_name: string | null;
    }[]
  > {
    return apiGet("vendor/announcements");
  }
}

export const announcementAPIService = new AnnouncementAPIService();
export default announcementAPIService;
