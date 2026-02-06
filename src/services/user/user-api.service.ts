import { z } from "zod";

import { User } from "@/../prisma/generated/client";
import axiosInstance from "@/lib/axios";
import { updateUserSchema } from "@/validations/user.validation";

class UserAPIService {
  async getMe(): Promise<User> {
    const response = await axiosInstance.get<User>("/user/me");
    return response.data;
  }

  async updateMe(data: z.infer<typeof updateUserSchema>): Promise<User> {
    const response = await axiosInstance.put<User>("/user/me", data);
    return response.data;
  }
}

export const userAPIService = new UserAPIService();
