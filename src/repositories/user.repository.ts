import { Prisma, Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateUserDto = Omit<Prisma.UserCreateInput, "role">;

export type UpdateUserDto = Prisma.UserUpdateInput;

type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;

class UserRepository {
  async findAdmins(): Promise<User[]>;
  async findAdmins<T extends UserFindOptions>(
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { role: Role } } & T>[]>;
  async findAdmins(): Promise<User[]> {
    return prisma.user.findMany({ where: { role: Role.ADMIN } });
  }
  async findById(id: string): Promise<User | null>;
  async findById<T extends UserFindOptions>(
    id: string,
    options: T
  ): Promise<Prisma.UserGetPayload<{ where: { id: string } } & T> | null>;
  async findById<T extends UserFindOptions>(
    id: string,
    options?: T
  ): Promise<
    Prisma.UserGetPayload<{ where: { id: string } } & T> | User | null
  > {
    return prisma.user.findUnique({ where: { id }, ...options });
  }

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

  async create(data: Prisma.UserCreateArgs): Promise<User> {
    return prisma.user.create(data);
  }

  async update(user_id: string, data: UpdateUserDto): Promise<User> {
    return prisma.user.update({ where: { id: user_id }, data });
  }

  async delete(user_id: string): Promise<User> {
    return prisma.user.delete({ where: { id: user_id } });
  }
  async findMany<T extends Prisma.UserFindManyArgs>(
    options: T
  ): Promise<Prisma.UserGetPayload<T>[]>;
  async findMany(options: Prisma.UserFindManyArgs): Promise<User[]>;
  async findMany<T extends Prisma.UserFindManyArgs>(
    options: T
  ): Promise<Prisma.UserGetPayload<T>[] | User[]> {
    return prisma.user.findMany(options);
  }
  async count<T extends Prisma.UserWhereInput>(where: T): Promise<number>;
  async count<T extends Prisma.UserWhereInput>(where: T): Promise<number> {
    return prisma.user.count({ where });
  }
}

export const userRepository = new UserRepository();

export default userRepository;
