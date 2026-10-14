import { OrderStatus } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import { CursorPaginatedResponse, SerializedOrderWithDetails } from "@/types";

import { apiGet } from "../api-client";

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface FetchOrdersParams extends OrderFilters {
  limit?: number;
  cursor?: string | null;
}

class OrderAPIService {
  async fetchUserOrders({
    limit = 10,
    cursor,
    status,
    dateFrom,
    dateTo,
  }: FetchOrdersParams): Promise<
    CursorPaginatedResponse<SerializedOrderWithDetails>
  > {
    return apiGet<CursorPaginatedResponse<SerializedOrderWithDetails>>(
      "orders",
      {
        params: {
          limit,
          cursor: cursor || undefined,
          status: status || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      }
    );
  }

  async dounloadInvoice(order_id: string): Promise<Blob> {
    const url = `orders/${order_id}/pdf`;
    const response = await axiosInstance.get<Blob>(url, {
      responseType: "blob",
    });
    return response.data;
  }

  async fetchOrderById(order_id: string): Promise<SerializedOrderWithDetails> {
    return apiGet<SerializedOrderWithDetails>(`orders/${order_id}`);
  }
}

export const orderAPIService = new OrderAPIService();

export default orderAPIService;
