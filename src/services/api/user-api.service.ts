import { User } from "@prisma/client";
import { z } from "zod";

import axiosInstance from "@/lib/axios";
import { registerSchema } from "@/validations";
import { updateUserSchema } from "@/validations/user.validation";

class UserAPIService {
  async getMe(): Promise<User> {
    const response = await axiosInstance.get("/user/me");
    return response.data;
  }

  async updateMe(data: z.infer<typeof updateUserSchema>): Promise<User> {
    const response = await axiosInstance.put("/user/me", data);
    return response.data;
  }

  async registerUser(data: z.infer<typeof registerSchema>): Promise<User> {
    const response = await axiosInstance.post<User>("/auth/register", data);
    return response.data;
  }
}

export const userAPIService = new UserAPIService();
