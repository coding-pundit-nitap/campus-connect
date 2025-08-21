import { Cart, CartItem, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Extended cart type with populated items and product details.
 *
 * Represents a complete cart with all associated cart items and their corresponding
 * product information. Used for displaying comprehensive cart data with product details
 * in the user interface.
 *
 */
export type FullCart = Cart & {
  items: (CartItem & {
    product: Pick<
      Product,
      "name" | "price" | "description" | "image_url" | "shop_id" | "discount"
    > & {
      shop: {
        name: string;
      };
    };
  })[];
};

/**
 * Service class for cart-related database operations.
 *
 * Provides comprehensive cart management functionality including cart creation,
 * item management, and multi-shop cart operations. Implements proper database
 * transactions and error handling for all cart operations.
 *
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
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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
  async getAllUserCarts(): Promise<FullCart[]> {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) throw new Error("User not authenticated");

    return prisma.cart.findMany({
      where: {
        user_id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

const cartServices = new CartServices();
export default cartServices;
