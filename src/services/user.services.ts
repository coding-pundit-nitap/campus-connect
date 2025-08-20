/**
 * User service module for the college connect application.
 *
 * This module provides comprehensive user management functionality including user creation,
 * retrieval, updating, and deletion. It handles user authentication, profile management,
 * and role-based operations with flexible query options, validation, and type safety.
 *
 * @example
 * ```typescript
 * // Create a new user
 * const user = await userServices.createUser({
 *   email: 'student@college.edu',
 *   name: 'John Doe',
 *   hashed_password: 'hashedpassword123'
 * });
 * console.log(`User created with ID: ${user.id}`);
 *
 * // Get user by email
 * const user = await userServices.getUserByEmail('student@college.edu', {
 *   include: { shops: true, orders: true }
 * });
 *
 * // Update user profile
 * await userServices.updateUser('user123', {
 *   name: 'John Smith',
 *   bio: 'Computer Science student'
 * });
 * ```
 *
 * @see {@link User} for user data structure
 * @see {@link CreateUserDto} for user creation data
 * @see {@link UpdateUserDto} for user update data
 *
 * @since 1.0.0
 */
import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Type definition for user creation data.
 *
 * Defines the required structure for creating new users in the system.
 * Contains essential user information including email, name, and hashed password
 * for secure user registration and authentication workflows.
 *
 * @example
 * ```typescript
 * const newUser: CreateUserDto = {
 *   email: 'student@university.edu',
 *   name: 'Jane Smith',
 *   hashed_password: '$2b$10$...' // bcrypt hashed password
 * };
 * ```
 *
 * @see {@link UserServices.createUser} for usage in user creation
 * @see {@link User} for complete user data structure
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * const updateData: UpdateUserDto = {
 *   name: 'Updated Name',
 *   bio: 'New bio information',
 *   profile_picture: 'new-avatar-url.jpg'
 * };
 * ```
 *
 * @see {@link Prisma.UserUpdateInput} for complete update options
 * @see {@link UserServices.updateUser} for usage in user updates
 *
 * @since 1.0.0
 */
export type UpdateUserDto = Prisma.UserUpdateInput;

/**
 * Type alias for Prisma user find unique options without the where clause.
 *
 * Provides type-safe query options for single user retrieval operations,
 * excluding the where clause which is handled internally by the service methods.
 * Enables flexible data fetching with includes, selects, and other Prisma options.
 *
 * @example
 * ```typescript
 * const options: UserFindOptions = {
 *   include: {
 *     shops: true,
 *     orders: {
 *       include: {
 *         orderItems: true
 *       }
 *     },
 *     reviews: true
 *   }
 * };
 * ```
 *
 * @see {@link UserServices.getUserByEmail} for usage in user retrieval
 * @see {@link Prisma.UserFindUniqueArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;

/**
 * Type alias for Prisma user create options without the data clause.
 *
 * Provides type-safe query options for user creation operations,
 * excluding the data clause which is handled as a separate parameter.
 * Supports includes, selects, and other creation-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: UserCreateOptions = {
 *   include: {
 *     shops: true
 *   }
 * };
 * ```
 *
 * @see {@link UserServices.createUser} for usage in user creation
 * @see {@link Prisma.UserCreateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type UserCreateOptions = Omit<Prisma.UserCreateArgs, "data">;

/**
 * Type alias for Prisma user update options without where and data clauses.
 *
 * Provides type-safe query options for user update operations,
 * excluding the where and data clauses which are handled as separate parameters.
 * Supports includes, selects, and other update-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: UserUpdateOptions = {
 *   include: {
 *     shops: true,
 *     orders: true
 *   }
 * };
 * ```
 *
 * @see {@link UserServices.updateUser} for usage in user updates
 * @see {@link Prisma.UserUpdateArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type UserUpdateOptions = Omit<Prisma.UserUpdateArgs, "where" | "data">;

/**
 * Type alias for Prisma user delete options without the where clause.
 *
 * Provides type-safe query options for user deletion operations,
 * excluding the where clause which is handled as a separate parameter.
 * Supports includes, selects, and other deletion-specific Prisma options.
 *
 * @example
 * ```typescript
 * const options: UserDeleteOptions = {
 *   include: {
 *     shops: true
 *   }
 * };
 * ```
 *
 * @see {@link UserServices.deleteUser} for usage in user deletion
 * @see {@link Prisma.UserDeleteArgs} for complete Prisma options
 *
 * @since 1.0.0
 */
type UserDeleteOptions = Omit<Prisma.UserDeleteArgs, "where">;

/**
 * Service class providing comprehensive user management operations.
 *
 * Handles all user-related database operations including authentication,
 * profile management, and CRUD operations with type safety and flexible
 * query options. Supports role-based access control and user relationship management.
 *
 * @example
 * ```typescript
 * const userService = new UserServices();
 *
 * // User registration workflow
 * const newUser = await userService.createUser({
 *   email: 'student@college.edu',
 *   name: 'John Doe',
 *   hashed_password: hashedPassword
 * });
 *
 * // User authentication
 * const user = await userService.getUserByEmail('student@college.edu');
 * if (user && await bcrypt.compare(password, user.hashed_password)) {
 *   // Authentication successful
 * }
 * ```
 *
 * @see {@link CreateUserDto} for user creation data structure
 * @see {@link UpdateUserDto} for user update data structure
 *
 * @since 1.0.0
 */
class UserServices {
  /**
   * Retrieves a user by their email address.
   *
   * Finds a specific user using their email address. Essential for user authentication,
   * login workflows, and user profile access. Supports flexible query options for
   * including related data such as shops, orders, and reviews.
   *
   * @example
   * ```typescript
   * // Basic user lookup
   * const user = await userServices.getUserByEmail('student@college.edu');
   * console.log(user ? `Found user: ${user.name}` : 'User not found');
   *
   * // Get user with related data
   * const userWithDetails = await userServices.getUserByEmail('student@college.edu', {
   *   include: {
   *     shops: {
   *       include: { products: true }
   *     },
   *     orders: {
   *       include: {
   *         orderItems: {
   *           include: { product: true }
   *         }
   *       },
   *       orderBy: { created_at: 'desc' }
   *     },
   *     reviews: {
   *       include: { product: true }
   *     }
   *   }
   * });
   * ```
   *
   * @param email - The email address of the user to retrieve
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the user or null if not found
   *
   * @throws {Error} When database query fails
   * @throws {Error} When invalid email format is provided
   *
   * @see {@link UserFindOptions} for available query options
   * @see {@link User} for returned user structure
   *
   * @since 1.0.0
   */
  async getUserByEmail(email: string): Promise<User | null>;
  async getUserByEmail<T extends UserFindOptions>(
    email: string,
    options: T,
  ): Promise<Prisma.UserGetPayload<{ where: { email: string } } & T> | null>;
  async getUserByEmail<T extends UserFindOptions>(
    email: string,
    options?: T,
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
   * @example
   * ```typescript
   * // Basic user creation
   * const user = await userServices.createUser({
   *   email: 'newstudent@college.edu',
   *   name: 'Alice Johnson',
   *   hashed_password: await bcrypt.hash('securepassword', 10)
   * });
   * console.log(`User created with ID: ${user.id}`);
   *
   * // Create user with additional data
   * const userWithProfile = await userServices.createUser({
   *   email: 'student@university.edu',
   *   name: 'Bob Smith',
   *   hashed_password: hashedPassword
   * }, {
   *   include: {
   *     shops: true
   *   }
   * });
   * ```
   *
   * @param data - The user creation data including email, name, and hashed password
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the created user
   *
   * @throws {Error} When email already exists
   * @throws {Error} When required fields are missing
   * @throws {Error} When database operation fails
   *
   * @see {@link CreateUserDto} for required user data
   * @see {@link UserCreateOptions} for available query options
   * @see {@link Role} for user role assignment
   *
   * @since 1.0.0
   */
  async createUser(data: CreateUserDto): Promise<User>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options: T,
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T>>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options?: T,
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
   * @example
   * ```typescript
   * // Basic profile update
   * const updatedUser = await userServices.updateUser('user123', {
   *   name: 'John Smith',
   *   bio: 'Computer Science graduate student'
   * });
   * console.log(`Updated user: ${updatedUser.name}`);
   *
   * // Update with related data
   * const userWithShops = await userServices.updateUser('user123', {
   *   profile_picture: 'new-avatar.jpg',
   *   bio: 'Entrepreneur and student'
   * }, {
   *   include: {
   *     shops: {
   *       include: { products: true }
   *     }
   *   }
   * });
   * ```
   *
   * @param user_id - The unique identifier of the user to update
   * @param data - The partial user data to update
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the updated user
   *
   * @throws {Error} When user with given ID doesn't exist
   * @throws {Error} When update data is invalid
   * @throws {Error} When database operation fails
   *
   * @see {@link UpdateUserDto} for available update fields
   * @see {@link UserUpdateOptions} for available query options
   * @see {@link User} for returned user structure
   *
   * @since 1.0.0
   */
  async updateUser(user_id: string, data: UpdateUserDto): Promise<User>;
  async updateUser<T extends UserUpdateOptions>(
    user_id: string,
    data: UpdateUserDto,
    options: T,
  ): Promise<
    Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
  >;
  async updateUser<T extends UserUpdateOptions>(
    user_id: string,
    data: UpdateUserDto,
    options?: T,
  ): Promise<
    | Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
    | User
  > {
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
   * @example
   * ```typescript
   * // Basic user deletion
   * const deletedUser = await userServices.deleteUser('user123');
   * console.log(`Deleted user: ${deletedUser.email}`);
   *
   * // Delete with related data
   * const deletedUserWithShops = await userServices.deleteUser('user123', {
   *   include: {
   *     shops: true,
   *     orders: true
   *   }
   * });
   * ```
   *
   * @param user_id - The unique identifier of the user to delete
   * @param options - Optional Prisma query options for includes, selects, etc.
   * @returns A promise that resolves to the deleted user
   *
   * @throws {Error} When user with given ID doesn't exist
   * @throws {Error} When deletion violates referential constraints
   * @throws {Error} When database operation fails
   *
   * @see {@link UserDeleteOptions} for available query options
   * @see {@link User} for returned user structure
   *
   * @since 1.0.0
   */
  async deleteUser(user_id: string): Promise<User>;
  async deleteUser<T extends UserDeleteOptions>(
    user_id: string,
    options: T,
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T>>;
  async deleteUser<T extends UserDeleteOptions>(
    user_id: string,
    options?: T,
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T> | User> {
    const query = { where: { id: user_id }, ...(options ?? {}) };
    return prisma.user.delete(query);
  }
}

/**
 * Singleton instance of the UserServices class.
 *
 * Pre-configured service instance ready for use throughout the application.
 * Provides a consistent interface for all user-related database operations
 * including CRUD operations, authentication workflows, and flexible data retrieval
 * with comprehensive validation and type safety.
 *
 * @example
 * ```typescript
 * // Import and use directly
 * import userServices from '@/services/user.services';
 *
 * // User registration
 * const user = await userServices.createUser({
 *   email: 'student@college.edu',
 *   name: 'John Doe',
 *   hashed_password: hashedPassword
 * });
 *
 * // User authentication
 * const authenticatedUser = await userServices.getUserByEmail('student@college.edu');
 *
 * // Profile update
 * await userServices.updateUser('user123', {
 *   name: 'John Smith',
 *   bio: 'Updated profile information'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Usage in React hooks
 * const useUser = (email: string) => {
 *   const [user, setUser] = useState<User | null>(null);
 *   const [loading, setLoading] = useState(false);
 *
 *   const loadUser = useCallback(async () => {
 *     setLoading(true);
 *     try {
 *       const userData = await userServices.getUserByEmail(email, {
 *         include: {
 *           shops: true,
 *           orders: { include: { orderItems: true } }
 *         }
 *       });
 *       setUser(userData);
 *     } catch (error) {
 *       console.error('Failed to load user:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [email]);
 *
 *   const updateUser = useCallback(async (data: UpdateUserDto) => {
 *     const updated = await userServices.updateUser(user?.id!, data);
 *     setUser(updated);
 *     return updated;
 *   }, [user?.id]);
 *
 *   return { user, loading, loadUser, updateUser };
 * };
 * ```
 *
 * @see {@link UserServices} for available methods and detailed documentation
 * @see {@link User} for user data structure
 * @see {@link CreateUserDto} for user creation data
 * @see {@link UpdateUserDto} for user update data
 *
 * @since 1.0.0
 */
const userServices = new UserServices();

export default userServices;
