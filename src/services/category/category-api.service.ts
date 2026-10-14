import { SearchResult } from "@/types";

import { apiGet } from "../api-client";

class CategoryAPIService {
  async search(query: string): Promise<SearchResult[]> {
    return apiGet<SearchResult[]>("shops/category", { params: { q: query } });
  }
}

export const categoryAPIService = new CategoryAPIService();
export default categoryAPIService;
