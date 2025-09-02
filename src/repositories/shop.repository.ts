import { Prisma, Shop } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils-functions/auth.utils";
import { ShopFormData } from "@/validations/shop";

type ShopFindManyOptions = Prisma.ShopFindManyArgs;

/**
 * Type alias for shop update data.
 *
 * Defines the structure for updating existing shops in the system.
 * Based on Prisma's ShopUpdateInput with partial updates support
 * for flexible shop modification operations.
 *
 */
export type UpdateShopDto = Prisma.ShopUpdateInput;

/**
 * Type alias for Prisma shop find unique options without the where clause.
 *
 * Provides type-safe query options for single shop retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 */
type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

/**
 * Type alias for Prisma shop create options without the data clause.
 *
 * Provides type-safe query options for shop creation operations,
 * excluding the data clause which is handled as a separate parameter.
 * Supports includes, selects, and other creation-specific Prisma options.
 *
 */
type ShopCreateOptions = Omit<Prisma.ShopCreateArgs, "data">;

/**
 * Type alias for Prisma shop update options without where and data clauses.
 *
 * Provides type-safe query options for shop update operations,
 * excluding the where and data clauses which are handled as separate parameters.
 * Supports includes, selects, and other update-specific Prisma options.
 *
 */
type ShopUpdateOptions = Omit<Prisma.ShopUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma shop delete options without the where clause.
 *
 * Provides type-safe query options for shop deletion operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports includes, selects, and other deletion-specific Prisma options.
 *
 */
type ShopDeleteOptions = Omit<Prisma.ShopDeleteArgs, "where">;

class ShopRepository {
  /**
   * Retrieves a shop owned by a specific user.
   *
   * Finds the shop owned by a specific user. Essential for owner-specific operations
   * like managing their shop, viewing analytics, or checking ownership status.
   * Supports flexible query options for including related data.
   *
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the shop or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid owner ID is provided
   *
   */
  async getShopOwned(): Promise<Shop | null>;
  async getShopOwned<T extends ShopFindOptions>(
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | null>;
  async getShopOwned<T extends ShopFindOptions>(
    options?: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | Shop | null
  > {
    const owner_id = await authUtils.getUserId();
    const query = { where: { owner_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }
  /**
   * Retrieves a shop by its owner's ID.
   *
   * Finds the shop owned by a specific user. Essential for owner-specific operations
   * like managing their shop, viewing analytics, or checking ownership status.
   * Supports flexible query options for including related data.
   *
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the shop or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid owner ID is provided
   *
   */
  async getShopByOwnerId(owner_id: string): Promise<Shop | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    owner_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    owner_id: string,
    options?: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | Shop | null
  > {
    const query = { where: { owner_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  /**
   * Creates a new shop in the system.
   *
   * Establishes a new shop with the provided information and associates it with an owner.
   * Essential for users who want to start selling products on the platform.
   * Supports flexible query options for returning created shop data.
   *
   * @param data - The shop creation data containing name, description, owner, etc.
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the created shop
   *
   * @throws {Error} When required fields are missing
   * @throws {Error} When owner doesn't exist
   * @throws {Error} When user already has a shop (if business rules apply)
   * @throws {Error} When database creation fails
   *
   */
  async createShop(data: ShopFormData): Promise<Shop>;
  async createShop<T extends ShopCreateOptions>(
    data: ShopFormData,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ data: ShopFormData } & T>>;
  async createShop<T extends ShopCreateOptions>(
    data: ShopFormData,
    options?: T
  ): Promise<Prisma.ShopGetPayload<{ data: ShopFormData } & T> | Shop> {
    const owner_id = await authUtils.getUserId();
    const query = {
      data: {
        ...data,
        owner: { connect: { id: owner_id } },
      },
      ...(options ?? {}),
    };
    return prisma.shop.create(query);
  }

  /**
   * Updates an existing shop's information.
   *
   * Modifies shop details such as name, description, location, and other attributes.
   * Essential for shop owners to keep their shop information current and accurate.
   * Supports flexible query options for returning updated shop data.
   *
   *
   */
  async updateShop(shop_id: string, data: ShopFormData): Promise<Shop>;
  async updateShop<T extends ShopUpdateOptions>(
    shop_id: string,
    data: ShopFormData,
    options: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string }; data: ShopFormData } & T>
  >;
  async updateShop<T extends ShopUpdateOptions>(
    shop_id: string,
    data: ShopFormData,
    options?: T
  ): Promise<
    | Prisma.ShopGetPayload<{ where: { id: string }; data: ShopFormData } & T>
    | Shop
  > {
    const query = { where: { id: shop_id }, data, ...(options ?? {}) };
    return prisma.shop.update(query);
  }

  /**
   * Deletes a shop from the system.
   *
   * Removes a shop from the database permanently. This is a critical operation
   * that should be used with caution as it affects all associated products and orders.
   * Supports flexible query options for returning deleted shop data.
   *
   * @param shop_id - The unique identifier of the shop to delete
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the deleted shop
   *
   * @throws {Error} When shop doesn't exist
   * @throws {Error} When shop has active orders (referential integrity)
   * @throws {Error} When unauthorized deletion is attempted
   * @throws {Error} When database deletion fails
   *
   */
  async deleteShop(shop_id: string): Promise<Shop>;
  async deleteShop<T extends ShopDeleteOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T>>;
  async deleteShop<T extends ShopDeleteOptions>(
    shop_id: string,
    options?: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop> {
    const query = { where: { id: shop_id }, ...(options ?? {}) };
    return prisma.shop.delete(query);
  }

  /**
   * Retrieves a shop by its unique identifier.
   *
   * Finds a specific shop using its ID. Essential for displaying shop details,
   * managing shop operations, and accessing shop-related information.
   * Supports flexible query options for including related data.
   *
   * @param shop_id - The unique identifier of the shop to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the shop or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid shop ID is provided
   */
  async getShopById(shop_id: string): Promise<Shop | null>;
  async getShopById<T extends ShopFindOptions>(
    shop_id: string,
    options: T
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | null>;
  async getShopById<T extends ShopFindOptions>(
    shop_id: string,
    options?: T
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop | null
  > {
    const query = { where: { id: shop_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  async getShops(): Promise<Shop[]>;
  async getShops<T extends ShopFindManyOptions>(
    options: T
  ): Promise<Prisma.ShopGetPayload<T>[]>;
  async getShops<T extends ShopFindManyOptions>(
    options?: T
  ): Promise<Prisma.ShopGetPayload<T>[] | Shop[]> {
    const query = { ...(options ?? {}) };
    return prisma.shop.findMany(query);
  }
}

/**
 * Singleton instance of the ShopRepository class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all shop-related database operations
 * including CRUD operations, owner-specific queries, and flexible data retrieval
 * with comprehensive validation and type safety.
 *
 */
export const shopRepository = new ShopRepository();

export default shopRepository;
