import axiosInstance from "@/lib/axios";
import { ActionResponse, SearchResult } from "@/types";

class CategoryAPIService {
  async search(query: string): Promise<SearchResult[]> {
    const url = `shops/categories`;
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

export const categoryAPIService = new CategoryAPIService();
export default categoryAPIService;
