import { Payout, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export class PayoutRepository extends BaseRepository<
  Payout,
  Prisma.PayoutFindUniqueArgs,
  Prisma.PayoutFindManyArgs,
  Prisma.PayoutCreateArgs,
  Prisma.PayoutUpdateArgs,
  Prisma.PayoutDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.payout);
  }

  async findMany<T extends Prisma.PayoutFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.PayoutDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.PayoutFindManyArgs): Promise<Payout[]>;
  override async findMany(
    args?: Prisma.PayoutFindManyArgs
  ): Promise<
    | Payout[]
    | Prisma.Result<
        Prisma.PayoutDelegate,
        Prisma.PayoutFindManyArgs,
        "findMany"
      >
  > {
    return this.prismaClient.payout.findMany(args);
  }

  async findUnique<T extends Prisma.PayoutFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.PayoutDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.PayoutFindUniqueArgs
  ): Promise<Payout | null>;
  override async findUnique(
    args: Prisma.PayoutFindUniqueArgs
  ): Promise<
    | Payout
    | null
    | Prisma.Result<
        Prisma.PayoutDelegate,
        Prisma.PayoutFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.payout.findUnique(args);
  }

  async count(args?: Prisma.PayoutCountArgs): Promise<number> {
    return this.prismaClient.payout.count(args);
  }

  async aggregate<T extends Prisma.PayoutAggregateArgs>(args: T) {
    return this.prismaClient.payout.aggregate(args);
  }
}

export const payoutRepository = new PayoutRepository();
export default payoutRepository;
