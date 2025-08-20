import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { FullCart } from "@/services/cart.services";

/**
 * Hook to fetch cart data for a specific shop with automatic caching and real-time updates.
 *
 * This hook provides reactive access to cart data for a specific shop, automatically
 * managing query state, caching, and background refetching. It integrates with the
 * React Query cache system to provide optimized data fetching and synchronization
 * across components that need access to the same cart data.
 *
 * @param shop_id - The unique identifier of the shop to fetch cart data for
 * @returns UseQueryResult containing cart data, loading state, and error information
 *
 * @example
 * ```typescript
 * // Basic cart fetching for a shop
 * function ShopCart({ shopId }: { shopId: string }) {
 *   const { data: cart, isLoading, error } = useCartForShop(shopId);
 *
 *   if (isLoading) return <CartSkeleton />;
 *   if (error) return <ErrorMessage />;
 *   if (!cart) return <EmptyCart />;
 *
 *   return <CartDisplay cart={cart} />;
 * }
 *
 * // Conditional cart loading
 * function ConditionalCart({ shopId }: { shopId?: string }) {
 *   const { data: cart } = useCartForShop(shopId || "");
 *   // Query only runs when shopId is provided
 *   return cart ? <CartSummary cart={cart} /> : null;
 * }
 * ```
 *
 * @see {@link cartAPIService.fetchCartForShop} for the underlying API call
 * @see {@link queryKeys.cart.byShop} for cache key generation
 * @see {@link FullCart} for the cart data structure
 * @see {@link useUpsertCartItem} for modifying cart contents
 *
 * @since 1.0.0
 */
export function useCartForShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.cart.byShop(shop_id),
    queryFn: () => cartAPIService.fetchCartForShop(shop_id),
    enabled: !!shop_id,
  });
}

/**
 * Hook for upserting (insert or update) cart items with optimistic cache updates.
 *
 * This mutation hook provides functionality to add new items to the cart or update
 * existing item quantities. It handles both insertion of new products and updating
 * quantities of existing products in a single operation, with automatic cache
 * management and optimistic UI updates for improved user experience.
 *
 * @returns UseMutationResult with mutate function for upserting cart items
 *
 * @example
 * ```typescript
 * // Basic cart item upsert
 * function ProductCard({ product }: { product: Product }) {
 *   const upsertItem = useUpsertCartItem();
 *
 *   const handleAddToCart = () => {
 *     upsertItem.mutate({
 *       product_id: product.id,
 *       quantity: 1
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <ProductInfo product={product} />
 *       <Button
 *         onClick={handleAddToCart}
 *         disabled={upsertItem.isPending}
 *       >
 *         {upsertItem.isPending ? "Adding..." : "Add to Cart"}
 *       </Button>
 *     </div>
 *   );
 * }
 *
 * // Quantity updater with error handling
 * function QuantityUpdater({ productId, currentQuantity }: Props) {
 *   const upsertItem = useUpsertCartItem();
 *
 *   const updateQuantity = (newQuantity: number) => {
 *     upsertItem.mutate(
 *       { product_id: productId, quantity: newQuantity },
 *       {
 *         onSuccess: () => {
 *           toast.success("Cart updated successfully");
 *         },
 *         onError: (error) => {
 *           toast.error("Failed to update cart");
 *           console.error(error);
 *         }
 *       }
 *     );
 *   };
 *
 *   return (
 *     <QuantitySelector
 *       value={currentQuantity}
 *       onChange={updateQuantity}
 *       disabled={upsertItem.isPending}
 *     />
 *   );
 * }
 * ```
 *
 * @see {@link cartAPIService.upsertCartItem} for the underlying API call
 * @see {@link useAddToCart} for a specialized add-to-cart variant
 * @see {@link useRemoveFromCart} for removing items from cart
 * @see {@link FullCart} for the cart data structure returned on success
 *
 * @since 1.0.0
 */
export function useUpsertCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      product_id,
      quantity,
    }: {
      product_id: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(product_id, quantity),
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);

      queryClient.invalidateQueries({
        queryKey: queryKeys.cart.all,
      });
    },
    onError: (error) => {
      console.error("Failed to update cart:", error);
    },
  });
}

/**
 * Hook for adding products to cart with optimistic updates and enhanced UX.
 *
 * This specialized mutation hook is designed specifically for adding products to
 * the cart with enhanced user experience features. It provides optimistic updates,
 * intelligent cache management, and context preservation for better error recovery.
 * Unlike the generic upsert hook, this is optimized for the add-to-cart flow.
 *
 * @returns UseMutationResult with mutate function for adding items to cart
 *
 * @example
 * ```typescript
 * // Product listing with add to cart
 * function ProductGrid({ products }: { products: Product[] }) {
 *   const addToCart = useAddToCart();
 *
 *   const handleAddProduct = (productId: string, quantity: number) => {
 *     addToCart.mutate(
 *       { product_id: productId, quantity },
 *       {
 *         onSuccess: (updatedCart) => {
 *           toast.success(`Added to ${updatedCart.shop.name} cart`);
 *         },
 *         onError: () => {
 *           toast.error("Failed to add item to cart");
 *         }
 *       }
 *     );
 *   };
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {products.map(product => (
 *         <ProductCard
 *           key={product.id}
 *           product={product}
 *           onAddToCart={(qty) => handleAddProduct(product.id, qty)}
 *           isAdding={addToCart.isPending}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * // Quick add with loading state
 * function QuickAddButton({ productId }: { productId: string }) {
 *   const addToCart = useAddToCart();
 *   const isAdding = addToCart.isPending;
 *
 *   return (
 *     <Button
 *       onClick={() => addToCart.mutate({ product_id: productId, quantity: 1 })}
 *       disabled={isAdding}
 *       className="w-full"
 *     >
 *       <ShoppingCart className="mr-2 h-4 w-4" />
 *       {isAdding ? "Adding..." : "Add to Cart"}
 *     </Button>
 *   );
 * }
 * ```
 *
 * @see {@link cartAPIService.upsertCartItem} for the underlying API implementation
 * @see {@link useUpsertCartItem} for the generic upsert functionality
 * @see {@link useCartForShop} for reading cart data
 * @see {@link FullCart} for the cart data structure
 *
 * @since 1.0.0
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      product_id,
      quantity,
    }: {
      product_id: string;
      quantity: number;
    }) => cartAPIService.upsertCartItem(product_id, quantity),
    onMutate: async ({ product_id, quantity }) => {
      const allQueries = queryClient.getQueriesData({
        queryKey: queryKeys.cart.all,
      });
      const shop_id = allQueries.find(
        ([key]) => key[0] === queryKeys.cart.byShop(product_id),
      )?.[0]?.[1];
      if (!shop_id) return { product_id, quantity };
      return { product_id, quantity };
    },
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
    },
  });
}

/**
 * Hook for removing products from cart with automatic cache synchronization.
 *
 * This specialized mutation hook provides functionality to completely remove
 * products from the shopping cart. It's optimized for removal operations and
 * handles cache cleanup automatically. The hook sets the product quantity to 0,
 * effectively removing the item from the cart while maintaining proper state
 * synchronization across all cart-related components.
 *
 * @returns UseMutationResult with mutate function for removing items from cart
 *
 * @example
 * ```typescript
 * // Cart item with remove functionality
 * function CartItem({ item }: { item: CartItem }) {
 *   const removeFromCart = useRemoveFromCart();
 *
 *   const handleRemove = () => {
 *     removeFromCart.mutate(
 *       { product_id: item.product_id },
 *       {
 *         onSuccess: () => {
 *           toast.success("Item removed from cart");
 *         },
 *         onError: () => {
 *           toast.error("Failed to remove item");
 *         }
 *       }
 *     );
 *   };
 *
 *   return (
 *     <div className="flex items-center justify-between p-4">
 *       <ItemDetails item={item} />
 *       <Button
 *         variant="destructive"
 *         size="sm"
 *         onClick={handleRemove}
 *         disabled={removeFromCart.isPending}
 *       >
 *         {removeFromCart.isPending ? "Removing..." : "Remove"}
 *       </Button>
 *     </div>
 *   );
 * }
 *
 * // Bulk remove functionality
 * function CartManager({ cartItems }: { cartItems: CartItem[] }) {
 *   const removeFromCart = useRemoveFromCart();
 *
 *   const removeMultipleItems = async (productIds: string[]) => {
 *     for (const productId of productIds) {
 *       await removeFromCart.mutateAsync({ product_id: productId });
 *     }
 *     toast.success(`Removed ${productIds.length} items from cart`);
 *   };
 *
 *   return (
 *     <div>
 *       <CartItemsList items={cartItems} />
 *       <Button
 *         onClick={() => removeMultipleItems(selectedItems)}
 *         disabled={removeFromCart.isPending}
 *       >
 *         Remove Selected Items
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link cartAPIService.upsertCartItem} for the underlying API call
 * @see {@link useUpsertCartItem} for the generic upsert functionality
 * @see {@link useAddToCart} for adding items to cart
 * @see {@link FullCart} for the cart data structure returned on success
 *
 * @since 1.0.0
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ product_id }: { product_id: string }) =>
      cartAPIService.upsertCartItem(product_id, 0),
    onSuccess: (data: FullCart) => {
      queryClient.setQueryData(queryKeys.cart.byShop(data.shop_id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
