import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";
import { SearchResult } from "@/types/search.types";

class SearchAPIService {
  async search(query: string): Promise<SearchResult[]> {
    const url = `search?q=${encodeURIComponent(query)}`;
    const response =
      await axiosInstance.get<ActionResponse<SearchResult[]>>(url);
    return response.data.data;
  }
  async searchProducts(query: string): Promise<SearchResult[]> {
    const url = `search/product?q=${encodeURIComponent(query)}`;
    const response =
      await axiosInstance.get<ActionResponse<SearchResult[]>>(url);
    return response.data.data;
  }
}

export const searchAPIService = new SearchAPIService();

export default searchAPIService;
