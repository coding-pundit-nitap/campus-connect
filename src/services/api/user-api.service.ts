import { User } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { OrderWithDetails } from "@/types/order.types";
import { ActionResponse } from "@/types/response.types";
import { RegisterFormData } from "@/validations/auth";

class UserAPIService {
  async fetchUserOrders(): Promise<OrderWithDetails[]> {
    const url = `/users/orders`;
    const response =
      await axiosInstance.get<ActionResponse<OrderWithDetails[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch user orders");
    }
    return response.data.data;
  }

  async registerUser(
    data: RegisterFormData
  ): Promise<Pick<User, "id" | "email" | "name" | "role">> {
    const url = `/auth/register`;
    const response = await axiosInstance.post<
      ActionResponse<Pick<User, "id" | "email" | "name" | "role">>
    >(url, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to register user");
    }
    return response.data.data;
  }
}

export const userAPIService = new UserAPIService();

export default userAPIService;
