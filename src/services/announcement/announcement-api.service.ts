import { SerializedAnnouncement } from "@/actions/vendor/announcement-actions";
import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types";

class AnnouncementAPIService {
  async fetchAnnouncements(): Promise<SerializedAnnouncement[]> {
    const response =
      await axiosInstance.get<ActionResponse<SerializedAnnouncement[]>>(
        "announcements"
      );
    return response.data.data;
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
    const response = await axiosInstance.get<
      ActionResponse<
        {
          id: string;
          title: string;
          message: string;
          expires_at: string;
          created_at: string;
          product_name: string | null;
        }[]
      >
    >("vendor/announcements");
    return response.data.data;
  }
}

export const announcementAPIService = new AnnouncementAPIService();
export default announcementAPIService;
