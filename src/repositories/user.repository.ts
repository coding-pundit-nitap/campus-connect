import { Prisma, Role, User } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateUserDto = Omit<Prisma.UserCreateInput, "role">;

export class UserRepository extends BaseRepository<User, Prisma.UserDelegate> {
  constructor(private readonly prismaClient: typeof prisma) {
    super(prismaClient.user);
  }

  async findAdmins(): Promise<User[]> {
    return this.findMany({ where: { role: Role.ADMIN } });
  }

  async findByEmail<T extends Omit<Prisma.UserFindUniqueArgs, "where">>(
    email: string,
    options?: T
  ): Promise<Prisma.Result<
    Prisma.UserDelegate,
    T & { where: { email: string } },
    "findUnique"
  > | null> {
    return this.delegate.findUnique({
      where: { email },
      ...options,
    } as Parameters<
      Prisma.UserDelegate["findUnique"]
    >[0]) as Promise<Prisma.Result<
      Prisma.UserDelegate,
      T & { where: { email: string } },
      "findUnique"
    > | null>;
  }

  override async count<T extends Parameters<Prisma.UserDelegate["count"]>[0]>(
    args?: T
  ): Promise<number>;
  async count(where?: Prisma.UserWhereInput): Promise<number>;
  override async count(args?: any): Promise<number> {
    if (
      args &&
      (args.where !== undefined ||
        args.select !== undefined ||
        args.cursor !== undefined ||
        args.take !== undefined ||
        args.skip !== undefined ||
        args.orderBy !== undefined)
    ) {
      return this.delegate.count(args);
    }
    return this.delegate.count({ where: args });
  }

  async deleteAllSessions(userId: string): Promise<void> {
    await this.prismaClient.session.deleteMany({ where: { userId } });
  }
}

export const userRepository = new UserRepository(prisma);
export default userRepository;
