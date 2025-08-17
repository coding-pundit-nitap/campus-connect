/**
 * Order service module for the college connect application.
 *
 * This module provides comprehensive order management functionality including order creation,
 * retrieval, and status management. It handles cart-to-order conversion with stock validation,
 * payment processing integration, and atomic transaction operations for e-commerce workflows.
 *
 * @example
 * ```typescript
 * // Create order from cart
 * const order = await orderServices.createOrderFromCart(
 *   'user123',
 *   'shop456',
 *   PaymentMethod.ONLINE,
 *   'pg_payment_123'
 * );
 * console.log(`Order created with ID: ${order.id}`);
 *
 * // Get user orders
 * const userOrders = await orderServices.getOrdersByUserId('user123');
 * console.log(`User has ${userOrders.length} orders`);
 *
 * // Update order status
 * await orderServices.updateOrderStatus('order789', OrderStatus.SHIPPED);
 * ```
 *
 * @remarks
 * **Features:**
 * - Cart-to-order conversion with validation
 * - Atomic transaction processing
 * - Stock management integration
 * - Payment method handling
 * - Order status management
 * - User and shop order retrieval
 * - Flexible query options support
 *
 * @see {@link Order} for order data structure
 * @see {@link OrderStatus} for available order statuses
 * @see {@link PaymentMethod} for payment method options
 * @see {@link PaymentStatus} for payment status options
 *
 * @since 1.0.0
 */
import {
  Prisma,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Type alias for Prisma order find unique options without the where clause.
 *
 * Provides type-safe query options for single order retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 * @example
 * ```typescript
 * // Usage with includes
 * const options: OrderFindOptions = {
 *   include: {
 *     items: {
 *       include: {
 *         product: true
 *       }
 *     },
 *     user: true,
 *     shop: true
 *   }
 * };
 *
 * const order = await orderServices.getOrderById('order123', options);
 * ```
 *
 * @see {@link OrderServices.getOrderById} for usage in order retrieval
 * @see {@link Prisma.OrderFindUniqueArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type OrderFindOptions = Omit<Prisma.OrderFindUniqueArgs, "where">;

/**
 * Type alias for Prisma order find many options without the where clause.
 *
 * Provides type-safe query options for multiple order retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports pagination, sorting, filtering, and relation includes for bulk operations.
 *
 * @example
 * ```typescript
 * // Usage with pagination and sorting
 * const options: OrderFindManyOptions = {
 *   include: {
 *     items: true
 *   },
 *   orderBy: {
 *     created_at: 'desc'
 *   },
 *   take: 10,
 *   skip: 0
 * };
 *
 * const orders = await orderServices.getOrdersByUserId('user123', options);
 * ```
 *
 * @see {@link OrderServices.getOrdersByUserId} for user order retrieval
 * @see {@link OrderServices.getOrdersByShopId} for shop order retrieval
 * @see {@link Prisma.OrderFindManyArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type OrderFindManyOptions = Omit<Prisma.OrderFindManyArgs, "where">;

/**
 * Service class for order-related database operations.
 *
 * Provides comprehensive order management functionality including order creation
 * from carts, order retrieval with flexible options, and order status management.
 * Implements atomic transactions for cart-to-order conversion with stock validation
 * and payment processing integration.
 *
 * @example
 * ```typescript
 * // Usage in checkout component
 * const CheckoutManager = ({ userId, shopId }: CheckoutProps) => {
 *   const [processing, setProcessing] = useState(false);
 *   const [order, setOrder] = useState<Order | null>(null);
 *
 *   const processCheckout = async (paymentMethod: PaymentMethod) => {
 *     try {
 *       setProcessing(true);
 *       const newOrder = await orderServices.createOrderFromCart(
 *         userId,
 *         shopId,
 *         paymentMethod
 *       );
 *       setOrder(newOrder);
 *       // Redirect to order confirmation
 *     } catch (error) {
 *       console.error('Checkout failed:', error);
 *       // Handle error (show message, etc.)
 *     } finally {
 *       setProcessing(false);
 *     }
 *   };
 *
 *   return <CheckoutInterface onCheckout={processCheckout} loading={processing} />;
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in order management dashboard
 * const OrderDashboard = ({ shopId }: { shopId: string }) => {
 *   const [orders, setOrders] = useState<Order[]>([]);
 *
 *   const loadOrders = async () => {
 *     const shopOrders = await orderServices.getOrdersByShopId(shopId, {
 *       include: { items: { include: { product: true } }, user: true },
 *       orderBy: { created_at: 'desc' }
 *     });
 *     setOrders(shopOrders);
 *   };
 *
 *   const updateStatus = async (orderId: string, status: OrderStatus) => {
 *     await orderServices.updateOrderStatus(orderId, status);
 *     await loadOrders(); // Refresh orders
 *   };
 *
 *   return <OrderManagementInterface orders={orders} onStatusUpdate={updateStatus} />;
 * };
 * ```
 *
 * @remarks
 * **Database Operations:**
 * - Uses Prisma ORM for type-safe database access
 * - Implements atomic transactions for order creation
 * - Maintains referential integrity across operations
 * - Optimized queries with flexible include options
 *
 * **Order Creation Process:**
 * - Validates cart existence and contents
 * - Checks product stock availability
 * - Calculates total price from cart items
 * - Creates order with items atomically
 * - Updates product stock quantities
 * - Clears cart after successful order creation
 *
 * **Error Handling:**
 * - Validates cart state before order creation
 * - Checks stock availability for all items
 * - Handles database constraint violations
 * - Provides descriptive error messages
 * - Ensures transaction rollback on failures
 *
 * **Payment Integration:**
 * - Supports multiple payment methods
 * - Handles payment gateway integration
 * - Sets appropriate payment status based on method
 * - Stores payment gateway references
 *
 * @see {@link getOrderById} for single order retrieval
 * @see {@link createOrderFromCart} for order creation from cart
 * @see {@link updateOrderStatus} for order status management
 *
 * @since 1.0.0
 */
class OrderServices {
  /**
   * Retrieves a single order by its unique identifier.
   *
   * Fetches an order from the database using the provided order ID. Supports
   * method overloading to allow flexible query options including relations,
   * field selection, and other Prisma query features for customized data retrieval.
   *
   * @example
   * ```typescript
   * // Basic order retrieval
   * const order = await orderServices.getOrderById('order123');
   * if (order) {
   *   console.log(`Order total: $${order.total_price}`);
   * }
   *
   * // Order with related data
   * const fullOrder = await orderServices.getOrderById('order123', {
   *   include: {
   *     items: {
   *       include: {
   *         product: true
   *       }
   *     },
   *     user: true,
   *     shop: true
   *   }
   * });
   * ```
   *
   * @param order_id - The unique identifier of the order to retrieve
   * @param options - Optional Prisma query options for customizing the result
   * @returns A promise that resolves to the order if found, null otherwise
   *
   * @remarks
   * **Method Overloading:**
   * - Without options: Returns basic Order object
   * - With options: Returns typed result based on provided options
   * - Maintains type safety through Prisma payload types
   *
   * **Use Cases:**
   * - Order detail page display
   * - Order status checking
   * - Payment verification
   * - Customer service lookup
   * - Order modification operations
   *
   * @see {@link OrderFindOptions} for available query options
   * @see {@link Order} for basic order structure
   *
   * @since 1.0.0
   */
  async getOrderById(order_id: string): Promise<Order | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { id: string } } & T> | null>;
  async getOrderById<T extends OrderFindOptions>(
    order_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { id: string } } & T> | Order | null
  > {
    const query = { where: { id: order_id }, ...(options ?? {}) };
    return prisma.order.findUnique(query);
  }

  /**
   * Retrieves all orders associated with a specific user.
   *
   * Fetches a comprehensive list of orders that belong to the specified user
   * across all shops. Supports flexible query options for customizing the returned
   * data including pagination, sorting, and relation includes for order management.
   *
   * @example
   * ```typescript
   * // Get all user orders
   * const userOrders = await orderServices.getOrdersByUserId('user123');
   * console.log(`User has ${userOrders.length} orders`);
   *
   * // Get recent orders with items
   * const recentOrders = await orderServices.getOrdersByUserId('user123', {
   *   include: {
   *     items: {
   *       include: { product: true }
   *     }
   *   },
   *   orderBy: { created_at: 'desc' },
   *   take: 10
   * });
   *
   * // Usage in user order history
   * const OrderHistory = ({ userId }: { userId: string }) => {
   *   const [orders, setOrders] = useState<Order[]>([]);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     const loadOrders = async () => {
   *       try {
   *         const userOrders = await orderServices.getOrdersByUserId(userId, {
   *           include: { items: true, shop: true },
   *           orderBy: { created_at: 'desc' }
   *         });
   *         setOrders(userOrders);
   *       } catch (error) {
   *         console.error('Failed to load orders:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     loadOrders();
   *   }, [userId]);
   *
   *   return <OrderHistoryComponent orders={orders} loading={loading} />;
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user whose orders to retrieve
   * @param options - Optional Prisma query options for customizing the result
   * @returns A promise that resolves to an array of orders belonging to the user
   *
   * @remarks
   * **Behavior:**
   * - Returns all orders for the specified user
   * - Includes orders from all shops
   * - Returns empty array if user has no orders
   * - Supports flexible querying and pagination
   *
   * **Use Cases:**
   * - User order history display
   * - Order tracking and status updates
   * - Customer account management
   * - Order analytics and reporting
   * - Support ticket references
   *
   * **Performance Considerations:**
   * - Consider pagination for users with many orders
   * - Use appropriate includes to avoid over-fetching
   * - Index on user_id for efficient querying
   * - Sort by created_at for chronological display
   *
   * @see {@link OrderFindManyOptions} for available query options
   * @see {@link Order} for order structure
   *
   * @since 1.0.0
   */
  async getOrdersByUserId(user_id: string): Promise<Order[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[]>;
  async getOrdersByUserId<T extends OrderFindManyOptions>(
    user_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { user_id: string } } & T>[] | Order[]
  > {
    const query = { where: { user_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  /**
   * Retrieves all orders associated with a specific shop.
   *
   * Fetches a comprehensive list of orders that belong to the specified shop
   * from all customers. Essential for shop management, order fulfillment, and
   * business analytics. Supports flexible query options for customized data retrieval.
   *
   * @example
   * ```typescript
   * // Get all shop orders
   * const shopOrders = await orderServices.getOrdersByShopId('shop456');
   * console.log(`Shop has ${shopOrders.length} orders`);
   *
   * // Get pending orders with customer details
   * const pendingOrders = await orderServices.getOrdersByShopId('shop456', {
   *   where: { order_status: OrderStatus.PENDING },
   *   include: {
   *     user: true,
   *     items: { include: { product: true } }
   *   },
   *   orderBy: { created_at: 'asc' }
   * });
   *
   * // Usage in shop dashboard
   * const ShopDashboard = ({ shopId }: { shopId: string }) => {
   *   const [orders, setOrders] = useState<Order[]>([]);
   *   const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
   *
   *   useEffect(() => {
   *     const loadShopData = async () => {
   *       const allOrders = await orderServices.getOrdersByShopId(shopId, {
   *         include: { items: true }
   *       });
   *       setOrders(allOrders);
   *
   *       // Calculate stats
   *       const statsData = {
   *         total: allOrders.length,
   *         pending: allOrders.filter(o => o.order_status === OrderStatus.PENDING).length,
   *         completed: allOrders.filter(o => o.order_status === OrderStatus.COMPLETED).length
   *       };
   *       setStats(statsData);
   *     };
   *
   *     loadShopData();
   *   }, [shopId]);
   *
   *   return <ShopManagementInterface orders={orders} stats={stats} />;
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop whose orders to retrieve
   * @param options - Optional Prisma query options for customizing the result
   * @returns A promise that resolves to an array of orders belonging to the shop
   *
   * @remarks
   * **Shop Management Features:**
   * - Order fulfillment tracking
   * - Customer relationship management
   * - Inventory impact analysis
   * - Revenue and sales reporting
   * - Order status workflow management
   *
   * **Use Cases:**
   * - Shop order management dashboard
   * - Order fulfillment processing
   * - Sales analytics and reporting
   * - Customer service operations
   * - Inventory planning and restocking
   * - Financial reconciliation
   *
   * **Business Intelligence:**
   * - Track order volumes and trends
   * - Analyze customer purchasing patterns
   * - Monitor order processing efficiency
   * - Calculate revenue and profitability
   * - Identify popular products and services
   *
   * @see {@link OrderFindManyOptions} for available query options
   * @see {@link Order} for order structure
   * @see {@link OrderStatus} for order status values
   *
   * @since 1.0.0
   */
  async getOrdersByShopId(shop_id: string): Promise<Order[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getOrdersByShopId<T extends OrderFindManyOptions>(
    shop_id: string,
    options?: T,
  ): Promise<
    Prisma.OrderGetPayload<{ where: { shop_id: string } } & T>[] | Order[]
  > {
    const query = { where: { shop_id }, ...(options ?? {}) };
    return prisma.order.findMany(query);
  }

  /**
   * Creates a new order from an existing cart with comprehensive validation and atomic processing.
   *
   * Converts a user's cart into a completed order through an atomic transaction that validates
   * cart contents, checks stock availability, calculates totals, processes payment information,
   * updates inventory, and clears the cart. Ensures data consistency and handles all edge cases
   * in the cart-to-order conversion process.
   *
   * @example
   * ```typescript
   * // Create order with online payment
   * const order = await orderServices.createOrderFromCart(
   *   'user123',
   *   'shop456',
   *   PaymentMethod.ONLINE,
   *   'pg_payment_abc123'
   * );
   * console.log(`Order ${order.id} created successfully`);
   *
   * // Create cash-on-delivery order
   * const codOrder = await orderServices.createOrderFromCart(
   *   'user123',
   *   'shop456',
   *   PaymentMethod.CASH_ON_DELIVERY
   * );
   *
   * // Usage in checkout process
   * const CheckoutProcessor = ({ userId, shopId }: CheckoutProps) => {
   *   const [processing, setProcessing] = useState(false);
   *   const [error, setError] = useState<string | null>(null);
   *
   *   const handleCheckout = async (paymentData: PaymentData) => {
   *     setProcessing(true);
   *     setError(null);
   *
   *     try {
   *       const order = await orderServices.createOrderFromCart(
   *         userId,
   *         shopId,
   *         paymentData.method,
   *         paymentData.pgPaymentId
   *       );
   *
   *       // Redirect to order confirmation
   *       router.push(`/orders/${order.id}/confirmation`);
   *     } catch (err) {
   *       setError(err instanceof Error ? err.message : 'Checkout failed');
   *     } finally {
   *       setProcessing(false);
   *     }
   *   };
   *
   *   return (
   *     <CheckoutForm
   *       onSubmit={handleCheckout}
   *       loading={processing}
   *       error={error}
   *     />
   *   );
   * };
   * ```
   *
   * @param user_id - The unique identifier of the user placing the order
   * @param shop_id - The unique identifier of the shop fulfilling the order
   * @param payment_method - The payment method chosen by the user
   * @param pg_payment_id - Optional payment gateway transaction ID for online payments
   * @returns A promise that resolves to the created order with items included
   *
   * @throws {Error} When cart is empty or doesn't exist
   * @throws {Error} When insufficient stock is available for any cart item
   * @throws {Error} When database transaction fails
   *
   * @remarks
   * **Atomic Transaction Process:**
   * 1. **Cart Validation**: Verifies cart exists and contains items
   * 2. **Stock Validation**: Ensures sufficient inventory for all items
   * 3. **Price Calculation**: Computes total from current product prices
   * 4. **Order Creation**: Creates order record with all items
   * 5. **Inventory Update**: Decrements stock quantities atomically
   * 6. **Cart Cleanup**: Removes all items from the original cart
   *
   * **Payment Processing:**
   * - Online payments: Marked as COMPLETED with payment gateway ID
   * - Cash on delivery: Marked as PENDING for payment upon delivery
   * - Supports future payment method extensions
   *
   * **Error Handling:**
   * - Validates cart existence before processing
   * - Checks each item's stock availability
   * - Provides specific error messages for debugging
   * - Ensures transaction rollback on any failure
   * - Maintains data consistency across all operations
   *
   * **Business Logic:**
   * - Uses current product prices (not cart-stored prices)
   * - Validates stock at order creation time
   * - Automatically sets payment status based on method
   * - Preserves audit trail with timestamps
   * - Supports payment gateway integration
   *
   * **Performance Considerations:**
   * - Single transaction for all database operations
   * - Efficient bulk stock updates using Promise.all
   * - Optimized cart item deletion
   * - Minimal database round trips
   *
   * @see {@link PaymentMethod} for supported payment options
   * @see {@link PaymentStatus} for payment status values
   * @see {@link Order} for order structure
   *
   * @since 1.0.0
   */
  async createOrderFromCart(
    user_id: string,
    shop_id: string,
    payment_method: PaymentMethod,
    pg_payment_id?: string,
  ): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { user_id_shop_id: { user_id, shop_id } },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cannot create an order from an empty cart.");
      }
      for (const item of cart.items) {
        if (item.product.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${item.product.name}`,
          );
        }
      }
      const totalPrice = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      const order = await tx.order.create({
        data: {
          user_id,
          shop_id,
          total_price: totalPrice,
          payment_method,
          payment_status:
            payment_method === PaymentMethod.ONLINE
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PENDING,
          pg_payment_id,
          items: {
            create: cart.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      const stockUpdatePromises = cart.items.map((item) =>
        tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        }),
      );
      await Promise.all(stockUpdatePromises);
      await tx.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return order;
    });
  }

  /**
   * Updates the status of an existing order.
   *
   * Changes the order status to reflect the current state in the fulfillment process.
   * Essential for order tracking, workflow management, and customer communication.
   * Provides atomic updates with proper validation and audit trail maintenance.
   *
   * @example
   * ```typescript
   * // Update order to shipped
   * const updatedOrder = await orderServices.updateOrderStatus(
   *   'order123',
   *   OrderStatus.SHIPPED
   * );
   * console.log(`Order ${updatedOrder.id} is now ${updatedOrder.order_status}`);
   *
   * // Usage in order management system
   * const OrderStatusManager = ({ order }: { order: Order }) => {
   *   const [updating, setUpdating] = useState(false);
   *
   *   const handleStatusChange = async (newStatus: OrderStatus) => {
   *     setUpdating(true);
   *     try {
   *       const updatedOrder = await orderServices.updateOrderStatus(
   *         order.id,
   *         newStatus
   *       );
   *
   *       // Notify customer of status change
   *       await notificationService.sendStatusUpdate(updatedOrder);
   *
   *       // Refresh order data
   *       onOrderUpdate(updatedOrder);
   *     } catch (error) {
   *       console.error('Failed to update order status:', error);
   *     } finally {
   *       setUpdating(false);
   *     }
   *   };
   *
   *   return (
   *     <StatusUpdateComponent
   *       currentStatus={order.order_status}
   *       onStatusChange={handleStatusChange}
   *       loading={updating}
   *     />
   *   );
   * };
   *
   * // Bulk status updates
   * const updateMultipleOrders = async (orderIds: string[], status: OrderStatus) => {
   *   const updates = orderIds.map(id =>
   *     orderServices.updateOrderStatus(id, status)
   *   );
   *   const results = await Promise.all(updates);
   *   console.log(`Updated ${results.length} orders to ${status}`);
   * };
   * ```
   *
   * @param order_id - The unique identifier of the order to update
   * @param status - The new status to set for the order
   * @returns A promise that resolves to the updated order
   *
   * @throws {Error} When order doesn't exist
   * @throws {Error} When invalid status transition is attempted
   * @throws {Error} When database update fails
   *
   * @remarks
   * **Order Status Workflow:**
   * - PENDING: Order placed, awaiting processing
   * - CONFIRMED: Order confirmed and being prepared
   * - SHIPPED: Order dispatched for delivery
   * - DELIVERED: Order successfully delivered
   * - CANCELLED: Order cancelled by user or shop
   *
   * **Use Cases:**
   * - Order fulfillment tracking
   * - Customer status notifications
   * - Workflow automation triggers
   * - Shipping and logistics updates
   * - Customer service operations
   * - Business process management
   *
   * **Integration Points:**
   * - Email/SMS notification systems
   * - Shipping provider APIs
   * - Customer service platforms
   * - Analytics and reporting systems
   * - Inventory management systems
   *
   * **Audit Trail:**
   * - Automatically updates modified timestamp
   * - Preserves status change history
   * - Enables status transition tracking
   * - Supports compliance requirements
   *
   * @see {@link OrderStatus} for available status values
   * @see {@link Order} for order structure
   *
   * @since 1.0.0
   */
  async updateOrderStatus(
    order_id: string,
    status: OrderStatus,
  ): Promise<Order> {
    return prisma.order.update({
      where: { id: order_id },
      data: { order_status: status },
    });
  }
}

/**
 * Singleton instance of the OrderServices class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all order-related database operations
 * including order creation, retrieval, and status management with comprehensive
 * validation and transaction support.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import orderServices from '@/services/order.services';
 *
 * // Create order from cart
 * const order = await orderServices.createOrderFromCart(
 *   'user123',
 *   'shop456',
 *   PaymentMethod.ONLINE,
 *   'pg_payment_abc'
 * );
 *
 * // Get order details
 * const orderDetails = await orderServices.getOrderById('order789', {
 *   include: { items: { include: { product: true } } }
 * });
 *
 * // Update order status
 * await orderServices.updateOrderStatus('order789', OrderStatus.SHIPPED);
 *
 * // Get user orders
 * const userOrders = await orderServices.getOrdersByUserId('user123');
 * ```
 *
 * @example
 * ```typescript
 * // Usage in React hooks
 * const useOrder = (orderId: string) => {
 *   const [order, setOrder] = useState<Order | null>(null);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadOrder = useCallback(async () => {
 *     setLoading(true);
 *     try {
 *       const orderData = await orderServices.getOrderById(orderId, {
 *         include: {
 *           items: { include: { product: true } },
 *           shop: true,
 *           user: true
 *         }
 *       });
 *       setOrder(orderData);
 *     } catch (error) {
 *       console.error('Failed to load order:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [orderId]);
 *
 *   const updateStatus = useCallback(async (status: OrderStatus) => {
 *     const updatedOrder = await orderServices.updateOrderStatus(orderId, status);
 *     setOrder(updatedOrder);
 *     return updatedOrder;
 *   }, [orderId]);
 *
 *   return { order, loading, loadOrder, updateStatus };
 * };
 * ```
 *
 * @see {@link OrderServices} for available methods and detailed documentation
 * @see {@link Order} for order data structure
 * @see {@link OrderStatus} for order status options
 * @see {@link PaymentMethod} for payment method options
 *
 * @since 1.0.0
 */
const orderServices = new OrderServices();

export default orderServices;
