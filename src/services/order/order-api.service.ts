import { OrderStatus } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import {
  ActionResponse,
  CursorPaginatedResponse,
  SerializedOrderWithDetails,
} from "@/types";

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
    const url = `orders`;
    const response = await axiosInstance.get<
      ActionResponse<CursorPaginatedResponse<SerializedOrderWithDetails>>
    >(url, {
      params: {
        limit,
        cursor: cursor || undefined,
        status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      },
    });
    return response.data.data;
  }

  async dounloadInvoice(order_id: string): Promise<Blob> {
    const url = `orders/${order_id}/pdf`;
    const response = await axiosInstance.get<Blob>(url, {
      responseType: "blob",
    });
    return response.data;
  }
}

export const orderAPIService = new OrderAPIService();

export default orderAPIService;
