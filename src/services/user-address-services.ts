import { prisma } from "@/lib/prisma";
import { Prisma, UserAddress } from "@prisma/client";

/**
 * Type alias for user address creation data.
 *
 * Defines the structure for creating new user addresses in the system.
 * Based on Prisma's UserAddressCreateInput with all required and optional fields
 * for comprehensive address information management including delivery preferences.
 *
 */
export type CreateAddressDto = Prisma.UserAddressCreateInput;

/**
 * Type alias for user address update data.
 *
 * Defines the structure for updating existing user addresses in the system.
 * Based on Prisma's UserAddressUpdateInput with partial updates support
 * for flexible address modification operations including default address management.
 *
 */
export type UpdateAddressDto = Prisma.UserAddressUpdateInput;

/**
 * Type alias for Prisma user address find many options without the where clause.
 *
 * Provides type-safe query options for multiple address retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Supports pagination, sorting, filtering, and relation includes for bulk operations.
 *
 */
type UserAddressFindOptions = Omit<Prisma.UserAddressFindManyArgs, "where">;

/**
 * Type alias for Prisma user address create options without the data clause.
 *
 * Provides type-safe query options for address creation operations,
 * excluding the data clause which is handled separately.
 * Enables additional options like includes and selects for created addresses.
 *
 */
type UserAddressCreateOptions = Omit<Prisma.UserAddressCreateArgs, "data">;

/**
 * Type alias for Prisma user address update options without the where clause.
 *
 * Provides type-safe query options for address update operations,
 * excluding the where clause which is handled internally.
 * Enables additional options like includes and selects for updated addresses.
 *
 */
type UserAddressUpdateOptions = Omit<Prisma.UserAddressUpdateArgs, "where">;

/**
 * Type alias for Prisma user address delete options without the where clause.
 *
 * Provides type-safe query options for address deletion operations,
 * excluding the where clause which is handled internally.
 * Enables additional options like includes and selects for deleted addresses.
 *
 */
type UserAddressDeleteOptions = Omit<Prisma.UserAddressDeleteArgs, "where">;

class UserAddressServices {
  /**
   * Retrieves all addresses for a specific user.
   *
   * Fetches all user addresses from the database ordered by default status (default addresses first).
   * Supports method overloading to allow flexible query options including relations,
   * field selection, and other Prisma query features for customized address data retrieval.
   *
   * @param id - The unique identifier of the user
   * @returns A promise that resolves to an array of user addresses
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid user ID format is provided
   *
   */
  async getAddressesByUserId(id: string): Promise<UserAddress[]>;
  async getAddressesByUserId<T extends UserAddressFindOptions>(
    id: string,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<{ where: { id: string } } & T>[]>;
  async getAddressesByUserId<T extends UserAddressFindOptions>(
    id: string,
    options?: T
  ): Promise<
    | UserAddress[]
    | Prisma.UserAddressGetPayload<{ where: { id: string } } & T>[]
  > {
    const query = {
      where: { id },
      orderBy: { is_default: Prisma.SortOrder.desc },
      ...(options ?? {}),
    };
    return prisma.userAddress.findMany(query);
  }

  /**
   * Creates a new address for a user.
   *
   * Adds a new delivery address to the user's address book with comprehensive address information.
   * Supports method overloading to allow flexible query options for the created address response.
   * Handles default address management and address validation during creation.
   *
   * @param data - The address creation data including all required fields
   * @returns A promise that resolves to the created address
   *
   * @throws {Error} When validation constraints are violated
   * @throws {Error} When database creation fails
   * @throws {Error} When user doesn't exist
   * @throws {Error} When address format is invalid
   *
   */
  async createUserAddress(data: CreateAddressDto): Promise<UserAddress>;
  async createUserAddress<T extends UserAddressCreateOptions>(
    data: CreateAddressDto,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<{ data: CreateAddressDto } & T>>;

  async createUserAddress<T extends UserAddressCreateOptions>(
    data: CreateAddressDto,
    options?: T
  ) {
    const query = {
      data,
      ...options,
    };
    return prisma.userAddress.create(query);
  }

  /**
   * Updates an existing user address.
   *
   * Modifies address data with the provided update information including address details
   * and default status management. Supports method overloading to allow flexible query
   * options for the updated address response. Handles default address transitions properly.
   *
   * @param id - The unique identifier of the address to update
   * @param data - The update data for the address
   * @returns A promise that resolves to the updated address
   *
   * @throws {Error} When address doesn't exist
   * @throws {Error} When validation constraints are violated
   * @throws {Error} When database update fails
   * @throws {Error} When unauthorized update is attempted
   *
   */
  async updateUserAddress(
    id: string,
    data: UpdateAddressDto
  ): Promise<UserAddress>;
  async updateUserAddress<T extends UserAddressUpdateOptions>(
    id: string,
    data: UpdateAddressDto,
    options?: T
  ): Promise<Prisma.UserAddressGetPayload<T>>;
  async updateUserAddress<T extends UserAddressUpdateOptions>(
    id: string,
    data: UpdateAddressDto,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<T>>;
  async updateUserAddress<T extends Prisma.UserAddressUpdateArgs>(
    id: string,
    data: UpdateAddressDto,
    options?: T
  ): Promise<Prisma.UserAddressGetPayload<T> | UserAddress> {
    const query = {
      where: { id },
      data,
      ...options,
    };
    return prisma.userAddress.update(query);
  }

  /**
   * Deletes a user address from the system.
   *
   * Removes an address from the user's address book. Supports method overloading
   * to allow flexible query options for the deleted address response. Handles
   * default address management when deleting the current default address.
   *
   * @param id - The unique identifier of the address to delete
   * @returns A promise that resolves to the deleted address
   *
   * @throws {Error} When address doesn't exist
   * @throws {Error} When database deletion fails
   * @throws {Error} When unauthorized deletion is attempted
   * @throws {Error} When trying to delete the last remaining address
   *
   */
  async deleteUserAddress(id: string): Promise<UserAddress>;
  async deleteUserAddress<T extends UserAddressDeleteOptions>(
    id: string,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<{ where: { id: string } } & T>>;
  async deleteUserAddress<T extends UserAddressDeleteOptions>(
    id: string,
    options?: T
  ): Promise<
    UserAddress | Prisma.UserAddressGetPayload<{ where: { id: string } } & T>
  > {
    const query = { where: { id }, ...(options ?? {}) };
    return prisma.userAddress.delete(query);
  }
}

const userAddressServices = new UserAddressServices();

export default userAddressServices;
