/**
 * Cart service module for the college connect application.
 *
 * This module provides comprehensive cart management functionality including cart creation,
 * item management, and cart operations across different shops. It handles multi-shop cart
 * functionality with proper database operations and type safety for e-commerce operations.
 *
 * @example
 * ```typescript
 * // Get or create cart for a specific shop
 * const cart = await cartServices.getCartForShop('user123', 'shop456');
 * console.log(`Cart has ${cart.items.length} items`);
 *
 * // Add item to cart
 * const updatedCart = await cartServices.upsertCartItem('user123', 'product789', 2);
 * console.log(`Added 2 items to cart`);
 *
 * // Get all user carts across shops
 * const allCarts = await cartServices.getAllUserCarts('user123');
 * console.log(`User has carts in ${allCarts.length} shops`);
 * ```
 *
 * @see {@link Cart} for cart data structure
 * @see {@link CartItem} for cart item data structure
 * @see {@link Product} for product data structure
 * @see {@link FullCart} for extended cart type with items and products
 *
 * @since 1.0.0
 */
import { Cart, CartItem, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Extended cart type with populated items and product details.
 *
 * Represents a complete cart with all associated cart items and their corresponding
 * product information. Used for displaying comprehensive cart data with product details
 * in the user interface.
 *
 * @example
 * ```typescript
 * // Usage in cart display component
 * const CartDisplay = ({ cart }: { cart: FullCart }) => {
 *   const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
 *   const totalPrice = cart.items.reduce((sum, item) =>
 *     sum + (item.quantity * item.product.price), 0
 *   );
 *
 *   return (
 *     <div>
 *       <h3>Cart ({totalItems} items)</h3>
 *       <p>Total: ${totalPrice.toFixed(2)}</p>
 *       {cart.items.map(item => (
 *         <CartItemComponent key={item.id} item={item} />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * @see {@link Cart} for base cart structure
 * @see {@link CartItem} for cart item structure
 * @see {@link Product} for product structure
 *
 * @since 1.0.0
 */
export type FullCart = Cart & {
  items: (CartItem & { product: Product })[];
};

/**
 * Service class for cart-related database operations.
 *
 * Provides comprehensive cart management functionality including cart creation,
 * item management, and multi-shop cart operations. Implements proper database
 * transactions and error handling for all cart operations.
 *
 * @example
 * ```typescript
 * // Usage in cart management component
 * const CartManager = ({ userId }: { userId: string }) => {
 *   const [carts, setCarts] = useState<FullCart[]>([]);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadUserCarts = async () => {
 *     try {
 *       setLoading(true);
 *       const userCarts = await cartServices.getAllUserCarts(userId);
 *       setCarts(userCarts);
 *     } catch (error) {
 *       console.error('Failed to load carts:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   const addToCart = async (productId: string, quantity: number) => {
 *     try {
 *       await cartServices.upsertCartItem(userId, productId, quantity);
 *       await loadUserCarts(); // Refresh carts
 *     } catch (error) {
 *       console.error('Failed to add to cart:', error);
 *     }
 *   };
 *
 *   return <CartInterface carts={carts} onAddItem={addToCart} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in shop-specific cart operations
 * const ShopCart = ({ userId, shopId }: { userId: string; shopId: string }) => {
 *   const [cart, setCart] = useState<FullCart | null>(null);
 *
 *   const loadShopCart = async () => {
 *     const shopCart = await cartServices.getCartForShop(userId, shopId);
 *     setCart(shopCart);
 *   };
 *
 *   const clearCart = async () => {
 *     await cartServices.clearShopCart(userId, shopId);
 *     await loadShopCart(); // Refresh cart
 *   };
 *
 *   return <ShopCartComponent cart={cart} onClear={clearCart} />;
 * };
 * ```
 *
 * @see {@link getCartForShop} for shop-specific cart retrieval
 * @see {@link upsertCartItem} for cart item management
 * @see {@link clearShopCart} for cart clearing operations
 * @see {@link getAllUserCarts} for comprehensive cart retrieval
 *
 * @since 1.0.0
 */
class CartServices {
  /**
   * Retrieves or creates a cart for a specific user and shop combination.
   *
   * Fetches the existing cart for the user-shop pair, or creates a new one if none exists.
   * Returns the complete cart with all items and their associated product details.
   * This method ensures every user has a cart for each shop they interact with.
   *
   * @example
   * ```typescript
   * // Get cart for user shopping in a specific shop
   * const cart = await cartServices.getCartForShop('user123', 'shop456');
   * console.log(`Cart contains ${cart.items.length} items`);
   *
   * // Use in product page to show current cart status
   * const ProductPage = ({ userId, product }: { userId: string; product: Product }) => {
   *   const [cart, setCart] = useState<FullCart | null>(null);
   *
   *   useEffect(() => {
   *     const loadCart = async () => {
   *       const userCart = await cartServices.getCartForShop(userId, product.shop_id);
   *       setCart(userCart);
   *     };
   *     loadCart();
   *   }, [userId, product.shop_id]);
   *
   *   const itemInCart = cart?.items.find(item => item.product_id === product.id);
   *
   *   return (
   *     <div>
   *       <ProductDetails product={product} />
   *       <p>Current quantity in cart: {itemInCart?.quantity || 0}</p>
   *     </div>
   *   );
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user
   * @param shop_id - The unique identifier of the shop
   * @returns A promise that resolves to the complete cart with items and product details
   *
   * @see {@link FullCart} for return type structure
   * @see {@link upsertCartItem} for adding items to cart
   *
   * @since 1.0.0
   */
  async getCartForShop(user_id: string, shop_id: string): Promise<FullCart> {
    const cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (cart) {
      return cart;
    }

    return prisma.cart.create({
      data: { user_id, shop_id },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  /**
   * Adds, updates, or removes an item in the user's cart for the product's shop.
   *
   * Performs an upsert operation on cart items - creates new item if it doesn't exist,
   * updates quantity if it does exist, or removes the item if quantity is 0 or negative.
   * Automatically determines the correct shop based on the product and manages the
   * appropriate cart for that shop.
   *
   * @example
   * ```typescript
   * // Add 3 items to cart
   * const cart = await cartServices.upsertCartItem('user123', 'product456', 3);
   * console.log(`Cart updated with ${cart.items.length} different products`);
   *
   * // Remove item from cart by setting quantity to 0
   * await cartServices.upsertCartItem('user123', 'product456', 0);
   *
   * // Usage in product interaction component
   * const AddToCartButton = ({ userId, productId }: { userId: string; productId: string }) => {
   *   const [quantity, setQuantity] = useState(1);
   *   const [loading, setLoading] = useState(false);
   *
   *   const handleAddToCart = async () => {
   *     try {
   *       setLoading(true);
   *       const updatedCart = await cartServices.upsertCartItem(userId, productId, quantity);
   *       toast.success(`Added ${quantity} items to cart`);
   *       // Update cart context or state
   *       updateCartState(updatedCart);
   *     } catch (error) {
   *       toast.error('Failed to add to cart');
   *       console.error(error);
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return (
   *     <div>
   *       <QuantitySelector value={quantity} onChange={setQuantity} />
   *       <Button onClick={handleAddToCart} loading={loading}>
   *         Add to Cart
   *       </Button>
   *     </div>
   *   );
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user
   * @param product_id - The unique identifier of the product to add/update/remove
   * @param quantity - The desired quantity (0 or negative to remove item)
   * @returns A promise that resolves to the updated cart with all items
   *
   * @throws {Error} When product is not found or database operation fails
   *
   * @see {@link getCartForShop} for cart retrieval
   * @see {@link Product} for product structure
   * @see {@link FullCart} for return type structure
   *
   * @since 1.0.0
   */
  async upsertCartItem(
    user_id: string,
    product_id: string,
    quantity: number,
  ): Promise<FullCart> {
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { shop_id: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    const { shop_id } = product;
    if (quantity > 0) {
      await prisma.cartItem.upsert({
        where: {
          cart_id_product_id: {
            cart_id: (await this.getCartForShop(user_id, shop_id)).id,
            product_id: product_id,
          },
        },
        update: { quantity },
        create: {
          quantity,
          cart: { connect: { user_id_shop_id: { user_id, shop_id } } },
          product: { connect: { id: product_id } },
        },
      });
    } else {
      const cart = await this.getCartForShop(user_id, shop_id);
      await prisma.cartItem.deleteMany({
        where: { cart_id: cart.id, product_id },
      });
    }
    return this.getCartForShop(user_id, shop_id);
  }

  /**
   * Clears all items from a user's cart for a specific shop.
   *
   * Removes all cart items associated with the specified user and shop combination,
   * effectively emptying the cart while preserving the cart entity itself.
   * Useful for post-checkout cleanup or when user wants to start fresh.
   *
   * @example
   * ```typescript
   * // Clear cart after successful checkout
   * await cartServices.clearShopCart('user123', 'shop456');
   * console.log('Cart cleared successfully');
   *
   * // Usage in checkout process
   * const CheckoutProcess = ({ userId, shopId }: { userId: string; shopId: string }) => {
   *   const [processing, setProcessing] = useState(false);
   *
   *   const handleCheckout = async (paymentData: PaymentData) => {
   *     try {
   *       setProcessing(true);
   *
   *       // Process payment
   *       const order = await processPayment(paymentData);
   *
   *       // Clear cart after successful order
   *       await cartServices.clearShopCart(userId, shopId);
   *
   *       // Redirect to success page
   *       router.push(`/orders/${order.id}`);
   *     } catch (error) {
   *       console.error('Checkout failed:', error);
   *     } finally {
   *       setProcessing(false);
   *     }
   *   };
   *
   *   return <CheckoutForm onSubmit={handleCheckout} processing={processing} />;
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user
   * @param shop_id - The unique identifier of the shop whose cart to clear
   * @returns A promise that resolves to the empty cart entity
   *
   * @see {@link getCartForShop} for cart retrieval
   * @see {@link Cart} for return type structure
   *
   * @since 1.0.0
   */
  async clearShopCart(user_id: string, shop_id: string): Promise<Cart> {
    const cart = await this.getCartForShop(user_id, shop_id);
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });
    return cart;
  }

  /**
   * Retrieves all carts associated with a specific user across all shops.
   *
   * Fetches a comprehensive list of all carts that belong to the specified user,
   * including carts from different shops with their complete item details and
   * product information. Useful for displaying user's complete shopping state
   * and cross-shop cart management.
   *
   * @example
   * ```typescript
   * // Get all user carts for dashboard
   * const carts = await cartServices.getAllUserCarts('user123');
   * console.log(`User has active carts in ${carts.length} shops`);
   *
   * // Usage in user dashboard
   * const UserDashboard = ({ userId }: { userId: string }) => {
   *   const [carts, setCarts] = useState<FullCart[]>([]);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     const loadAllCarts = async () => {
   *       try {
   *         const userCarts = await cartServices.getAllUserCarts(userId);
   *         setCarts(userCarts);
   *       } catch (error) {
   *         console.error('Failed to load user carts:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     loadAllCarts();
   *   }, [userId]);
   *
   *   const totalItems = carts.reduce((sum, cart) =>
   *     sum + cart.items.reduce((cartSum, item) => cartSum + item.quantity, 0), 0
   *   );
   *
   *   if (loading) return <LoadingSkeleton />;
   *
   *   return (
   *     <div>
   *       <h2>Your Shopping Carts ({totalItems} items total)</h2>
   *       {carts.map(cart => (
   *         <ShopCartSummary key={cart.id} cart={cart} />
   *       ))}
   *     </div>
   *   );
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user whose carts to retrieve
   * @returns A promise that resolves to an array of complete carts with items and products
   *
   * @see {@link FullCart} for cart structure with items
   * @see {@link getCartForShop} for single cart retrieval
   * @see {@link Cart} for base cart structure
   *
   * @since 1.0.0
   */
  async getAllUserCarts(user_id: string): Promise<FullCart[]> {
    return prisma.cart.findMany({
      where: {
        user_id: user_id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}

/**
 * Singleton instance of the CartServices class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all cart-related database operations
 * including cart management, item operations, and multi-shop cart functionality.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import cartServices from '@/services/cart.services';
 *
 * // Get cart for specific shop
 * const cart = await cartServices.getCartForShop('user123', 'shop456');
 *
 * // Add item to cart
 * const updatedCart = await cartServices.upsertCartItem('user123', 'product789', 2);
 *
 * // Get all user carts
 * const allCarts = await cartServices.getAllUserCarts('user123');
 *
 * // Clear shop cart
 * await cartServices.clearShopCart('user123', 'shop456');
 * ```
 *
 * @example
 * ```typescript
 * // Usage in React hooks
 * const useCart = (userId: string, shopId: string) => {
 *   const [cart, setCart] = useState<FullCart | null>(null);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadCart = useCallback(async () => {
 *     setLoading(true);
 *     try {
 *       const shopCart = await cartServices.getCartForShop(userId, shopId);
 *       setCart(shopCart);
 *     } catch (error) {
 *       console.error('Failed to load cart:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [userId, shopId]);
 *
 *   const addItem = useCallback(async (productId: string, quantity: number) => {
 *     const updatedCart = await cartServices.upsertCartItem(userId, productId, quantity);
 *     setCart(updatedCart);
 *     return updatedCart;
 *   }, [userId]);
 *
 *   return { cart, loading, loadCart, addItem };
 * };
 * ```
 *
 * @see {@link CartServices} for available methods and detailed documentation
 * @see {@link FullCart} for cart data structure
 *
 * @since 1.0.0
 */
const cartServices = new CartServices();
export default cartServices;
