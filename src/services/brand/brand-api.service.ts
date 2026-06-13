import axiosInstance from "@/lib/axios";
import { ActionResponse, SearchResult } from "@/types";

class BrandAPIService {
  async search(query: string): Promise<SearchResult[]> {
    const url = `shops/brand`;
    const response = await axiosInstance.get<ActionResponse<SearchResult[]>>(
      url,
      {
        params: {
          q: query,
        },
      }
    );
    return response.data.data;
  }
}

export const brandAPIService = new BrandAPIService();
export default brandAPIService;
