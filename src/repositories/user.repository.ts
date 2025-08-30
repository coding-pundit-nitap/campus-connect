/**
 * User service module for the college connect application.
 *
 * This module provides comprehensive user management functionality including user creation,
 * retrieval, updating, and deletion. It handles user authentication, profile management,
 * and role-based operations with flexible query options, validation, and type safety.
 *
 */
import { Prisma, Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils";

/**
 * Type definition for user creation data.
 *
 * Defines the required structure for creating new users in the system.
 * Contains essential user information including email, name, and hashed password
 * for secure user registration and authentication workflows.
 *
 */
export type CreateUserDto = {
  email: string;
  name: string;
  hashed_password: string;
};

/**
 * Type alias for user update data.
 *
 * Defines the structure for updating existing users in the system.
 * Based on Prisma's UserUpdateInput with partial updates support
 * for flexible user profile modification operations.
 *
 */
export type UpdateUserDto = Prisma.UserUpdateInput;

/**
 * Type alias for Prisma user find unique options without the where clause.
 *
 * Provides type-safe query options for single user retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 */
type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;

/**
 * Type alias for Prisma user create options without the data clause.
 *
 * Provides type-safe query options for user creation operations,
 * excluding the data clause which is handled as a separate parameter.
 * Supports includes, selects, and other creation-specific Prisma options.
 *
 */
type UserCreateOptions = Omit<Prisma.UserCreateArgs, "data">;

/**
 * Type alias for Prisma user update options without where and data clauses.
 *
 * Provides type-safe query options for user update operations,
 * excluding the where and data clauses which are handled as separate parameters.
 * Supports includes, selects, and other update-specific Prisma options.
 *
 */
type UserUpdateOptions = Omit<Prisma.UserUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma user delete options without the where clause.
 *
 * Provides type-safe query options for user deletion operations,
 * excluding the where clause which is handled as a separate parameter.
 * Supports includes, selects, and other deletion-specific Prisma options.
 *
 */
type UserDeleteOptions = Omit<Prisma.UserDeleteArgs, "where">;

/**
 * Service class providing comprehensive user management operations.
 *
 * Handles all user-related database operations including authentication,
 * profile management, and CRUD operations with type safety and flexible
 * query options. Supports role-based access control and user relationship management.
 */
class UserRepository {
  /**
   * Retrieves a user by their email address.
   *
   * Finds a specific user using their email address. Essential for user authentication,
   * login workflows, and user profile access. Supports flexible query options for
   * including related data such as shops, orders, and reviews.
   *
   * @param email - The email address of the user to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the user or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid email format is provided
   *
   */
  async getUserByEmail(email: string): Promise<User | null>;
  async getUserByEmail<T extends UserFindOptions>(
    email: string,
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { email: string } } & T> | null>;
  async getUserByEmail<T extends UserFindOptions>(
    email: string,
    options?: T
  ): Promise<
    Prisma.UserGetPayload<{ where: { email: string } } & T> | User | null
  > {
    const query = { where: { email }, ...(options ?? {}) };
    return prisma.user.findUnique(query);
  }

  /**
   * Creates a new user in the system.
   *
   * Registers a new user with default USER role. Handles user creation with
   * required fields validation and automatic role assignment. Essential for
   * user registration workflows and account management.
   *
   * @param data - The user creation data including email, name, and hashed password
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the created user
   *
   * @throws {Error} When email already exists
   * @throws {Error} When required fields are missing
   * @throws {Error} When database operation fails
   *
   */
  async createUser(data: CreateUserDto): Promise<User>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options: T
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T>>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options?: T
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T> | User> {
    const query = {
      data: {
        role: Role.USER,
        ...data,
      },
      ...(options ?? {}),
    };
    return prisma.user.create(query);
  }

  /**
   * Updates an existing user's information.
   *
   * Modifies user data with partial update support. Handles profile updates,
   * role changes, and other user information modifications. Essential for
   * user profile management and administrative operations.
   *
   * @param data - The partial user data to update
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the updated user
   *
   * @throws {Error} When user with given ID doesn't exist
   * @throws {Error} When update data is invalid
   * @throws {Error} When database operation fails
   *
   */
  async updateUser(data: UpdateUserDto): Promise<User>;
  async updateUser<T extends UserUpdateOptions>(
    data: UpdateUserDto,
    options: T
  ): Promise<
    Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
  >;
  async updateUser<T extends UserUpdateOptions>(
    data: UpdateUserDto,
    options?: T
  ): Promise<
    | Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
    | User
  > {
    const user_id = await authUtils.getUserId();
    const query = { where: { id: user_id }, data, ...(options ?? {}) };
    return prisma.user.update(query);
  }

  /**
   * Deletes a user from the system.
   *
   * Permanently removes a user and their associated data. Handles cascading
   * deletions for user-related entities. Use with caution as this operation
   * is irreversible and should include proper authorization checks.
   *
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the deleted user
   *
   * @throws {Error} When user with given ID doesn't exist
   * @throws {Error} When deletion violates referential constraints
   * @throws {Error} When database operation fails
   *
   */
  async deleteUser(): Promise<User>;
  async deleteUser<T extends UserDeleteOptions>(
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T>>;
  async deleteUser<T extends UserDeleteOptions>(
    options?: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T> | User> {
    const user_id = await authUtils.getUserId();
    const query = { where: { id: user_id }, ...(options ?? {}) };
    return prisma.user.delete(query);
  }
}

const userRepository = new UserRepository();

export default userRepository;
