import { Prisma, Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Type alias for product creation data.
 *
 * Defines the structure for creating new products in the system.
 * Based on Prisma's ProductCreateInput with all required and optional fields
 * for comprehensive product information management.
 *
 */
export type CreateProductDto = Prisma.ProductCreateInput;

/**
 * Type alias for product update data.
 *
 * Defines the structure for updating existing products in the system.
 * Based on Prisma's ProductUpdateInput with partial updates support
 * for flexible product modification operations.
 *
 */
export type UpdateProductDto = Prisma.ProductUpdateInput;

/**
 * Type alias for Prisma product find unique options without the where clause.
 *
 * Provides type-safe query options for single product retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 */
type ProductFindOptions = Omit<Prisma.ProductFindUniqueArgs, "where">;

/**
 * Type alias for Prisma product find many options without the where clause.
 *
 * Provides type-safe query options for multiple product retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports pagination, sorting, filtering, and relation includes for bulk operations.
 *
 */
type ProductFindManyOptions = Omit<Prisma.ProductFindManyArgs, "where">;

/**
 * Type alias for Prisma product create options without the data clause.
 *
 * Provides type-safe query options for product creation operations,
 * excluding the data clause which is handled separately.
 * Enables additional options like includes and selects for created products.
 *
 */
type ProductCreateOptions = Omit<Prisma.ProductCreateArgs, "data">;

/**
 * Type alias for Prisma product update options without where and data clauses.
 *
 * Provides type-safe query options for product update operations,
 * excluding the where and data clauses which are handled separately.
 * Enables additional options like includes and selects for updated products.
 *
 */
type ProductUpdateOptions = Omit<Prisma.ProductUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma product delete options without the where clause.
 *
 * Provides type-safe query options for product deletion operations,
 * excluding the where clause which is handled internally.
 * Enables additional options like includes and selects for deleted products.
 *
 */
type ProductDeleteOptions = Omit<Prisma.ProductDeleteArgs, "where">;

class ProductRepository {
  /**
   * Retrieves a product by its unique identifier.
   *
   * Fetches a single product from the database using the provided product ID.
   * Supports flexible query options for including related data, selecting specific fields,
   * and other Prisma query features. Essential for product detail pages and order processing.
   *
   * @param product_id - The unique identifier of the product to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the product or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid product ID format is provided
   *
   */
  async getProductById(product_id: string): Promise<Product | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T> | null>;
  async getProductById<T extends ProductFindOptions>(
    product_id: string,
    options?: T
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
   * @param shop_id - The unique identifier of the shop
   * @param options - Optional Prisma query options for pagination, sorting, includes, etc.
   * @returns A promise that resolves to an array of products
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid shop ID format is provided
   *
   */
  async getProductsByShopId(shop_id: string): Promise<Product[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { shop_id: string } } & T>[]>;
  async getProductsByShopId<T extends ProductFindManyOptions>(
    shop_id: string,
    options?: T
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
   * @param data - The product data for creation
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the created product
   *
   * @throws {Error} When required fields are missing
   * @throws {Error} When shop doesn't exist
   * @throws {Error} When database creation fails
   * @throws {Error} When validation constraints are violated
   *
   */
  async createProduct(data: CreateProductDto): Promise<Product>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ data: CreateProductDto } & T>>;
  async createProduct<T extends ProductCreateOptions>(
    data: CreateProductDto,
    options?: T
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
   */
  async updateProduct(
    product_id: string,
    data: UpdateProductDto
  ): Promise<Product>;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options: T
  ): Promise<
    Prisma.ProductGetPayload<
      { where: { id: string }; data: UpdateProductDto } & T
    >
  >;
  async updateProduct<T extends ProductUpdateOptions>(
    product_id: string,
    data: UpdateProductDto,
    options?: T
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
   * @param product_id - The unique identifier of the product to delete
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the deleted product
   *
   * @throws {Error} When product doesn't exist
   * @throws {Error} When product has active orders (referential integrity)
   * @throws {Error} When database deletion fails
   * @throws {Error} When unauthorized deletion is attempted
   *
   */
  async deleteProduct(product_id: string): Promise<Product>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options: T
  ): Promise<Prisma.ProductGetPayload<{ where: { id: string } } & T>>;
  async deleteProduct<T extends ProductDeleteOptions>(
    product_id: string,
    options?: T
  ): Promise<
    Prisma.ProductGetPayload<{ where: { id: string } } & T> | Product
  > {
    const query = { where: { id: product_id }, ...(options ?? {}) };
    return prisma.product.delete(query);
  }
}

const productReProductRepository = new ProductRepository();

export default productReProductRepository;
