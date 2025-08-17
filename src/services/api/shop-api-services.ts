/**
 * Shop API service module for the college connect application.
 *
 * This module provides HTTP client functionality for shop operations including
 * fetching individual shop details. It handles API communication with proper error handling
 * and type safety for shop-related operations in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch shop details by ID
 * const shop = await shopAPIService.fetchShop({ shop_id: 'shop123' });
 * console.log(`Shop: ${shop.name}`);
 * ```
 *
 * @remarks
 * **Features:**
 * - Shop detail fetching by shop ID
 * - Comprehensive error handling
 * - Type-safe API responses
 * - Axios-based HTTP client integration
 *
 * @see {@link Shop} for shop data structure
 * @see {@link ActionResponse} for API response format
 *
 * @since 1.0.0
 */
import axiosInstance from "@/lib/axios";
import { Shop } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

/**
 * Service class for shop-related API operations.
 *
 * Provides methods to interact with the shop API endpoints, including fetching
 * individual shop details. Implements proper error handling and type safety for all
 * shop operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component for shop details page
 * const ShopDetailsPage = ({ shopId }: { shopId: string }) => {
 *   const [shop, setShop] = useState<Shop | null>(null);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const loadShop = async () => {
 *     try {
 *       setLoading(true);
 *       const fetchedShop = await shopAPIService.fetchShop({ shop_id: shopId });
 *       setShop(fetchedShop);
 *       setError(null);
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : 'Failed to load shop');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   useEffect(() => {
 *     loadShop();
 *   }, [shopId]);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *   if (!shop) return <NotFound />;
 *
 *   return <ShopDetails shop={shop} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in server actions
 * export async function getShopDetails(shopId: string) {
 *   try {
 *     const shop = await shopAPIService.fetchShop({ shop_id: shopId });
 *     return { success: true, data: shop };
 *   } catch (error) {
 *     return { success: false, error: error.message };
 *   }
 * }
 * ```
 *
 * @remarks
 * **API Integration:**
 * - Uses configured axios instance for HTTP requests
 * - Handles ActionResponse wrapper format
 * - Provides consistent error handling across methods
 * - Returns strongly typed shop data
 *
 * **Error Handling:**
 * - Throws descriptive errors for failed requests
 * - Extracts error details from API responses
 * - Provides fallback error messages
 *
 * **Use Cases:**
 * - Shop detail pages and profiles
 * - Shop discovery and browsing
 * - Seller shop management
 * - Shop validation and verification
 *
 * @see {@link fetchShop} for retrieving shop details
 *
 * @since 1.0.0
 */
class ShopAPIService {
  /**
   * Fetches detailed information for a specific shop.
   *
   * Retrieves comprehensive shop details including shop metadata,
   * seller information, and shop configuration. Used for displaying
   * shop profiles and managing shop-specific operations.
   *
   * @example
   * ```typescript
   * // Basic usage
   * const shop = await shopAPIService.fetchShop({ shop_id: 'shop123' });
   * console.log(`Shop: ${shop.name} - ${shop.description}`);
   * ```
   *
   * @example
   * ```typescript
   * // Usage in shop navigation
   * const ShopHeader = ({ shopId }: { shopId: string }) => {
   *   const [shop, setShop] = useState<Shop | null>(null);
   *
   *   useEffect(() => {
   *     const loadShop = async () => {
   *       try {
   *         const shopData = await shopAPIService.fetchShop({ shop_id: shopId });
   *         setShop(shopData);
   *       } catch (error) {
   *         console.error('Failed to load shop header:', error);
   *       }
   *     };
   *
   *     loadShop();
   *   }, [shopId]);
   *
   *   if (!shop) return <HeaderSkeleton />;
   *
   *   return (
   *     <header>
   *       <h1>{shop.name}</h1>
   *       <p>{shop.description}</p>
   *       <img src={shop.logo} alt={`${shop.name} logo`} />
   *     </header>
   *   );
   * };
   * ```
   *
   * @param params - The parameters for fetching shop details
   * @param params.shop_id - The unique identifier of the shop to fetch
   * @returns A promise that resolves to the complete shop data
   *
   * @remarks
   * **API Endpoint:** `GET /shops/{shop_id}`
   *
   * **Response Data:**
   * - Complete shop information (name, description, logo, etc.)
   * - Seller/owner details
   * - Shop configuration and settings
   * - Timestamps for creation and updates
   *
   * **Use Cases:**
   * - Shop detail pages and profiles
   * - Shop verification and validation
   * - Navigation and breadcrumb generation
   * - Shop-specific product listings
   * - Seller dashboard shop management
   *
   * **Shop Information Included:**
   * - Basic details (name, description, logo)
   * - Contact and location information
   * - Business hours and availability
   * - Shop categories and tags
   * - Seller/owner relationship data
   *
   * @throws {Error} When API request fails, shop is not found, or returns invalid data
   *
   * @see {@link Shop} for shop data structure
   * @see {@link ActionResponse} for API response format
   *
   * @since 1.0.0
   */
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    const url = `/shops/${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shop");
    }
    return response.data.data;
  }
}

/**
 * Singleton instance of the ShopAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all shop-related API operations.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import shopAPIService from '@/services/api/shop-api-services';
 *
 * const shop = await shopAPIService.fetchShop({ shop_id: 'shop123' });
 * ```
 *
 * @see {@link ShopAPIService} for available methods
 *
 * @since 1.0.0
 */
const shopAPIService = new ShopAPIService();

export default shopAPIService;
