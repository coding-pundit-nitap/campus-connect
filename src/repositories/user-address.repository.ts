import { Prisma, UserAddress } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateAddressDto = Prisma.UserAddressCreateInput;
export type UpdateAddressDto = Prisma.UserAddressUpdateInput;

export class UserAddressRepository extends BaseRepository<
  UserAddress,
  Prisma.UserAddressFindUniqueArgs,
  Prisma.UserAddressFindManyArgs,
  Prisma.UserAddressCreateArgs,
  Prisma.UserAddressUpdateArgs,
  Prisma.UserAddressDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.userAddress);
  }

  async findById(id: string): Promise<UserAddress | null>;
  async findById<T extends Omit<Prisma.UserAddressFindUniqueArgs, "where">>(
    id: string,
    options: T
  ): Promise<Prisma.Result<
    Prisma.UserAddressDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null>;
  async findById(
    id: string,
    options?: Omit<Prisma.UserAddressFindUniqueArgs, "where">
  ): Promise<
    | UserAddress
    | null
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Omit<Prisma.UserAddressFindUniqueArgs, "where"> & {
          where: { id: string };
        },
        "findUnique"
      >
  > {
    return this.prismaClient.userAddress.findUnique({
      where: { id },
      ...options,
    });
  }

  async findByUserId(id: string): Promise<UserAddress[]>;
  async findByUserId<T extends Omit<Prisma.UserAddressFindManyArgs, "where">>(
    id: string,
    options: T
  ): Promise<
    Prisma.Result<
      Prisma.UserAddressDelegate,
      T & { where: { user_id: string } },
      "findMany"
    >
  >;
  async findByUserId(
    id: string,
    options?: Omit<Prisma.UserAddressFindManyArgs, "where">
  ): Promise<
    | UserAddress[]
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Omit<Prisma.UserAddressFindManyArgs, "where"> & {
          where: { user_id: string };
        },
        "findMany"
      >
  > {
    return this.prismaClient.userAddress.findMany({
      where: { user_id: id },
      orderBy: { is_default: Prisma.SortOrder.desc },
      ...options,
    });
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
    const { is_default = false } = data;
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

  async findUnique<T extends Prisma.UserAddressFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserAddressDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.UserAddressFindUniqueArgs
  ): Promise<UserAddress | null>;
  override async findUnique(
    args: Prisma.UserAddressFindUniqueArgs
  ): Promise<
    | UserAddress
    | null
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Prisma.UserAddressFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.userAddress.findUnique(args);
  }

  async findMany<T extends Prisma.UserAddressFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.UserAddressDelegate, T, "findMany">>;
  override async findMany(
    args?: Prisma.UserAddressFindManyArgs
  ): Promise<UserAddress[]>;
  override async findMany(
    args?: Prisma.UserAddressFindManyArgs
  ): Promise<
    | UserAddress[]
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Prisma.UserAddressFindManyArgs,
        "findMany"
      >
  > {
    return this.prismaClient.userAddress.findMany(args);
  }

  async create<T extends Prisma.UserAddressCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserAddressDelegate, T, "create">>;
  override async create(
    args: Prisma.UserAddressCreateArgs
  ): Promise<UserAddress>;
  override async create(
    args: Prisma.UserAddressCreateArgs
  ): Promise<
    | UserAddress
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Prisma.UserAddressCreateArgs,
        "create"
      >
  > {
    return this.prismaClient.userAddress.create(args);
  }

  async update<T extends Prisma.UserAddressUpdateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserAddressDelegate, T, "update">>;
  override async update(
    args: Prisma.UserAddressUpdateArgs
  ): Promise<UserAddress>;
  async update<T extends Omit<Prisma.UserAddressUpdateArgs, "where" | "data">>(
    id: string,
    data: Prisma.UserAddressUpdateInput,
    options?: T
  ): Promise<UserAddress>;
  override async update(
    idOrArgs: string | Prisma.UserAddressUpdateArgs,
    data?: Prisma.UserAddressUpdateInput,
    options?: Omit<Prisma.UserAddressUpdateArgs, "where" | "data">
  ): Promise<
    | UserAddress
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Prisma.UserAddressUpdateArgs,
        "update"
      >
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.userAddress.update({
        where: { id: idOrArgs },
        data: data || {},
        ...options,
      });
    }
    return this.prismaClient.userAddress.update(idOrArgs);
  }

  async delete<T extends Prisma.UserAddressDeleteArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.UserAddressDelegate, T, "delete">>;
  override async delete(
    args: Prisma.UserAddressDeleteArgs
  ): Promise<UserAddress>;
  async delete(id: string): Promise<UserAddress>;
  override async delete(
    idOrArgs: string | Prisma.UserAddressDeleteArgs
  ): Promise<
    | UserAddress
    | Prisma.Result<
        Prisma.UserAddressDelegate,
        Prisma.UserAddressDeleteArgs,
        "delete"
      >
  > {
    if (typeof idOrArgs === "string") {
      return this.prismaClient.userAddress.delete({
        where: { id: idOrArgs },
      });
    }
    return this.prismaClient.userAddress.delete(idOrArgs);
  }

  async findBuildingById(id: string) {
    return this.prismaClient.building.findFirst({
      where: { id, is_active: true },
    });
  }

  async findBuildingByName(name: string, hostel_block: string | null) {
    return this.prismaClient.building.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        hostel_block,
      },
    });
  }

  async createBuilding(data: { name: string; hostel_block: string | null }) {
    return this.prismaClient.building.create({ data });
  }
}
