import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserDto = {
  email: string;
  name: string;
  hashed_password: string;
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
    const query = {
      data: {
        role: Role.USER,
        ...data,
      },
      ...(options ?? {}),
    };
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
