import { Order, User } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { RegisterFormData } from "@/lib/validations/auth";
import { ActionResponse } from "@/types/response.type";

/**
 * Service class for user-related API operations.
 *
 * Provides methods to interact with the user API endpoints, including fetching
 * user orders and registering new users. Implements proper error handling and type safety for all
 * user operations.
 *
 */
class UserAPIService {
  /**
   * Fetches all orders for a specific user.
   *
   * Retrieves a comprehensive list of orders associated with the specified user ID.
   * Used for displaying user order history, tracking purchase patterns, and managing
   * user-specific order operations.
   *
   * @param params - The parameters for fetching user orders
   * @param params.user_id - The unique identifier of the user whose orders to fetch
   * @returns A promise that resolves to an array of user orders
   *
   * @throws {Error} When API request fails, user is not found, or returns invalid data
   *
   */
  async fetchUserOrders({ user_id }: { user_id: string }): Promise<Order[]> {
    const url = `/users/${user_id}/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch user orders");
    }
    return response.data.data;
  }

  /**
   * Registers a new user in the system.
   *
   * Creates a new user account with the provided registration data, including
   * validation, password hashing, and initial user setup. Returns essential
   * user information upon successful registration.
   *
   * @param data - The registration form data containing user information
   * @returns A promise that resolves to essential user data (id, email, name, role)
   *
   * @throws {Error} When registration fails due to validation errors, duplicate email, or server issues
   *
   */
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

const userAPIService = new UserAPIService();

export default userAPIService;
