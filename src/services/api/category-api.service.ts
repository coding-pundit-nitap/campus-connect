import axiosInstance from "@/lib/axios";
import { ActionResponse, SearchResult } from "@/types";

class CategoryAPIService {
  async search(query: string): Promise<SearchResult[]> {
    const url = `/shops/categories?q=${encodeURIComponent(query)}`;
    const response =
      await axiosInstance.get<ActionResponse<SearchResult[]>>(url);
    return response.data.data;
  }
}

export const categoryAPIService = new CategoryAPIService();
export default categoryAPIService;
