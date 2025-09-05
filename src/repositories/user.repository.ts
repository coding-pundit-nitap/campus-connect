import { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateUserDto = Omit<Prisma.UserCreateInput, "role">;

export type UpdateUserDto = Prisma.UserUpdateInput;

type UserFindOptions = Omit<Prisma.UserFindUniqueArgs, "where">;

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

  async create(data: Prisma.UserCreateArgs): Promise<User> {
    return prisma.user.create(data);
  }

  async update(user_id: string, data: UpdateUserDto): Promise<User> {
    return prisma.user.update({ where: { id: user_id }, data });
  }

  async delete(user_id: string): Promise<User> {
    return prisma.user.delete({ where: { id: user_id } });
  }
}

export const userRepository = new UserRepository();

export default userRepository;
