/**
 * Cart API service module for the college connect application.
 *
 * This module provides HTTP client functionality for cart operations including
 * fetching cart data for specific shops and updating cart items. It handles
 * API communication with proper error handling and type safety for cart-related
 * operations in the e-commerce functionality.
 *
 * @example
 * ```typescript
 * // Fetch cart for a specific shop
 * const cart = await cartAPIService.fetchCartForShop('shop123');
 *
 * // Add or update item in cart
 * const updatedCart = await cartAPIService.upsertCartItem('product456', 2);
 * ```
 *
 * @see {@link FullCart} for cart data structure
 * @see {@link ActionResponse} for API response format
 *
 * @since 1.0.0
 */
import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.type";
import { FullCart } from "../cart.services";

/**
 * Service class for cart-related API operations.
 *
 * Provides methods to interact with the cart API endpoints, including fetching
 * cart data for specific shops and managing cart items. Implements proper error
 * handling and type safety for all cart operations.
 *
 * @example
 * ```typescript
 * // Usage in a React component
 * const ShopCart = ({ shopId }: { shopId: string }) => {
 *   const [cart, setCart] = useState<FullCart | null>(null);
 *
 *   useEffect(() => {
 *     cartAPIService.fetchCartForShop(shopId)
 *       .then(setCart)
 *       .catch(console.error);
 *   }, [shopId]);
 *
 *   return <CartDisplay cart={cart} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in server actions
 * export async function addToCart(productId: string, quantity: number) {
 *   try {
 *     const updatedCart = await cartAPIService.upsertCartItem(productId, quantity);
 *     return { success: true, cart: updatedCart };
 *   } catch (error) {
 *     return { success: false, error: error.message };
 *   }
 * }
 * ```
 *
 * @see {@link fetchCartForShop} for retrieving cart data
 * @see {@link upsertCartItem} for cart item management
 *
 * @since 1.0.0
 */
class CartAPIService {
  /**
   * Fetches the cart data for a specific shop.
   *
   * Retrieves the complete cart information including all items, quantities,
   * and pricing details for a given shop. Used to display current cart state
   * and calculate totals for checkout processes.
   *
   * @example
   * ```typescript
   * // Fetch cart in a shop page
   * const ShopPage = ({ shopId }: { shopId: string }) => {
   *   const [cart, setCart] = useState<FullCart | null>(null);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     cartAPIService.fetchCartForShop(shopId)
   *       .then(cart => {
   *         setCart(cart);
   *         setLoading(false);
   *       })
   *       .catch(error => {
   *         console.error('Failed to load cart:', error);
   *         setLoading(false);
   *       });
   *   }, [shopId]);
   *
   *   if (loading) return <CartSkeleton />;
   *   return <CartComponent cart={cart} />;
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop to fetch cart for
   * @returns A promise that resolves to the complete cart data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   * @see {@link FullCart} for returned data structure
   * @see {@link upsertCartItem} for modifying cart contents
   *
   * @since 1.0.0
   */
  async fetchCartForShop(shop_id: string): Promise<FullCart> {
    const url = `/cart?shop_id=${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<FullCart>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch cart");
    }
    return response.data.data;
  }

  /**
   * Adds a new item to the cart or updates the quantity of an existing item.
   *
   * Performs an upsert operation on cart items - if the product already exists
   * in the cart, updates its quantity; otherwise, adds it as a new item.
   * Returns the updated cart state after the operation.
   *
   * @example
   * ```typescript
   * // Add item to cart
   * const AddToCartButton = ({ productId }: { productId: string }) => {
   *   const [loading, setLoading] = useState(false);
   *
   *   const handleAddToCart = async () => {
   *     setLoading(true);
   *     try {
   *       const updatedCart = await cartAPIService.upsertCartItem(productId, 1);
   *       toast.success('Item added to cart');
   *       updateCartState(updatedCart);
   *     } catch (error) {
   *       toast.error('Failed to add item to cart');
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return (
   *     <button onClick={handleAddToCart} disabled={loading}>
   *       {loading ? 'Adding...' : 'Add to Cart'}
   *     </button>
   *   );
   * };
   * ```
   *
   * @example
   * ```typescript
   * // Update item quantity
   * const updateQuantity = async (productId: string, newQuantity: number) => {
   *   if (newQuantity <= 0) {
   *     // Remove item by setting quantity to 0
   *     await cartAPIService.upsertCartItem(productId, 0);
   *   } else {
   *     // Update to new quantity
   *     await cartAPIService.upsertCartItem(productId, newQuantity);
   *   }
   * };
   * ```
   *
   * @param product_id - The unique identifier of the product to add/update
   * @param quantity - The quantity to set (0 to remove item)
   * @returns A promise that resolves to the updated cart data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   * @see {@link FullCart} for returned data structure
   * @see {@link fetchCartForShop} for retrieving current cart state
   *
   * @since 1.0.0
   */
  async upsertCartItem(
    product_id: string,
    quantity: number,
  ): Promise<FullCart> {
    const url = `/cart`;
    const response = await axiosInstance.post<ActionResponse<FullCart>>(url, {
      product_id,
      quantity,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to update cart");
    }
    return response.data.data;
  }
}

/**
 * Singleton instance of the CartAPIService.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all cart-related API operations.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import cartAPIService from '@/services/api/cart-api-services';
 *
 * const cart = await cartAPIService.fetchCartForShop('shop123');
 * ```
 *
 * @see {@link CartAPIService} for available methods
 *
 * @since 1.0.0
 */
const cartAPIService = new CartAPIService();

export default cartAPIService;
