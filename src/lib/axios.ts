/**
 * Axios HTTP client configuration module for the college connect application.
 *
 * This module provides a pre-configured axios instance with default settings optimized
 * for API communication with the college connect backend services. It centralizes
 * HTTP client configuration including base URL, headers, and other common settings.
 *
 * @example
 * ```typescript
 * // Basic GET request
 * import axiosInstance from '@/lib/axios';
 *
 * const fetchUserData = async (userId: string) => {
 *   const response = await axiosInstance.get(`/users/${userId}`);
 *   return response.data;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // POST request with data
 * import axiosInstance from '@/lib/axios';
 *
 * const createUser = async (userData: CreateUserRequest) => {
 *   const response = await axiosInstance.post('/users', userData);
 *   return response.data;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Using with error handling
 * import axiosInstance from '@/lib/axios';
 *
 * const fetchWithErrorHandling = async () => {
 *   try {
 *     const response = await axiosInstance.get('/protected-endpoint');
 *     return response.data;
 *   } catch (error) {
 *     console.error('API request failed:', error);
 *     throw error;
 *   }
 * };
 * ```
 *
 * @remarks
 * **Configuration Features:**
 * - **Base URL:** Automatically configured from environment variables
 * - **Content-Type:** Pre-configured for JSON communication
 * - **Centralized Setup:** Single source of truth for HTTP client configuration
 * - **Environment Aware:** Uses NEXT_PUBLIC_API_URL for flexible deployment
 *
 * **Usage Guidelines:**
 * - Import this instance instead of creating new axios instances
 * - Ensure NEXT_PUBLIC_API_URL environment variable is properly set
 * - Add interceptors here for global request/response handling
 * - Use TypeScript generics for type-safe API responses
 *
 * @see {@link https://axios-http.com/docs/instance} Axios Instance Documentation
 * @see {@link https://nextjs.org/docs/app/building-your-application/configuring/environment-variables} Next.js Environment Variables
 *
 * @since 1.0.0
 */
import axios from "axios";

/**
 * Pre-configured axios instance for college connect API communication.
 *
 * A centralized HTTP client instance configured with default settings for
 * communicating with the college connect backend API. This instance provides
 * consistent configuration across the application and serves as the foundation
 * for all API service classes.
 *
 * @example
 * ```typescript
 * // Direct usage for simple requests
 * import axiosInstance from '@/lib/axios';
 *
 * const response = await axiosInstance.get('/health');
 * console.log(response.data);
 * ```
 *
 * @example
 * ```typescript
 * // Usage in API service classes
 * import axiosInstance from '@/lib/axios';
 *
 * class UserAPIService {
 *   async getUser(id: string) {
 *     const response = await axiosInstance.get(`/users/${id}`);
 *     return response.data;
 *   }
 *
 *   async createUser(userData: CreateUserRequest) {
 *     const response = await axiosInstance.post('/users', userData);
 *     return response.data;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe API calls with generics
 * import axiosInstance from '@/lib/axios';
 * import { ApiResponse, User } from '@/types';
 *
 * const fetchUser = async (id: string): Promise<User> => {
 *   const response = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
 *   return response.data.data;
 * };
 * ```
 *
 * @remarks
 * **Default Configuration:**
 * - **Base URL:** Set from `NEXT_PUBLIC_API_URL` environment variable
 * - **Content-Type:** `application/json` for consistent JSON communication
 * - **Timeout:** Uses axios default (no timeout configured)
 * - **Headers:** Minimal default headers for JSON content
 *
 * **Integration Points:**
 * - Used by all API service classes (e.g., CartAPIService, ShopAPIService)
 * - Integrates with React Query for data fetching and caching
 * - Foundation for authenticated requests (can be extended with interceptors)
 *
 * **Extension Possibilities:**
 * - Add request interceptors for authentication tokens
 * - Add response interceptors for global error handling
 * - Configure request/response transformers
 * - Add retry logic for failed requests
 *
 * @see {@link cartAPIService} Example usage in API service classes
 * @see {@link https://axios-http.com/docs/config_defaults} Axios Default Configuration
 *
 * @since 1.0.0
 */
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
