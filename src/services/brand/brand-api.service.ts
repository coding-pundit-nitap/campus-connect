import { SearchResult } from "@/types";

import { apiGet } from "../api-client";

class BrandAPIService {
  async search(query: string): Promise<SearchResult[]> {
    return apiGet<SearchResult[]>("shops/brand", { params: { q: query } });
  }
}

export const brandAPIService = new BrandAPIService();
export default brandAPIService;
