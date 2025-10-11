import { OrderStatus } from "@prisma/client";
import { DateRange } from "react-day-picker";

import axiosInstance from "@/lib/axios";
import { SerializedOrderWithDetails } from "@/types";
import { ActionResponse } from "@/types/response.types";
import { SearchResult } from "@/types/search.types";

type FetchOrdersParams = {
  query: string;
  status?: OrderStatus;
  dateRange?: DateRange;
  pageParam: string | undefined; // This is the cursor
};

class SearchAPIService {
  async search(query: string): Promise<SearchResult[]> {
    const url = `search`;
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
  async searchProducts(query: string): Promise<SearchResult[]> {
    const url = `search/product`;
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

  async searchOrders({
    query,
    status,
    dateRange,
    pageParam,
  }: FetchOrdersParams): Promise<{
    orders: SerializedOrderWithDetails[];
    nextCursor?: string;
  }> {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (status) params.append("status", status);
    if (dateRange?.from) params.append("from", dateRange.from.toISOString());
    if (dateRange?.to) params.append("to", dateRange.to.toISOString());
    if (pageParam) params.append("cursor", pageParam);

    const url = `search/orders`;
    const response = await axiosInstance.get<
      ActionResponse<{
        orders: SerializedOrderWithDetails[];
        nextCursor?: string;
      }>
    >(url, {
      params: {
        q: query,
        status: status,
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString(),
        cursor: pageParam,
      },
    });
    return response.data.data;
  }
}

export const searchAPIService = new SearchAPIService();

export default searchAPIService;
