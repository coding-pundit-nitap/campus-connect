import { User } from "@prisma/client";
import { z } from "zod";

import axiosInstance from "@/lib/axios";
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

  async registerUser(data: any): Promise<any> {
    const response = await axiosInstance.post("/auth/register", data);
    return response.data;
  }
}

export const userAPIService = new UserAPIService();
