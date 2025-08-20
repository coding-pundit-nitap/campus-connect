/**
 * User API service module for the college connect application.
 *
 * This module provides HTTP client functionality for user operations including
 * fetching user orders and user registration. It handles API communication with proper error handling
 * and type safety for user-related operations in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch all orders for a specific user
 * const orders = await userAPIService.fetchUserOrders({ user_id: 'user123' });
 * console.log(`Found ${orders.length} orders`);
 *
 * // Register a new user
 * const userData = { name: 'John Doe', email: 'john@example.com', password: 'securepass', role: 'STUDENT' };
 * const user = await userAPIService.registerUser(userData);
 * console.log(`Registered user: ${user.name}`);
 * ```
 *
 * @see {@link Order} for order data structure
 * @see {@link User} for user data structure
 * @see {@link RegisterFormData} for registration form data
 * @see {@link ActionResponse} for API response format
 *
 * @since 1.0.0
 */
import axiosInstance from "@/lib/axios";
import { Order, User } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";
import { RegisterFormData } from "@/lib/validations/auth";

/**
 * Service class for user-related API operations.
 *
 * Provides methods to interact with the user API endpoints, including fetching
 * user orders and registering new users. Implements proper error handling and type safety for all
 * user operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component for user profile/orders
 * const UserOrdersPage = ({ userId }: { userId: string }) => {
 *   const [orders, setOrders] = useState<Order[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const loadOrders = async () => {
 *     try {
 *       setLoading(true);
 *       const fetchedOrders = await userAPIService.fetchUserOrders({ user_id: userId });
 *       setOrders(fetchedOrders);
 *       setError(null);
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : 'Failed to load orders');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   useEffect(() => {
 *     loadOrders();
 *   }, [userId]);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return <OrdersList orders={orders} onRefresh={loadOrders} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in registration form
 * const RegistrationForm = () => {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const handleSubmit = async (formData: RegisterFormData) => {
 *     try {
 *       setLoading(true);
 *       const user = await userAPIService.registerUser(formData);
 *       // Redirect to login or dashboard
 *       router.push('/dashboard');
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : 'Registration failed');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return <RegistrationFormComponent onSubmit={handleSubmit} loading={loading} error={error} />;
 * };
 * ```
 *
 * @see {@link fetchUserOrders} for retrieving user orders
 * @see {@link registerUser} for user registration
 *
 * @since 1.0.0
 */
class UserAPIService {
  /**
   * Fetches all orders for a specific user.
   *
   * Retrieves a comprehensive list of orders associated with the specified user ID.
   * Used for displaying user order history, tracking purchase patterns, and managing
   * user-specific order operations.
   *
   * @example
   * ```typescript
   * // Basic usage
   * const orders = await userAPIService.fetchUserOrders({ user_id: 'user123' });
   * console.log(`User has ${orders.length} orders`);
   * ```
   *
   * @example
   * ```typescript
   * // Usage in user dashboard
   * const UserDashboard = ({ userId }: { userId: string }) => {
   *   const [orders, setOrders] = useState<Order[]>([]);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     const loadUserOrders = async () => {
   *       try {
   *         const userOrders = await userAPIService.fetchUserOrders({ user_id: userId });
   *         setOrders(userOrders);
   *       } catch (error) {
   *         console.error('Failed to load user orders:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     loadUserOrders();
   *   }, [userId]);
   *
   *   if (loading) return <DashboardSkeleton />;
   *
   *   return (
   *     <div>
   *       <h2>Your Orders ({orders.length})</h2>
   *       <OrderTimeline orders={orders} />
   *     </div>
   *   );
   * };
   * ```
   *
   * @param params - The parameters for fetching user orders
   * @param params.user_id - The unique identifier of the user whose orders to fetch
   * @returns A promise that resolves to an array of user orders
   *
   * @throws {Error} When API request fails, user is not found, or returns invalid data
   *
   * @see {@link Order} for order data structure
   * @see {@link ActionResponse} for API response format
   *
   * @since 1.0.0
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
   * @example
   * ```typescript
   * // Basic registration
   * const formData = {
   *   name: 'John Doe',
   *   email: 'john@college.edu',
   *   password: 'securePassword123',
   *   role: 'STUDENT'
   * };
   * const user = await userAPIService.registerUser(formData);
   * console.log(`Welcome ${user.name}! Your ID is ${user.id}`);
   * ```
   *
   * @example
   * ```typescript
   * // Usage in registration flow
   * const handleRegistration = async (formData: RegisterFormData) => {
   *   try {
   *     setLoading(true);
   *     const newUser = await userAPIService.registerUser(formData);
   *
   *     // Store user session or redirect
   *     setAuthUser(newUser);
   *     toast.success(`Welcome ${newUser.name}!`);
   *     router.push('/dashboard');
   *   } catch (error) {
   *     if (error.message.includes('email')) {
   *       setFieldError('email', 'Email already exists');
   *     } else {
   *       toast.error('Registration failed. Please try again.');
   *     }
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   * ```
   *
   * @param data - The registration form data containing user information
   * @returns A promise that resolves to essential user data (id, email, name, role)
   *
   * @throws {Error} When registration fails due to validation errors, duplicate email, or server issues
   *
   * @see {@link RegisterFormData} for registration form data structure
   * @see {@link User} for complete user data structure
   * @see {@link ActionResponse} for API response format
   *
   * @since 1.0.0
   */
  async registerUser(
    data: RegisterFormData,
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

/**
 * Singleton instance of the UserAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all user-related API operations including
 * order management and user registration.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import userAPIService from '@/services/api/user-api-services';
 *
 * // Fetch user orders
 * const orders = await userAPIService.fetchUserOrders({ user_id: 'user123' });
 *
 * // Register new user
 * const user = await userAPIService.registerUser(registrationData);
 * ```
 *
 * @see {@link UserAPIService} for available methods
 *
 * @since 1.0.0
 */
const userAPIService = new UserAPIService();

export default userAPIService;
