import { Prisma, UserAddress } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateAddressDto = Prisma.UserAddressCreateInput;
export type UpdateAddressDto = Prisma.UserAddressUpdateInput;

export class UserAddressRepository extends BaseRepository<
  UserAddress,
  Prisma.UserAddressDelegate
> {
  constructor(private readonly prismaClient: typeof prisma) {
    super(prismaClient.userAddress);
  }

  async findByUserId<T extends Omit<Prisma.UserAddressFindManyArgs, "where">>(
    id: string,
    options?: T
  ): Promise<
    Prisma.Result<
      Prisma.UserAddressDelegate,
      T & { where: { user_id: string } },
      "findMany"
    >
  > {
    return this.findMany({
      where: { user_id: id },
      orderBy: { is_default: Prisma.SortOrder.desc },
      ...(options ?? {}),
    } as Parameters<Prisma.UserAddressDelegate["findMany"]>[0]) as Promise<
      Prisma.Result<
        Prisma.UserAddressDelegate,
        T & { where: { user_id: string } },
        "findMany"
      >
    >;
  }

  async deleteByIdAndUserId(
    id: string,
    user_id: string
  ): Promise<UserAddress | null> {
    const address = await this.findById(id);

    if (!address || address.user_id !== user_id) {
      return null;
    }

    return this.delete(id);
  }

  async setDefault(user_id: string, address_id: string): Promise<UserAddress> {
    return this.prismaClient.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: {
          user_id: user_id,
          is_default: true,
        },
        data: { is_default: false },
      });

      return tx.userAddress.update({
        where: { id: address_id },
        data: { is_default: true },
      });
    });
  }

  async createWithDefault(
    data: CreateAddressDto,
    user_id: string
  ): Promise<UserAddress> {
    const { is_default = false } = data as CreateAddressDto & {
      is_default?: boolean;
    };
    const isDefault = is_default;

    if (!isDefault) {
      return this.create({ data });
    }

    return this.prismaClient.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: {
          user_id,
          is_default: true,
        },
        data: { is_default: false },
      });

      return tx.userAddress.create({ data });
    });
  }

  async updateWithDefault(
    id: string,
    user_id: string,
    data: UpdateAddressDto
  ): Promise<UserAddress | null> {
    const existingAddress = await this.delegate.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!existingAddress || existingAddress.user_id !== user_id) {
      return null;
    }

    const setAsDefault = data.is_default === true;

    if (!setAsDefault) {
      return this.update(id, data);
    }

    return this.prismaClient.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: {
          user_id,
          is_default: true,
          id: { not: id },
        },
        data: { is_default: false },
      });

      return tx.userAddress.update({
        where: { id },
        data,
      });
    });
  }
}

export const userAddressRepository = new UserAddressRepository(prisma);
export default userAddressRepository;
