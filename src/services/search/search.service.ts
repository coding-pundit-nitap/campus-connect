import { DateRange } from "react-day-picker";

import { OrderStatus } from "@/generated/client";
import { SerializedOrderWithDetails } from "@/types";
import { SearchResult } from "@/types/search.types";

import { apiGet } from "../api-client";

type FetchOrdersParams = {
  query: string;
  status?: OrderStatus;
  dateRange?: DateRange;
  hostelBlock?: string;
  pageParam: string | undefined;
  signal?: AbortSignal;
};

class SearchAPIService {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    return apiGet<SearchResult[]>("search", { params: { q: query }, signal });
  }

  async searchProducts(
    query: string,
    signal?: AbortSignal
  ): Promise<SearchResult[]> {
    return apiGet<SearchResult[]>("search/product", {
      params: { q: query },
      signal,
    });
  }

  async searchOrders({
    query,
    status,
    dateRange,
    hostelBlock,
    pageParam,
    signal,
  }: FetchOrdersParams): Promise<{
    orders: SerializedOrderWithDetails[];
    nextCursor?: string;
  }> {
    return apiGet("search/orders", {
      params: {
        q: query,
        status: status,
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString(),
        cursor: pageParam,
        hostel_block: hostelBlock,
      },
      signal,
    });
  }
}

export const searchAPIService = new SearchAPIService();

export default searchAPIService;
