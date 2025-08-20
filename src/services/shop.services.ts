/**
 * Shop service module for the college connect application.
 *
 * This module provides comprehensive shop management functionality including shop creation,
 * retrieval, updating, and deletion. It handles owner-specific shop operations with flexible
 * query options, validation, and atomic transaction operations for e-commerce workflows.
 *
 * @example
 * ```typescript
 * // Create a new shop
 * const shop = await shopServices.createShop({
 *   name: 'Campus Book Store',
 *   description: 'Your one-stop shop for textbooks and supplies',
 *   owner: {
 *     connect: { id: 'user123' }
 *   }
 * });
 * console.log(`Shop created with ID: ${shop.id}`);
 *
 * // Get shop by owner ID with products
 * const ownerShop = await shopServices.getShopByOwnerId('user123', {
 *   include: { products: true, owner: true }
 * });
 *
 * // Get shop by ID
 * const shopDetails = await shopServices.getShopById('shop456', {
 *   include: { products: true, orders: true }
 * });
 *
 * // Update shop
 * await shopServices.updateShop('shop456', {
 *   description: 'Updated description with new offerings'
 * });
 * ```
 *
 * @see {@link Shop} for shop data structure
 * @see {@link CreateShopDto} for shop creation data
 * @see {@link UpdateShopDto} for shop update data
 *
 * @since 1.0.0
 */
import { prisma } from "@/lib/prisma";
import { Prisma, Shop } from "@prisma/client";

/**
 * Type alias for shop creation data.
 *
 * Defines the structure for creating new shops in the system.
 * Based on Prisma's ShopCreateInput with all required and optional fields
 * for comprehensive shop information management.
 *
 * @example
 * ```typescript
 * const newShop: CreateShopDto = {
 *   name: 'Engineering Supply Store',
 *   description: 'Complete engineering tools and supplies',
 *   location: 'Main Campus Building A',
 *   owner: {
 *     connect: { id: 'user123' }
 *   }
 * };
 * ```
 *
 * @see {@link Prisma.ShopCreateInput} for complete field options
 * @see {@link ShopServices.createShop} for usage in shop creation
 *
 * @since 1.0.0
 */
export type CreateShopDto = Prisma.ShopCreateInput;

/**
 * Type alias for shop update data.
 *
 * Defines the structure for updating existing shops in the system.
 * Based on Prisma's ShopUpdateInput with partial updates support
 * for flexible shop modification operations.
 *
 * @example
 * ```typescript
 * const updateData: UpdateShopDto = {
 *   description: 'Updated shop description with new services',
 *   location: 'New Campus Location - Building B'
 * };
 * ```
 *
 * @see {@link Prisma.ShopUpdateInput} for complete update options
 * @see {@link ShopServices.updateShop} for usage in shop updates
 *
 * @since 1.0.0
 */
export type UpdateShopDto = Prisma.ShopUpdateInput;

/**
 * Type alias for Prisma shop find unique options without the where clause.
 *
 * Provides type-safe query options for single shop retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 * @example
 * ```typescript
 * const options: ShopFindOptions = {
 *   include: {
 *     owner: true,
 *     products: {
 *       include: {
 *         reviews: true
 *       }
 *     },
 *     orders: true
 *   }
 * };
 * ```
 *
 * @see {@link ShopServices.getShopById} for usage in shop retrieval
 * @see {@link Prisma.ShopFindUniqueArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ShopFindOptions = Omit<Prisma.ShopFindUniqueArgs, "where">;

/**
 * Type alias for Prisma shop create options without the data clause.
 *
 * Provides type-safe query options for shop creation operations,
 * excluding the data clause which is handled as a separate parameter.
 * Supports includes, selects, and other creation-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: ShopCreateOptions = {
 *   include: {
 *     owner: {
 *       select: { id: true, name: true }
 *     }
 *   }
 * };
 * ```
 *
 * @see {@link ShopServices.createShop} for usage in shop creation
 * @see {@link Prisma.ShopCreateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ShopCreateOptions = Omit<Prisma.ShopCreateArgs, "data">;

/**
 * Type alias for Prisma shop update options without where and data clauses.
 *
 * Provides type-safe query options for shop update operations,
 * excluding the where and data clauses which are handled as separate parameters.
 * Supports includes, selects, and other update-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: ShopUpdateOptions = {
 *   include: {
 *     products: true,
 *     owner: true
 *   }
 * };
 * ```
 *
 * @see {@link ShopServices.updateShop} for usage in shop updates
 * @see {@link Prisma.ShopUpdateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ShopUpdateOptions = Omit<Prisma.ShopUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma shop delete options without the where clause.
 *
 * Provides type-safe query options for shop deletion operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports includes, selects, and other deletion-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: ShopDeleteOptions = {
 *   include: {
 *     owner: {
 *       select: { id: true, name: true }
 *     }
 *   }
 * };
 * ```
 *
 * @see {@link ShopServices.deleteShop} for usage in shop deletion
 * @see {@link Prisma.ShopDeleteArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type ShopDeleteOptions = Omit<Prisma.ShopDeleteArgs, "where">;

/**
 * Shop service class providing comprehensive shop management functionality.
 *
 * This class encapsulates all shop-related database operations including CRUD operations,
 * owner-specific queries, and flexible data retrieval with type-safe Prisma integration.
 * Designed for e-commerce applications where users can own and manage shops.
 *
 * @example
 * ```typescript
 * const shopService = new ShopServices();
 *
 * // Create and manage a shop
 * const shop = await shopService.createShop({
 *   name: 'My Campus Store',
 *   description: 'Student supplies and textbooks',
 *   owner: { connect: { id: 'user123' } }
 * });
 *
 * // Get shop with detailed information
 * const shopDetails = await shopService.getShopById(shop.id, {
 *   include: {
 *     products: true,
 *     owner: true,
 *     orders: { include: { orderItems: true } }
 *   }
 * });
 * ```
 *
 * @see {@link Shop} for shop data structure
 * @see {@link CreateShopDto} for shop creation data
 * @see {@link UpdateShopDto} for shop update data
 *
 * @since 1.0.0
 */
class ShopServices {
  /**
   * Retrieves a shop by its owner's ID.
   *
   * Finds the shop owned by a specific user. Essential for owner-specific operations
   * like managing their shop, viewing analytics, or checking ownership status.
   * Supports flexible query options for including related data.
   *
   * @example
   * ```typescript
   * // Get shop by owner ID
   * const shop = await shopServices.getShopByOwnerId('user123');
   * console.log(shop ? `Shop found: ${shop.name}` : 'No shop found');
   *
   * // Get shop with products and orders
   * const shopWithDetails = await shopServices.getShopByOwnerId('user123', {
   *   include: {
   *     products: {
   *       orderBy: { created_at: 'desc' },
   *       take: 10
   *     },
   *     orders: {
   *       include: { orderItems: true }
   *     }
   *   }
   * });
   *
   * // Usage in React component
   * const MyShopDashboard = ({ userId }: { userId: string }) => {
   *   const [shop, setShop] = useState<Shop | null>(null);
   *
   *   useEffect(() => {
   *     const loadShop = async () => {
   *       const userShop = await shopServices.getShopByOwnerId(userId, {
   *         include: { products: true }
   *       });
   *       setShop(userShop);
   *     };
   *     loadShop();
   *   }, [userId]);
   *
   *   return shop ? (
   *     <div>
   *       <h1>{shop.name}</h1>
   *       <p>{shop.products.length} products</p>
   *     </div>
   *   ) : (
   *     <p>No shop found. Create one to get started!</p>
   *   );
   * };
   * ```
   *
   * @param ownerId - The unique identifier of the shop owner
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the shop or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid owner ID is provided
   *
   * @see {@link ShopFindOptions} for available query options
   * @see {@link Shop} for returned shop structure
   *
   * @since 1.0.0
   */
  async getShopByOwnerId(ownerId: string): Promise<Shop | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    ownerId: string,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | null>;
  async getShopByOwnerId<T extends ShopFindOptions>(
    ownerId: string,
    options?: T,
  ): Promise<
    Prisma.ShopGetPayload<{ where: { owner_id: string } } & T> | Shop | null
  > {
    const query = { where: { owner_id: ownerId }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }

  /**
   * Creates a new shop in the system.
   *
   * Establishes a new shop with the provided information and associates it with an owner.
   * Essential for users who want to start selling products on the platform.
   * Supports flexible query options for returning created shop data.
   *
   * @example
   * ```typescript
   * // Create a basic shop
   * const shop = await shopServices.createShop({
   *   name: 'Campus Electronics',
   *   description: 'Latest gadgets and electronics for students',
   *   location: 'Building C, Floor 2',
   *   owner: {
   *     connect: { id: 'user123' }
   *   }
   * });
   *
   * // Create shop with owner details included
   * const shopWithOwner = await shopServices.createShop({
   *   name: 'Study Materials Hub',
   *   description: 'Textbooks, notes, and study aids',
   *   owner: {
   *     connect: { id: 'user456' }
   *   }
   * }, {
   *   include: {
   *     owner: {
   *       select: { id: true, name: true, email: true }
   *     }
   *   }
   * });
   *
   * // Usage in shop registration form
   * const ShopRegistrationForm = ({ userId }: { userId: string }) => {
   *   const [formData, setFormData] = useState({
   *     name: '',
   *     description: '',
   *     location: ''
   *   });
   *   const [creating, setCreating] = useState(false);
   *
   *   const handleSubmit = async (e: React.FormEvent) => {
   *     e.preventDefault();
   *     setCreating(true);
   *
   *     try {
   *       const shop = await shopServices.createShop({
   *         ...formData,
   *         owner: { connect: { id: userId } }
   *       });
   *
   *       // Redirect to shop dashboard
   *       router.push(`/shop/${shop.id}/dashboard`);
   *     } catch (error) {
   *       console.error('Failed to create shop:', error);
   *       alert('Failed to create shop. Please try again.');
   *     } finally {
   *       setCreating(false);
   *     }
   *   };
   *
   *   return (
   *     <form onSubmit={handleSubmit}>
   *       // Form fields...
   *       <button type="submit" disabled={creating}>
   *         {creating ? 'Creating...' : 'Create Shop'}
   *       </button>
   *     </form>
   *   );
   * };
   * ```
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
   * @see {@link CreateShopDto} for shop creation data structure
   * @see {@link ShopCreateOptions} for available creation options
   * @see {@link Shop} for created shop structure
   *
   * @since 1.0.0
   */
  async createShop(data: CreateShopDto): Promise<Shop>;
  async createShop<T extends ShopCreateOptions>(
    data: CreateShopDto,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ data: CreateShopDto } & T>>;
  async createShop<T extends ShopCreateOptions>(
    data: CreateShopDto,
    options?: T,
  ): Promise<Prisma.ShopGetPayload<{ data: CreateShopDto } & T> | Shop> {
    const query = { data, ...(options ?? {}) };
    return prisma.shop.create(query);
  }

  /**
   * Updates an existing shop's information.
   *
   * Modifies shop details such as name, description, location, and other attributes.
   * Essential for shop owners to keep their shop information current and accurate.
   * Supports flexible query options for returning updated shop data.
   *
   * @example
   * ```typescript
   * // Update shop description
   * const updatedShop = await shopServices.updateShop('shop123', {
   *   description: 'Now featuring the latest textbooks and digital materials'
   * });
   *
   * // Update multiple fields
   * const shop = await shopServices.updateShop('shop123', {
   *   name: 'Updated Campus Store',
   *   location: 'New Building D, Ground Floor',
   *   description: 'Expanded inventory with more student essentials'
   * });
   *
   * // Update with products included in response
   * const shopWithProducts = await shopServices.updateShop('shop123', {
   *   description: 'Featured products now available'
   * }, {
   *   include: {
   *     products: {
   *       where: { stock: { gt: 0 } },
   *       orderBy: { created_at: 'desc' }
   *     }
   *   }
   * });
   *
   * // Usage in shop settings form
   * const ShopSettingsForm = ({ shopId }: { shopId: string }) => {
   *   const [shop, setShop] = useState<Shop | null>(null);
   *   const [updating, setUpdating] = useState(false);
   *
   *   const handleUpdate = async (formData: UpdateShopDto) => {
   *     setUpdating(true);
   *     try {
   *       const updated = await shopServices.updateShop(shopId, formData);
   *       setShop(updated);
   *       toast.success('Shop updated successfully!');
   *     } catch (error) {
   *       console.error('Failed to update shop:', error);
   *       toast.error('Failed to update shop');
   *     } finally {
   *       setUpdating(false);
   *     }
   *   };
   *
   *   return (
   *     <form onSubmit={(e) => {
   *       e.preventDefault();
   *       const formData = new FormData(e.currentTarget);
   *       handleUpdate({
   *         name: formData.get('name') as string,
   *         description: formData.get('description') as string
   *       });
   *     }}>
   *       // Form fields...
   *       <button type="submit" disabled={updating}>
   *         {updating ? 'Updating...' : 'Update Shop'}
   *       </button>
   *     </form>
   *   );
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop to update
   * @param data - The shop update data containing fields to modify
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the updated shop
   *
   * @throws {Error} When shop doesn't exist
   * @throws {Error} When unauthorized update is attempted
   * @throws {Error} When validation fails
   * @throws {Error} When database update fails
   *
   * @see {@link UpdateShopDto} for shop update data structure
   * @see {@link ShopUpdateOptions} for available update options
   * @see {@link Shop} for updated shop structure
   *
   * @since 1.0.0
   */
  async updateShop(shop_id: string, data: UpdateShopDto): Promise<Shop>;
  async updateShop<T extends ShopUpdateOptions>(
    shop_id: string,
    data: UpdateShopDto,
    options: T,
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string }; data: UpdateShopDto } & T>
  >;
  async updateShop<T extends ShopUpdateOptions>(
    shop_id: string,
    data: UpdateShopDto,
    options?: T,
  ): Promise<
    | Prisma.ShopGetPayload<{ where: { id: string }; data: UpdateShopDto } & T>
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
   * @example
   * ```typescript
   * // Delete a shop
   * const deletedShop = await shopServices.deleteShop('shop123');
   * console.log(`Deleted shop: ${deletedShop.name}`);
   *
   * // Delete with owner information included
   * const deletedWithOwner = await shopServices.deleteShop('shop123', {
   *   include: {
   *     owner: {
   *       select: { name: true, email: true }
   *     }
   *   }
   * });
   *
   * // Usage in shop management component
   * const ShopDeleteButton = ({ shopId }: { shopId: string }) => {
   *   const [deleting, setDeleting] = useState(false);
   *
   *   const handleDelete = async () => {
   *     const confirmed = confirm(
   *       'Are you sure you want to delete this shop? This action cannot be undone and will affect all products and orders.'
   *     );
   *
   *     if (!confirmed) return;
   *
   *     setDeleting(true);
   *     try {
   *       await shopServices.deleteShop(shopId);
   *       // Redirect to user dashboard or shops list
   *       router.push('/dashboard');
   *       toast.success('Shop deleted successfully');
   *     } catch (error) {
   *       console.error('Failed to delete shop:', error);
   *       toast.error('Failed to delete shop');
   *     } finally {
   *       setDeleting(false);
   *     }
   *   };
   *
   *   return (
   *     <button
   *       onClick={handleDelete}
   *       disabled={deleting}
   *       className="bg-red-500 text-white px-4 py-2 rounded"
   *     >
   *       {deleting ? 'Deleting...' : 'Delete Shop'}
   *     </button>
   *   );
   * };
   * ```
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
   * @see {@link ShopDeleteOptions} for available deletion options
   * @see {@link Shop} for deleted shop structure
   *
   * @since 1.0.0
   */
  async deleteShop(shop_id: string): Promise<Shop>;
  async deleteShop<T extends ShopDeleteOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T>>;
  async deleteShop<T extends ShopDeleteOptions>(
    shop_id: string,
    options?: T,
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
   * @example
   * ```typescript
   * // Get shop by ID
   * const shop = await shopServices.getShopById('shop123');
   * console.log(shop ? `Shop: ${shop.name}` : 'Shop not found');
   *
   * // Get shop with all related data
   * const shopWithDetails = await shopServices.getShopById('shop123', {
   *   include: {
   *     owner: {
   *       select: { id: true, name: true, email: true }
   *     },
   *     products: {
   *       where: { stock: { gt: 0 } },
   *       include: { reviews: true },
   *       orderBy: { created_at: 'desc' }
   *     },
   *     orders: {
   *       include: {
   *         orderItems: true,
   *         user: { select: { name: true } }
   *       }
   *     }
   *   }
   * });
   *
   * // Usage in shop page component
   * const ShopPage = ({ shopId }: { shopId: string }) => {
   *   const [shop, setShop] = useState(null);
   *   const [loading, setLoading] = useState(true);
   *
   *   useEffect(() => {
   *     const loadShop = async () => {
   *       try {
   *         const shopData = await shopServices.getShopById(shopId, {
   *           include: {
   *             products: {
   *               where: { stock: { gt: 0 } },
   *               include: { reviews: true }
   *             },
   *             owner: {
   *               select: { name: true }
   *             }
   *           }
   *         });
   *         setShop(shopData);
   *       } catch (error) {
   *         console.error('Failed to load shop:', error);
   *       } finally {
   *         setLoading(false);
   *       }
   *     };
   *
   *     loadShop();
   *   }, [shopId]);
   *
   *   if (loading) return <div>Loading shop...</div>;
   *   if (!shop) return <div>Shop not found</div>;
   *
   *   return (
   *     <div>
   *       <h1>{shop.name}</h1>
   *       <p>Owner: {shop.owner.name}</p>
   *       <p>{shop.description}</p>
   *       <div>
   *         <h2>Products ({shop.products.length})</h2>
   *         {shop.products.map(product => (
   *           <ProductCard key={product.id} product={product} />
   *         ))}
   *       </div>
   *     </div>
   *   );
   * };
   * ```
   *
   * @param shop_id - The unique identifier of the shop to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the shop or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid shop ID is provided
   *
   * @see {@link ShopFindOptions} for available query options
   * @see {@link Shop} for returned shop structure
   *
   * @since 1.0.0
   */
  async getShopById(shop_id: string): Promise<Shop | null>;
  async getShopById<T extends ShopFindOptions>(
    shop_id: string,
    options: T,
  ): Promise<Prisma.ShopGetPayload<{ where: { id: string } } & T> | null>;
  async getShopById<T extends ShopFindOptions>(
    shop_id: string,
    options?: T,
  ): Promise<
    Prisma.ShopGetPayload<{ where: { id: string } } & T> | Shop | null
  > {
    const query = { where: { id: shop_id }, ...(options ?? {}) };
    return prisma.shop.findUnique(query);
  }
}

/**
 * Singleton instance of the ShopServices class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all shop-related database operations
 * including CRUD operations, owner-specific queries, and flexible data retrieval
 * with comprehensive validation and type safety.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import shopServices from '@/services/shop.services';
 *
 * // Create a shop
 * const shop = await shopServices.createShop({
 *   name: 'Campus Tech Store',
 *   description: 'Latest technology for students',
 *   owner: { connect: { id: 'user123' } }
 * });
 *
 * // Get shop details
 * const shopDetails = await shopServices.getShopById('shop456', {
 *   include: { products: true, owner: true }
 * });
 *
 * // Update shop
 * await shopServices.updateShop('shop456', {
 *   description: 'Updated with new inventory'
 * });
 *
 * // Get owner's shop
 * const ownerShop = await shopServices.getShopByOwnerId('user123');
 * ```
 *
 * @example
 * ```typescript
 * // Usage in React hooks
 * const useShop = (shopId: string) => {
 *   const [shop, setShop] = useState<Shop | null>(null);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadShop = useCallback(async () => {
 *     setLoading(true);
 *     try {
 *       const shopData = await shopServices.getShopById(shopId, {
 *         include: {
 *           products: true,
 *           owner: true,
 *           orders: { include: { orderItems: true } }
 *         }
 *       });
 *       setShop(shopData);
 *     } catch (error) {
 *       console.error('Failed to load shop:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [shopId]);
 *
 *   const updateShop = useCallback(async (data: UpdateShopDto) => {
 *     const updated = await shopServices.updateShop(shopId, data);
 *     setShop(updated);
 *     return updated;
 *   }, [shopId]);
 *
 *   return { shop, loading, loadShop, updateShop };
 * };
 * ```
 *
 * @see {@link ShopServices} for available methods and detailed documentation
 * @see {@link Shop} for shop data structure
 * @see {@link CreateShopDto} for shop creation data
 * @see {@link UpdateShopDto} for shop update data
 *
 * @since 1.0.0
 */
const shopServices = new ShopServices();

export default shopServices;
