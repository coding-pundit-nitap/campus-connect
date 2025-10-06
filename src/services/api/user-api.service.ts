import { User } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { OrderWithDetails } from "@/types/order.types";
import { ActionResponse } from "@/types/response.types";
import { RegisterFormData } from "@/validations/auth";

class UserAPIService {
  async fetchUserOrders(): Promise<OrderWithDetails[]> {
    const url = `users/orders`;
    const response =
      await axiosInstance.get<ActionResponse<OrderWithDetails[]>>(url);
    return response.data.data;
  }

  async registerUser(
    data: RegisterFormData
  ): Promise<Pick<User, "id" | "email" | "name" | "role">> {
    const url = `auth/register`;
    const response = await axiosInstance.post<
      ActionResponse<Pick<User, "id" | "email" | "name" | "role">>
    >(url, data);
    return response.data.data;
  }
}

export const userAPIService = new UserAPIService();

export default userAPIService;
