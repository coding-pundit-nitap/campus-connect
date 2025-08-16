import axiosInstance from "@/lib/axios";
import { Order, User } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

class UserAPIService {
  async fetchUserOrders({ user_id }: { user_id: string }): Promise<Order[]> {
    const url = `/users/${user_id}/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch user orders");
    }
    return response.data.data;
  }

  async registerUser(data: {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
  }): Promise<Pick<User, "id" | "email" | "name" | "role">> {
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

const userAPIService = new UserAPIService();

export default userAPIService;
