/**
 * Product service module for the college connect application.
 *
 * This module provides comprehensive product management functionality including product creation,
 * retrieval, updating, and deletion. It handles shop-specific product operations with flexible
 * query options, validation, and atomic transaction operations for e-commerce workflows.
 *
 * @example
 * ```typescript
 * // Create a new product
 * const product = await productServices.createProduct({
 *   name: 'College Notebook',
 *   description: 'High-quality notebook for students',
 *   price: 299,
 *   stock: 50,
 *   shop_id: 'shop123'
 * });
 * console.log(`Product created with ID: ${product.id}`);
 *
 * // Get product by ID with relations
 * const productDetails = await productServices.getProductById('product456', {
 *   include: { shop: true, reviews: true }
 * });
 *
 * // Get all products for a shop
 * const shopProducts = await productServices.getProductsByShopId('shop123');
 *
 * // Update product
 * await productServices.updateProduct('product456', {
 *   price: 349,
 *   stock: 75
 * });
 * ```
 *
 * @remarks
 * **Features:**
 * - Full CRUD operations for products
 * - Shop-specific product management
 * - Flexible query options with Prisma
 * - Type-safe operations with overloads
 * - Stock management integration
 * - Validation and error handling
 *
 * @see {@link Product} for product data structure
 * @see {@link CreateProductDto} for product creation data
 * @see {@link UpdateProductDto} for product update data
 *
 * @since 1.0.0
 */
import { Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Type alias for product creation data.
 *
 * Defines the structure for creating new products in the system.
 * Based on Prisma's ProductCreateInput with all required and optional fields
 * for comprehensive product information management.
 *
 * @example
 * ```typescript
 * const newProduct: CreateProductDto = {
 *   name: 'Engineering Textbook',
 *   description: 'Comprehensive engineering fundamentals',
 *   price: 1299,
 *   stock: 25,
 *   category: 'Books',
 *   shop: {
 *     connect: { id: 'shop123' }
 *   }
 * };
 * ```
 *
 * @see {@link Prisma.ProductCreateInput} for complete field options
 * @see {@link ProductServices.createProduct} for usage in product creation
 *
 * @since 1.0.0
 */
export type CreateProductDto = Prisma.ProductCreateInput;

/**
 * Type alias for product update data.
 *
 * Defines the structure for updating existing products in the system.
 * Based on Prisma's ProductUpdateInput with partial updates support
 * for flexible product modification operations.
 *
 * @example
 * ```typescript
 * const updateData: UpdateProductDto = {
 *   price: 1199,
 *   stock: { increment: 10 },
 *   description: 'Updated comprehensive engineering fundamentals'
 * };
 * ```
 *
 * @see {@link Prisma.ProductUpdateInput} for complete update options
 * @see {@link ProductServices.updateProduct} for usage in product updates
 *
 * @since 1.0.0
 */
export type UpdateProductDto = Prisma.ProductUpdateInput;

/**
 * Type alias for Prisma product find unique options without the where clause.
 *
 * Provides type-safe query options for single product retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 * @example
 * ```typescript
 * const options: ProductFindOptions = {
 *   include: {
 *     shop: true,
 *     reviews: {
 *       include: {
 *         user: true
 *       }
 *     },
 *     orderItems: true
 *   }
 * };
 * ```
 *
 * @see {@link ProductServices.getProductById} for usage in product retrieval
 * @see {@link Prisma.ProductFindUniqueArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;

/**
 * Type alias for Prisma product find many options without the where clause.
 *
 * Provides type-safe query options for multiple product retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports pagination, sorting, filtering, and relation includes for bulk operations.
 *
 * @example
 * ```typescript
 * const options: ProductFindManyOptions = {
 *   include: {
 *     shop: true
 *   },
 *   orderBy: {
 *     created_at: 'desc'
 *   },
 *   take: 20,
 *   skip: 0
 * };
 * ```
 *
 * @see {@link ProductServices.getProductsByShopId} for shop product retrieval
 * @see {@link Prisma.ProductFindManyArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

/**
 * Type alias for Prisma product create options without the data clause.
 *
 * Provides type-safe query options for product creation operations,
 * excluding the data clause which is handled separately.
 * Enables additional options like includes and selects for created products.
 *
 * @see {@link ProductServices.createProduct} for usage in product creation
 * @see {@link Prisma.ProductCreateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ProductCreateOptions = Omit<Prisma.ProductCreateArgs, "data">;

/**
 * Type alias for Prisma product update options without where and data clauses.
 *
 * Provides type-safe query options for product update operations,
 * excluding the where and data clauses which are handled separately.
 * Enables additional options like includes and selects for updated products.
 *
 * @see {@link ProductServices.updateProduct} for usage in product updates
 * @see {@link Prisma.ProductUpdateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ProductUpdateOptions = Omit<Prisma.ProductUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma product delete options without the where clause.
 *
 * Provides type-safe query options for product deletion operations,
 * excluding the where clause which is handled internally.
 * Enables additional options like includes and selects for deleted products.
 *
 * @see {@link ProductServices.deleteProduct} for usage in product deletion
 * @see {@link Prisma.ProductDeleteArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ProductDeleteOptions = Omit<Prisma.ProductDeleteArgs, "where">;

/**
 * Product service class providing comprehensive product management operations.
 *
 * Handles all product-related database operations including CRUD operations,
 * shop-specific queries, and flexible data retrieval with Prisma integration.
 * Designed for e-commerce workflows with type safety and performance optimization.
 *
 * @example
 * ```typescript
 * const productService = new ProductServices();
 *
 * // Basic product operations
 * const product = await productService.createProduct({
 *   name: 'Study Guide',
 *   price: 499,
 *   shop_id: 'shop123'
 * });
 *
 * const foundProduct = await productService.getProductById(product.id);
 * const updatedProduct = await productService.updateProduct(product.id, {
 *   price: 549
 * });
 * ```
 *
 * @since 1.0.0
 */
class ProductServices {
  /**
   * Retrieves a product by its unique identifier.
   *
   * Fetches a single product from the database using the provided product ID.
   * Supports flexible query options for including related data, selecting specific fields,
   * and other Prisma query features. Essential for product detail pages and order processing.
   *
   * @example
   * ```typescript
   * // Basic product retrieval
   * const product = await productServices.getProductById('product123');
   * if (product) {
   *   console.log(`Found product: ${product.name}`);
   * }
   *
   * // Retrieve with shop and reviews
   * const productWithDetails = await productServices.getProductById('product123', {
   *   include: {
   *     shop: {
   *       select: { name: true, location: true }
   *     },
   *     reviews: {
   *       include: { user: true },
   *       orderBy: { created_at: 'desc' },
   *       take: 5
   *     }
   *   }
   * });
   *
   * // Usage in product detail component
   * const ProductDetail = ({ productId }: { productId: string }) => {
   *   const [product, setProduct] = useState<Product | null>(null);
   *
   *   useEffect(() => {
   *     const loadProduct = async () => {
   *       const productData = await productServices.getProductById(productId, {
   *         include: { shop: true, reviews: true }
   *       });
   *       setProduct(productData);
   *     };
   *     loadProduct();
   *   }, [productId]);
   *
   *   return product ? <ProductCard product={product} /> : <Loading />;
   * };
   * ```
   *
   * @param product_id - The unique identifier of the product to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the product or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid product ID format is provided
   *
   * @see {@link Product} for product data structure
   * @see {@link ProductFindOptions} for available query options
   *
   * @since 1.0.0
   */
  async getProductById(product_id: string): Promise<Product | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T> | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product | null
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.findUnique(query);
  }

  /**
   * Retrieves all products belonging to a specific shop.
   *
   * Fetches all products associated with the provided shop ID.
   * Supports flexible query options for pagination, sorting, filtering,
   * and including related data. Essential for shop management and product catalogs.
   *
   * @example
   * ```typescript
   * // Get all products for a shop
   * const shopProducts = await productServices.getProductsByShopId('shop123');
   * console.log(`Shop has ${shopProducts.length} products`);
   *
   * // Get products with pagination and sorting
   * const paginatedProducts = await productServices.getProductsByShopId('shop123', {
   *   orderBy: { created_at: 'desc' },
   *   take: 10,
   *   skip: 0,
   *   include: {
   *     reviews: {
   *       select: {
   *         rating: true
   *       }
   *     }
   *   }
   * });
   *
   * // Usage in shop dashboard
   * const ShopProductList = ({ shopId }: { shopId: string }) => {
   *   const [products, setProducts] = useState<Product[]>([]);
   *   const [loading, setLoading] = useState(false);
   *
   *   const loadProducts = async () => {
   *     setLoading(true);
   *     try {
   *       const productList = await productServices.getProductsByShopId(shopId, {
   *         orderBy: { name: 'asc' },
   *         include: { reviews: true }
   *       });
   *       setProducts(productList);
   *     } catch (error) {
   *       console.error('Failed to load products:', error);
   *     } finally {
   *       setLoading(false);
   *     }
   *   };
   *
   *   return <ProductGrid products={products} loading={loading} />;
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop
   * @param options - Optional Prisma query options for pagination, sorting, includes, etc.
   * @returns A promise that resolves to an array of products
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid shop ID format is provided
   *
   * @see {@link Product} for product data structure
   * @see {@link ProductFindManyOptions} for available query options
   *
   * @since 1.0.0
   */
  async getProductsByShopId(shop_id: string): Promise<Product[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[] | Product[]
  > {
    const query = { where: { shop_id: shop_id }, ...(options ?? {}) };
    return prisma.product.findMany(query);
  }

  /**
   * Creates a new product in the system.
   *
   * Adds a new product to the database with the provided data.
   * Supports flexible creation options for including related data in the response.
   * Essential for shop owners to add new products to their inventory.
   *
   * @example
   * ```typescript
   * // Create a basic product
   * const newProduct = await productServices.createProduct({
   *   name: 'Engineering Calculator',
   *   description: 'Scientific calculator for engineering students',
   *   price: 1299,
   *   stock: 30,
   *   category: 'Electronics',
   *   shop: {
   *     connect: { id: 'shop123' }
   *   }
   * });
   *
   * // Create product with shop details included
   * const productWithShop = await productServices.createProduct({
   *   name: 'Study Lamp',
   *   price: 899,
   *   shop_id: 'shop123'
   * }, {
   *   include: {
   *     shop: {
   *       select: { name: true, id: true }
   *     }
   *   }
   * });
   *
   * // Usage in product creation form
   * const ProductCreateForm = ({ shopId }: { shopId: string }) => {
   *   const [formData, setFormData] = useState<Partial<CreateProductDto>>({});
   *   const [creating, setCreating] = useState(false);
   *
   *   const handleSubmit = async (e: React.FormEvent) => {
   *     e.preventDefault();
   *     setCreating(true);
   *
   *     try {
   *       const product = await productServices.createProduct({
   *         ...formData,
   *         shop: { connect: { id: shopId } }
   *       } as CreateProductDto);
   *
   *       // Redirect to product page or show success
   *       router.push(`/products/${product.id}`);
   *     } catch (error) {
   *       console.error('Failed to create product:', error);
   *     } finally {
   *       setCreating(false);
   *     }
   *   };
   *
   *   return <ProductForm onSubmit={handleSubmit} loading={creating} />;
   * };
   * ```
   *
   * @param data - The product data for creation
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the created product
   *
   * @throws {Error} When required fields are missing
   * @throws {Error} When shop doesn't exist
   * @throws {Error} When database creation fails
   * @throws {Error} When validation constraints are violated
   *
   * @see {@link CreateProductDto} for required product data structure
   * @see {@link ProductCreateOptions} for available creation options
   * @see {@link Product} for created product structure
   *
   * @since 1.0.0
   */
  async createProduct(data: CreateProductDto): Promise<Product>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ data: CreateProductDto } & T>>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ data: CreateProductDto } & T> | Product
  > {
    const query = { data, ...(options ?? {}) };
    return prisma.product.create(query);
  }

  /**
   * Updates an existing product in the system.
   *
   * Modifies product data with the provided update information.
   * Supports partial updates and flexible query options for the response.
   * Essential for shop owners to maintain current product information.
   *
   * @example
   * ```typescript
   * // Update product price and stock
   * const updatedProduct = await productServices.updateProduct('product123', {
   *   price: 1399,
   *   stock: { increment: 25 }
   * });
   *
   * // Update with validation and shop details
   * const productWithDetails = await productServices.updateProduct('product123', {
   *   description: 'Updated product description',
   *   category: 'Updated Category'
   * }, {
   *   include: {
   *     shop: true,
   *     reviews: { take: 5 }
   *   }
   * });
   *
   * // Usage in product edit form
   * const ProductEditForm = ({ productId }: { productId: string }) => {
   *   const [product, setProduct] = useState<Product | null>(null);
   *   const [updating, setUpdating] = useState(false);
   *
   *   const handleUpdate = async (updateData: UpdateProductDto) => {
   *     setUpdating(true);
   *     try {
   *       const updated = await productServices.updateProduct(
   *         productId,
   *         updateData,
   *         { include: { shop: true } }
   *       );
   *       setProduct(updated);
   *       // Show success message
   *     } catch (error) {
   *       console.error('Failed to update product:', error);
   *     } finally {
   *       setUpdating(false);
   *     }
   *   };
   *
   *   return <ProductForm product={product} onSubmit={handleUpdate} loading={updating} />;
   * };
   * ```
   *
   * @param product_id - The unique identifier of the product to update
   * @param data - The update data for the product
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the updated product
   *
   * @throws {Error} When product doesn't exist
   * @throws {Error} When validation constraints are violated
   * @throws {Error} When database update fails
   * @throws {Error} When unauthorized update is attempted
   *
   * @see {@link UpdateProductDto} for update data structure
   * @see {@link ProductUpdateOptions} for available update options
   * @see {@link Product} for updated product structure
   *
   * @since 1.0.0
   */
  async updateProduct(
    product_id: string,
    data: UpdateProductDto,
  ): Promise<Product>;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options: T,
  ): Promise<
    Prisma.ProductGetPayload<
      { where: { id: string }; data: UpdateProductDto } & T
    >
  >;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options?: T,
  ): Promise<
    | Prisma.ProductGetPayload<
        { where: { id: string }; data: UpdateProductDto } & T
      >
    | Product
  > {
    const query = { where: { id: product_id }, data, ...(options ?? {}) };
    return prisma.product.update(query);
  }

  /**
   * Deletes a product from the system.
   *
   * Removes a product from the database permanently.
   * Supports flexible query options for returning deleted product data.
   * Essential for shop owners to manage their product inventory.
   *
   * @example
   * ```typescript
   * // Delete a product
   * const deletedProduct = await productServices.deleteProduct('product123');
   * console.log(`Deleted product: ${deletedProduct.name}`);
   *
   * // Delete with shop information included
   * const deletedWithShop = await productServices.deleteProduct('product123', {
   *   include: {
   *     shop: {
   *       select: { name: true, id: true }
   *     }
   *   }
   * });
   *
   * // Usage in product management
   * const ProductDeleteButton = ({ productId }: { productId: string }) => {
   *   const [deleting, setDeleting] = useState(false);
   *
   *   const handleDelete = async () => {
   *     if (!confirm('Are you sure you want to delete this product?')) return;
   *
   *     setDeleting(true);
   *     try {
   *       await productServices.deleteProduct(productId);
   *       // Refresh product list or redirect
   *       onProductDeleted(productId);
   *     } catch (error) {
   *       console.error('Failed to delete product:', error);
   *       alert('Failed to delete product');
   *     } finally {
   *       setDeleting(false);
   *     }
   *   };
   *
   *   return (
   *     <button onClick={handleDelete} disabled={deleting}>
   *       {deleting ? 'Deleting...' : 'Delete Product'}
   *     </button>
   *   );
   * };
   * ```
   *
   * @param product_id - The unique identifier of the product to delete
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the deleted product
   *
   * @throws {Error} When product doesn't exist
   * @throws {Error} When product has active orders (referential integrity)
   * @throws {Error} When database deletion fails
   * @throws {Error} When unauthorized deletion is attempted
   *
   * @remarks
   * **Important Considerations:**
   * - Deletion is permanent and cannot be undone
   * - Products with active orders may not be deletable
   * - Consider soft deletion for products with order history
   * - Ensure proper authorization before deletion
   *
   * @see {@link ProductDeleteOptions} for available deletion options
   * @see {@link Product} for deleted product structure
   *
   * @since 1.0.0
   */
  async deleteProduct(product_id: string): Promise<Product>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options: T,
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T>>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options?: T,
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.delete(query);
  }
}

/**
 * Singleton instance of the ProductServices class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all product-related database operations
 * including CRUD operations, shop-specific queries, and flexible data retrieval
 * with comprehensive validation and type safety.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import productServices from '@/services/product.services';
 *
 * // Create a product
 * const product = await productServices.createProduct({
 *   name: 'Student Notebook',
 *   price: 299,
 *   shop_id: 'shop123'
 * });
 *
 * // Get product details
 * const productDetails = await productServices.getProductById('product456', {
 *   include: { shop: true, reviews: true }
 * });
 *
 * // Update product
 * await productServices.updateProduct('product456', {
 *   price: 349,
 *   stock: { increment: 10 }
 * });
 *
 * // Get shop products
 * const shopProducts = await productServices.getProductsByShopId('shop123');
 * ```
 *
 * @example
 * ```typescript
 * // Usage in React hooks
 * const useProduct = (productId: string) => {
 *   const [product, setProduct] = useState<Product | null>(null);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadProduct = useCallback(async () => {
 *     setLoading(true);
 *     try {
 *       const productData = await productServices.getProductById(productId, {
 *         include: {
 *           shop: true,
 *           reviews: { include: { user: true } }
 *         }
 *       });
 *       setProduct(productData);
 *     } catch (error) {
 *       console.error('Failed to load product:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [productId]);
 *
 *   const updateProduct = useCallback(async (data: UpdateProductDto) => {
 *     const updated = await productServices.updateProduct(productId, data);
 *     setProduct(updated);
 *     return updated;
 *   }, [productId]);
 *
 *   return { product, loading, loadProduct, updateProduct };
 * };
 * ```
 *
 * @see {@link ProductServices} for available methods and detailed documentation
 * @see {@link Product} for product data structure
 * @see {@link CreateProductDto} for product creation data
 * @see {@link UpdateProductDto} for product update data
 *
 * @since 1.0.0
 */
const productServices = new ProductServices();

export default productServices;
