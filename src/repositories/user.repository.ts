import { Prisma, Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateUserDto = Omit<Prisma.UserCreateInput, "role">;

export type UpdateUserDto = Prisma.UserUpdateInput;

type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;

type UserCreateOptions = Omit<Prisma.UserCreateArgs, "data">;

type UserUpdateOptions = Omit<Prisma.UserUpdateArgs, "where" | "data">;

type UserDeleteOptions = Omit<Prisma.UserDeleteArgs, "where">;

class UserRepository {
  async findByEmail(email: string): Promise<User | null>;
  async findByEmail<T extends UserFindOptions>(
    email: string,
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { email: string } } & T> | null>;
  async findByEmail<T extends UserFindOptions>(
    email: string,
    options?: T
  ): Promise<
    Prisma.UserGetPayload<{ where: { email: string } } & T> | User | null
  > {
    const query = { where: { email }, ...(options ?? {}) };
    return prisma.user.findUnique(query);
  }

  async create(data: CreateUserDto): Promise<User>;
  async create<T extends UserCreateOptions>(
    data: CreateUserDto,
    options: T
  ): Promise<Prisma.UserGetPayload<{ data: CreateUserDto } & T>>;
  async create<T extends UserCreateOptions>(
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

  async update(user_id: string, data: UpdateUserDto): Promise<User>;
  async update<T extends UserUpdateOptions>(
    user_id: string,
    data: UpdateUserDto,
    options: T
  ): Promise<
    Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
  >;
  async update<T extends UserUpdateOptions>(
    user_id: string,
    data: UpdateUserDto,
    options?: T
  ): Promise<
    | Prisma.UserGetPayload<{ where: { id: string }; data: UpdateUserDto } & T>
    | User
  > {
    const query = { where: { id: user_id }, data, ...(options ?? {}) };
    return prisma.user.update(query);
  }

  async delete(user_id: string): Promise<User>;
  async delete<T extends UserDeleteOptions>(
    user_id: string,
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T>>;
  async delete(user_id: string): Promise<User>;
  async delete<T extends UserDeleteOptions>(
    user_id: string,
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T>>;
  async delete<T extends UserDeleteOptions>(
    user_id: string,
    options?: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T> | User> {
    const query = { where: { id: user_id }, ...(options ?? {}) };
    return prisma.user.delete(query);
  }
}

export const userRepository = new UserRepository();

export default userRepository;
