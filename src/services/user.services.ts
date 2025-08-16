import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";

export type CreateUserDto = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};
export type UpdateUserDto = Prisma.UserUpdateInput;

type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;
type UserCreateOptions = Omit<Prisma.UserCreateArgs, "data">;
type UserUpdateOptions = Omit<Prisma.UserUpdateArgs, "where" | "data">;
type UserDeleteOptions = Omit<Prisma.UserDeleteArgs, "where">;

class UserServices {
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

  async createUser(data: CreateUserDto): Promise<User>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options: T,
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T>>;
  async createUser<T extends UserCreateOptions>(
    data: CreateUserDto,
    options?: T,
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T> | User> {
    const parsedData = registerSchema.safeParse(data);
    if (!parsedData.success) {
      throw new Error("Invalid user data");
    }
    const { email, name, password } = parsedData.data;
    const query = {
      data: {
        email,
        name,
        hash_password: await hashPassword(password),
        role: Role.USER,
      },
      ...(options ?? {}),
    };

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    return prisma.user.create(query);
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<User>;
  async updateUser<T extends UserUpdateOptions>(
    userId: string,
    data: UpdateUserDto,
    options: T,
  ): Promise<
    Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
  >;
  async updateUser<T extends UserUpdateOptions>(
    userId: string,
    data: UpdateUserDto,
    options?: T,
  ): Promise<
    | Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
    | User
  > {
    const query = { where: { id: userId }, data, ...(options ?? {}) };
    return prisma.user.update(query);
  }

  async deleteUser(userId: string): Promise<User>;
  async deleteUser<T extends UserDeleteOptions>(
    userId: string,
    options: T,
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T>>;
  async deleteUser<T extends UserDeleteOptions>(
    userId: string,
    options?: T,
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T> | User> {
    const query = { where: { id: userId }, ...(options ?? {}) };
    return prisma.user.delete(query);
  }
}

const userServices = new UserServices();

export default userServices;
