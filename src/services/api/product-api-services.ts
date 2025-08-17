/**
 * Product API service module for the college connect application.
 *
 * This module provides HTTP client functionality for product operations including
 * fetching shop products with pagination support. It handles API communication
 * with proper error handling and type safety for product-related operations
 * in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch products for a specific shop
 * const products = await productAPIService.fetchShopProducts({
 *   shop_id: 'shop123',
 *   cursor: null
 * });
 *
 * // Fetch next page of products
 * const nextPage = await productAPIService.fetchShopProducts({
 *   shop_id: 'shop123',
 *   cursor: products.nextCursor
 * });
 * ```
 *
 * @remarks
 * **Features:**
 * - Paginated product fetching for shops
 * - Cursor-based pagination support
 * - Comprehensive error handling
 * - Type-safe API responses
 * - Axios-based HTTP client integration
 *
 * @see {@link Product} for product data structure
 * @see {@link PaginatedProductsResponse} for paginated response format
 * @see {@link ActionResponse} for API response format
 *
 * @since 1.0.0
 */
import axiosInstance from "@/lib/axios";
import { Product } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

/**
 * Response interface for paginated product queries.
 *
 * Defines the structure for API responses that return product data with
 * pagination support using cursor-based pagination for efficient data retrieval.
 *
 * @example
 * ```typescript
 * // Handling paginated response
 * const response: PaginatedProductsResponse = await productAPIService.fetchShopProducts({
 *   shop_id: 'shop123',
 *   cursor: null
 * });
 *
 * console.log(`Loaded ${response.data.length} products`);
 * if (response.nextCursor) {
 *   console.log('More products available');
 * }
 * ```
 *
 * @remarks
 * **Pagination Strategy:**
 * - Uses cursor-based pagination for consistent results
 * - Provides nextCursor for loading additional pages
 * - Supports efficient scrolling through large product catalogs
 *
 * @since 1.0.0
 */
interface PaginatedProductsResponse {
  /** Array of product objects for the current page */
  data: Product[];
  /** Cursor for fetching the next page of results, null if no more pages */
  nextCursor: string | null;
}

/**
 * Service class for product-related API operations.
 *
 * Provides methods to interact with the product API endpoints, including fetching
 * shop products with pagination support. Implements proper error handling and
 * type safety for all product operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component with infinite scrolling
 * const ShopProducts = ({ shopId }: { shopId: string }) => {
 *   const [products, setProducts] = useState<Product[]>([]);
 *   const [cursor, setCursor] = useState<string | null>(null);
 *   const [loading, setLoading] = useState(true);
 *
 *   const loadProducts = async (reset = false) => {
 *     try {
 *       const response = await productAPIService.fetchShopProducts({
 *         shop_id: shopId,
 *         cursor: reset ? null : cursor
 *       });
 *
 *       setProducts(prev => reset ? response.data : [...prev, ...response.data]);
 *       setCursor(response.nextCursor);
 *     } catch (error) {
 *       console.error('Failed to load products:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   useEffect(() => {
 *     loadProducts(true);
 *   }, [shopId]);
 *
 *   return (
 *     <ProductGrid
 *       products={products}
 *       onLoadMore={() => cursor && loadProducts()}
 *       hasMore={!!cursor}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in server actions
 * export async function getShopProducts(shopId: string, cursor?: string) {
 *   try {
 *     const response = await productAPIService.fetchShopProducts({
 *       shop_id: shopId,
 *       cursor: cursor || null
 *     });
 *     return { success: true, ...response };
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
 * - Returns strongly typed product data with pagination
 *
 * **Error Handling:**
 * - Throws descriptive errors for failed requests
 * - Extracts error details from API responses
 * - Provides fallback error messages
 *
 * **Performance:**
 * - Implements cursor-based pagination for efficient data loading
 * - Supports infinite scrolling and lazy loading patterns
 * - Optimized for large product catalogs
 *
 * @see {@link fetchShopProducts} for retrieving shop products
 *
 * @since 1.0.0
 */
class ProductAPIService {
  /**
   * Fetches products for a specific shop with pagination support.
   *
   * Retrieves a paginated list of products belonging to a specific shop.
   * Supports cursor-based pagination for efficient data loading and
   * infinite scrolling implementations.
   *
   * @example
   * ```typescript
   * // Fetch first page of products
   * const firstPage = await productAPIService.fetchShopProducts({
   *   shop_id: 'shop123',
   *   cursor: null
   * });
   *
   * console.log(`Loaded ${firstPage.data.length} products`);
   *
   * // Fetch next page if available
   * if (firstPage.nextCursor) {
   *   const secondPage = await productAPIService.fetchShopProducts({
   *     shop_id: 'shop123',
   *     cursor: firstPage.nextCursor
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Implementing infinite scroll
   * const ProductList = ({ shopId }: { shopId: string }) => {
   *   const [products, setProducts] = useState<Product[]>([]);
   *   const [nextCursor, setNextCursor] = useState<string | null>(null);
   *   const [isLoading, setIsLoading] = useState(false);
   *
   *   const loadMoreProducts = useCallback(async () => {
   *     if (isLoading) return;
   *
   *     setIsLoading(true);
   *     try {
   *       const response = await productAPIService.fetchShopProducts({
   *         shop_id: shopId,
   *         cursor: nextCursor
   *       });
   *
   *       setProducts(prev => [...prev, ...response.data]);
   *       setNextCursor(response.nextCursor);
   *     } catch (error) {
   *       console.error('Failed to load more products:', error);
   *     } finally {
   *       setIsLoading(false);
   *     }
   *   }, [shopId, nextCursor, isLoading]);
   *
   *   return (
   *     <InfiniteScroll
   *       hasMore={!!nextCursor}
   *       loadMore={loadMoreProducts}
   *       loading={isLoading}
   *     >
   *       {products.map(product => (
   *         <ProductCard key={product.id} product={product} />
   *       ))}
   *     </InfiniteScroll>
   *   );
   * };
   * ```
   *
   * @param params - The parameters for fetching shop products
   * @param params.shop_id - The unique identifier of the shop
   * @param params.cursor - The pagination cursor for fetching next page (null for first page)
   * @returns A promise that resolves to paginated product data
   *
   * @remarks
   * **API Endpoint:** `GET /shops/{shop_id}/products`
   *
   * **Query Parameters:**
   * - `limit=10` - Fixed page size for consistent loading
   * - `cursor` - Optional cursor for pagination (omitted for first page)
   *
   * **Response Handling:**
   * - Validates response success status
   * - Extracts paginated data from ActionResponse wrapper
   * - Throws error if request fails or data is missing
   *
   * **Use Cases:**
   * - Displaying shop product catalogs
   * - Implementing infinite scroll product lists
   * - Product browsing and discovery features
   * - Shop inventory management interfaces
   *
   * **Pagination Details:**
   * - Uses cursor-based pagination for consistency
   * - Fixed page size of 10 products per request
   * - Returns nextCursor for loading additional pages
   * - Null nextCursor indicates no more products available
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   * @see {@link PaginatedProductsResponse} for returned data structure
   * @see {@link Product} for individual product data structure
   *
   * @since 1.0.0
   */
  async fetchShopProducts({
    shop_id,
    cursor,
  }: {
    shop_id: string;
    cursor: string | null;
  }): Promise<PaginatedProductsResponse> {
    const url = `/shops/${shop_id}/products?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedProductsResponse>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch products");
    }
    return response.data.data;
  }
}

/**
 * Singleton instance of the ProductAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all product-related API operations.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import productAPIService from '@/services/api/product-api-services';
 *
 * const products = await productAPIService.fetchShopProducts({
 *   shop_id: 'shop123',
 *   cursor: null
 * });
 * ```
 *
 * @see {@link ProductAPIService} for available methods
 *
 * @since 1.0.0
 */
const productAPIService = new ProductAPIService();

export default productAPIService;
