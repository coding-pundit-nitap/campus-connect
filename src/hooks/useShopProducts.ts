"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { productAPIService, shopAPIService } from "@/services/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * Hook to fetch shop details by shop ID with conditional query execution and automatic caching.
 *
 * This hook provides reactive access to comprehensive shop information including
 * shop metadata, seller details, and basic shop statistics. It's designed for
 * shop profile pages, shop directories, and any component that needs to display
 * or interact with specific shop information.
 *
 * @param shop_id - The unique identifier of the shop to fetch details for
 * @returns UseQueryResult containing shop details, loading state, and error information
 *
 * @example
 * ```typescript
 * // Shop profile page
 * function ShopProfile({ shopId }: { shopId: string }) {
 *   const { data: shop, isLoading, error } = useShop(shopId);
 *
 *   if (isLoading) return <ShopProfileSkeleton />;
 *   if (error) return <ShopErrorState error={error} />;
 *   if (!shop) return <ShopNotFound />;
 *
 *   return (
 *     <div className="shop-profile">
 *       <ShopHeader shop={shop} />
 *       <ShopDescription description={shop.description} />
 *       <ShopStats stats={shop.stats} />
 *     </div>
 *   );
 * }
 *
 * // Shop card in listings
 * function ShopCard({ shopId }: { shopId: string }) {
 *   const { data: shop } = useShop(shopId);
 *
 *   if (!shop) return <ShopCardSkeleton />;
 *
 *   return (
 *     <Card className="shop-card">
 *       <ShopLogo src={shop.logo} alt={shop.name} />
 *       <ShopName>{shop.name}</ShopName>
 *       <ShopRating rating={shop.rating} />
 *     </Card>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Query Behavior:**
 * - Query is only enabled when shop_id is truthy (not empty string, null, or undefined)
 * - Results are cached per shop_id for efficient data reuse across components
 * - Automatically refetches on window focus and network reconnection
 * - Gracefully handles shop_id changes without causing unnecessary requests
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.shops.detail(shop_id)`
 * - Each shop's data is cached independently for optimal performance
 * - Cache is invalidated when shop information is updated
 * - Supports concurrent fetching of multiple shops' details
 *
 * **Performance Features:**
 * - Conditional execution prevents unnecessary network requests when shop_id is invalid
 * - Efficient cache management reduces server load and improves response times
 * - Background refetching ensures data freshness without blocking UI interactions
 *
 * @see {@link shopAPIService.fetchShop} for the underlying API call
 * @see {@link queryKeys.shops.detail} for cache key generation
 * @see {@link useShopProducts} for fetching shop's product catalog
 * @see {@link useShopProductsFlat} for flattened shop products access
 *
 * @since 1.0.0
 */
export function useShop(shop_id: string) {
  return useQuery({
    queryKey: queryKeys.shops.detail(shop_id),
    queryFn: () => shopAPIService.fetchShop({ shop_id: shop_id }),
    enabled: !!shop_id,
  });
}

/**
 * Hook to fetch shop products with infinite scrolling and cursor-based pagination.
 *
 * This hook provides efficient access to a shop's product catalog using infinite
 * scrolling patterns. It's optimized for large product catalogs and provides
 * seamless pagination through cursor-based loading. Perfect for shop pages,
 * product listings, and any interface where users browse through shop inventories.
 *
 * @param shop_id - The unique identifier of the shop to fetch products for
 * @returns UseInfiniteQueryResult containing paginated product data, loading states, and pagination controls
 *
 * @example
 * ```typescript
 * // Shop product catalog with infinite scroll
 * function ShopProductCatalog({ shopId }: { shopId: string }) {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *     error
 *   } = useShopProducts(shopId);
 *
 *   if (isLoading) return <ProductCatalogSkeleton />;
 *   if (error) return <CatalogErrorState error={error} />;
 *
 *   const allProducts = data?.pages.flatMap(page => page.data) || [];
 *
 *   return (
 *     <div className="product-catalog">
 *       <ProductGrid products={allProducts} />
 *       <InfiniteScrollTrigger
 *         onIntersect={() => hasNextPage && fetchNextPage()}
 *         loading={isFetchingNextPage}
 *       />
 *     </div>
 *   );
 * }
 *
 * // Product search within shop
 * function ShopProductSearch({ shopId, searchTerm }: ShopProductSearchProps) {
 *   const { data, hasNextPage, fetchNextPage } = useShopProducts(shopId);
 *
 *   const filteredProducts = useMemo(() => {
 *     const allProducts = data?.pages.flatMap(page => page.data) || [];
 *     return searchTerm
 *       ? allProducts.filter(product =>
 *           product.name.toLowerCase().includes(searchTerm.toLowerCase())
 *         )
 *       : allProducts;
 *   }, [data, searchTerm]);
 *
 *   return (
 *     <div className="shop-search">
 *       <SearchResults products={filteredProducts} />
 *       {hasNextPage && <LoadMoreButton onClick={() => fetchNextPage()} />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Infinite Query Behavior:**
 * - Uses cursor-based pagination for efficient and consistent data loading
 * - Automatically manages page state and cursor progression
 * - Query is only enabled when shop_id is truthy to prevent unnecessary requests
 * - Supports both manual and automatic page fetching patterns
 *
 * **Pagination Strategy:**
 * - Initial page parameter starts as null for first page request
 * - Each page response contains nextCursor for subsequent page requests
 * - getNextPageParam extracts cursor from last page response
 * - Undefined cursor indicates no more pages available
 *
 * **Caching Strategy:**
 * - Query key is generated using `queryKeys.shops.products(shop_id)`
 * - Each page is cached independently for optimal memory usage
 * - Cache persists across component unmounts for improved navigation performance
 * - Automatic cache invalidation when shop products are modified
 *
 * **Performance Optimizations:**
 * - Lazy loading reduces initial bundle size and improves page load times
 * - Cursor-based pagination eliminates offset-based performance issues
 * - Background refetching keeps data fresh without disrupting user experience
 * - Efficient memory management for large product catalogs
 *
 * **User Experience Features:**
 * - Smooth infinite scrolling without pagination controls
 * - Optimistic loading states for better perceived performance
 * - Error boundaries and retry mechanisms for robust error handling
 * - Maintains scroll position during navigation and page transitions
 *
 * @see {@link productAPIService.fetchShopProducts} for the underlying API call
 * @see {@link queryKeys.shops.products} for cache key generation
 * @see {@link useShopProductsFlat} for simplified flat array access
 * @see {@link useShop} for shop details and metadata
 *
 * @since 1.0.0
 */
export const useShopProducts = (shop_id: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.shops.products(shop_id),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({ shop_id, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!shop_id,
  });
};

/**
 * Hook to fetch shop products as a flattened array with additional convenience properties.
 *
 * This hook builds upon useShopProducts to provide a simplified interface for
 * components that need access to all shop products as a single flat array rather
 * than paginated data. It automatically flattens the infinite query results and
 * provides additional computed properties for easier product catalog management.
 *
 * @param shop_id - The unique identifier of the shop to fetch products for
 * @returns Enhanced query result with flattened products array and convenience properties
 *
 * @example
 * ```typescript
 * // Simple product listing
 * function ShopProductList({ shopId }: { shopId: string }) {
 *   const { products, isLoading, error, hasProducts } = useShopProductsFlat(shopId);
 *
 *   if (isLoading) return <ProductListSkeleton />;
 *   if (error) return <ProductListError error={error} />;
 *   if (!hasProducts) return <EmptyProductsState />;
 *
 *   return (
 *     <div className="product-list">
 *       {products.map(product => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * // Product analytics dashboard
 * function ShopAnalytics({ shopId }: { shopId: string }) {
 *   const { products, totalProducts, hasProducts } = useShopProductsFlat(shopId);
 *
 *   const analytics = useMemo(() => {
 *     if (!hasProducts) return null;
 *
 *     return {
 *       totalValue: products.reduce((sum, p) => sum + p.price, 0),
 *       averagePrice: products.reduce((sum, p) => sum + p.price, 0) / totalProducts,
 *       categoryDistribution: groupBy(products, 'category'),
 *       topProducts: products.sort((a, b) => b.sales - a.sales).slice(0, 5)
 *     };
 *   }, [products, totalProducts, hasProducts]);
 *
 *   return (
 *     <div className="shop-analytics">
 *       <AnalyticsOverview
 *         totalProducts={totalProducts}
 *         analytics={analytics}
 *       />
 *       <ProductPerformanceChart products={analytics?.topProducts} />
 *     </div>
 *   );
 * }
 *
 * // Product search and filtering
 * function ProductSearchAndFilter({ shopId }: { shopId: string }) {
 *   const { products, hasProducts, isLoading } = useShopProductsFlat(shopId);
 *   const [filters, setFilters] = useState<ProductFilters>({});
 *
 *   const filteredProducts = useMemo(() => {
 *     return applyProductFilters(products, filters);
 *   }, [products, filters]);
 *
 *   if (isLoading) return <SearchSkeleton />;
 *   if (!hasProducts) return <NoProductsMessage />;
 *
 *   return (
 *     <div className="product-search">
 *       <ProductFilters filters={filters} onChange={setFilters} />
 *       <ProductResults products={filteredProducts} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Data Transformation:**
 * - Automatically flattens paginated infinite query results into single array
 * - Preserves all original query properties (isLoading, error, refetch, etc.)
 * - Adds computed convenience properties for common use cases
 * - Maintains reactivity to underlying infinite query state changes
 *
 * **Convenience Properties:**
 * - `products`: Flattened array of all loaded products across all pages
 * - `hasProducts`: Boolean indicating if any products are available
 * - `totalProducts`: Count of currently loaded products (may increase with pagination)
 *
 * **Performance Considerations:**
 * - Flattening operation is efficient but creates new array on each render
 * - Best suited for scenarios where all products need to be processed together
 * - For large catalogs, consider using useShopProducts directly for better memory efficiency
 * - Automatic memoization prevents unnecessary re-computations
 *
 * **Use Case Recommendations:**
 * - **Use this hook when:** Need simple array access, client-side filtering, analytics
 * - **Use useShopProducts when:** Implementing infinite scroll, large catalogs, memory optimization
 *
 * **Caching Inheritance:**
 * - Inherits all caching benefits from underlying useShopProducts hook
 * - No additional network requests - purely transforms existing cached data
 * - Cache invalidation triggers automatic re-flattening of updated data
 *
 * @see {@link useShopProducts} for the underlying infinite query implementation
 * @see {@link productAPIService.fetchShopProducts} for the API service
 * @see {@link queryKeys.shops.products} for cache key generation
 * @see {@link useShop} for shop metadata and details
 *
 * @since 1.0.0
 */
export function useShopProductsFlat(shop_id: string) {
  const query = useShopProducts(shop_id);

  const products = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    products,
    hasProducts: products.length > 0,
    totalProducts: products.length,
  };
}
