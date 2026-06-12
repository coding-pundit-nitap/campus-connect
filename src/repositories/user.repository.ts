import { Prisma, Role, User } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateUserDto = Omit<Prisma.UserCreateInput, "role">;

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserFindUniqueArgs,
  Prisma.UserFindManyArgs,
  Prisma.UserCreateArgs,
  Prisma.UserUpdateArgs,
  Prisma.UserDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.user);
  }

  async findAdmins(): Promise<User[]> {
    return this.findMany({ where: { role: Role.ADMIN } });
  }

  async findById(id: string): Promise<User | null>;
  async findById<T extends Omit<Prisma.UserFindUniqueArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.UserDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    id: string,
    options?: Omit<Prisma.UserFindUniqueArgs, "where">
  ): Promise<
    | User
    | null
    | Prisma.Result<
        Prisma.UserDelegate,
        Omit<Prisma.UserFindUniqueArgs, "where"> & { where: { id: string } },
        "findUnique"
      >
  > {
    return this.prismaClient.user.findUnique({
      where: { id },
      ...options,
    });
  }

  async findByEmail(email: string): Promise<User | null>;
  async findByEmail<T extends Omit<Prisma.UserFindUniqueArgs, "where">>(
    email: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.UserDelegate,
    T & { where: { email: string } },
    "findUnique"
  > | null>;
  async findByEmail(
    email: string,
    options?: Omit<Prisma.UserFindUniqueArgs, "where">
  ): Promise<
    | User
    | null
    | Prisma.Result<
        Prisma.UserDelegate,
        Omit<Prisma.UserFindUniqueArgs, "where"> & { where: { email: string } },
        "findUnique"
      >
  > {
    return this.prismaClient.user.findUnique({
      where: { email },
      ...options,
    });
  }

  async findUnique<T extends Prisma.UserFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.UserFindUniqueArgs
  ): Promise<User | null>;
  override async findUnique(
    args: Prisma.UserFindUniqueArgs
  ): Promise<
    | User
    | null
    | Prisma.Result<
        Prisma.UserDelegate,
        Prisma.UserFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.user.findUnique(args);
  }

  async findMany<T extends Prisma.UserFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.UserDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.UserFindManyArgs): Promise<User[]>;
  override async findMany(
    args?: Prisma.UserFindManyArgs
  ): Promise<
    | User[]
    | Prisma.Result<Prisma.UserDelegate, Prisma.UserFindManyArgs, "findMany">
  > {
    return this.prismaClient.user.findMany(args);
  }

  async create<T extends Prisma.UserCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserDelegate, T, "create">>;
  override async create(args: Prisma.UserCreateArgs): Promise<User>;
  override async create(
    args: Prisma.UserCreateArgs
  ): Promise<
    User | Prisma.Result<Prisma.UserDelegate, Prisma.UserCreateArgs, "create">
  > {
    return this.prismaClient.user.create(args);
  }

  async update<T extends Prisma.UserUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserDelegate, T, "update">>;
  override async update(args: Prisma.UserUpdateArgs): Promise<User>;
  async update<T extends Omit<Prisma.UserUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.UserUpdateInput,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.UserDelegate,
      T & { where: { id: string }; data: Prisma.UserUpdateInput },
      "update"
    >
  >;
  override async update(
    idOrArgs: string | Prisma.UserUpdateArgs,
    data?: Prisma.UserUpdateInput,
    options?: Omit<Prisma.UserUpdateArgs, "where" | "data">
  ): Promise<
    User | Prisma.Result<Prisma.UserDelegate, Prisma.UserUpdateArgs, "update">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.user.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.user.update(idOrArgs);
  }

  async delete<T extends Prisma.UserDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserDelegate, T, "delete">>;
  override async delete(args: Prisma.UserDeleteArgs): Promise<User>;
  async delete(id: string): Promise<User>;
  override async delete(
    idOrArgs: string | Prisma.UserDeleteArgs
  ): Promise<
    User | Prisma.Result<Prisma.UserDelegate, Prisma.UserDeleteArgs, "delete">
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.user.delete({
        where: { id: idOrArgs },
      });
    }
    return this.prismaClient.user.delete(idOrArgs);
  }

  async count(args?: Prisma.UserCountArgs): Promise<number> {
    return this.prismaClient.user.count(args);
  }

  async deleteAllSessions(userId: string): Promise<void> {
    await this.prismaClient.session.deleteMany({ where: { userId } });
  }
}

export const userRepository = new UserRepository(prisma);
export default userRepository;
