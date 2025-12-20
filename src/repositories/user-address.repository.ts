import { Prisma, UserAddress } from "@/../prisma/generated/client";
import { prisma } from "@/lib/prisma";

export type CreateAddressDto = Prisma.UserAddressCreateInput;

export type UpdateAddressDto = Prisma.UserAddressUpdateInput;

type UserAddressFindOptions = Omit<Prisma.UserAddressFindManyArgs, "where">;

type UserAddressCreateOptions = Omit<Prisma.UserAddressCreateArgs, "data">;

type UserAddressUpdateOptions = Omit<Prisma.UserAddressUpdateArgs, "where">;

type UserAddressDeleteOptions = Omit<Prisma.UserAddressDeleteArgs, "where">;

class UserAddressRepository {
  async findByUserId(id: string): Promise<UserAddress[]>;
  async findByUserId<T extends UserAddressFindOptions>(
    id: string,
    options: T
  ): Promise<
    Prisma.UserAddressGetPayload<{ where: { user_id: string } } & T>[]
  >;
  async findByUserId<T extends UserAddressFindOptions>(
    id: string,
    options?: T
  ): Promise<
    | UserAddress[]
    | Prisma.UserAddressGetPayload<{ where: { user_id: string } } & T>[]
  > {
    const query = {
      where: { user_id: id },
      orderBy: { is_default: Prisma.SortOrder.desc },
      ...(options ?? {}),
    };
    return prisma.userAddress.findMany(query);
  }

  async create(data: CreateAddressDto): Promise<UserAddress>;
  async create<T extends UserAddressCreateOptions>(
    data: CreateAddressDto,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<{ data: CreateAddressDto } & T>>;

  async create<T extends UserAddressCreateOptions>(
    data: CreateAddressDto,
    options?: T
  ) {
    const query = {
      data,
      ...options,
    };
    return prisma.userAddress.create(query);
  }

  async update(id: string, data: UpdateAddressDto): Promise<UserAddress>;
  async update<T extends UserAddressUpdateOptions>(
    id: string,
    data: UpdateAddressDto,
    options?: T
  ): Promise<Prisma.UserAddressGetPayload<T>>;
  async update<T extends UserAddressUpdateOptions>(
    id: string,
    data: UpdateAddressDto,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<T>>;
  async update<T extends Prisma.UserAddressUpdateArgs>(
    id: string,
    data: UpdateAddressDto,
    options?: T
  ): Promise<Prisma.UserAddressGetPayload<T> | UserAddress> {
    const query = {
      where: { id },
      data,
      ...options,
    };
    return prisma.userAddress.update(query);
  }

  async findById(id: string): Promise<UserAddress | null> {
    return prisma.userAddress.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<UserAddress>;
  async delete<T extends UserAddressDeleteOptions>(
    id: string,
    options: T
  ): Promise<Prisma.UserAddressGetPayload<{ where: { id: string } } & T>>;
  async delete<T extends UserAddressDeleteOptions>(
    id: string,
    options?: T
  ): Promise<
    UserAddress | Prisma.UserAddressGetPayload<{ where: { id: string } } & T>
  > {
    const query = { where: { id }, ...(options ?? {}) };
    return prisma.userAddress.delete(query);
  }
  async deleteByIdAndUserId(
    id: string,
    user_id: string
  ): Promise<UserAddress | null> {
    const address = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!address || address.user_id !== user_id) {
      return null;
    }

    return prisma.userAddress.delete({ where: { id } });
  }

  async setDefault(user_id: string, address_id: string): Promise<UserAddress> {
    return prisma.$transaction(async (tx) => {
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
      return prisma.userAddress.create({ data });
    }

    return prisma.$transaction(async (tx) => {
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
    const existingAddress = await prisma.userAddress.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!existingAddress || existingAddress.user_id !== user_id) {
      return null;
    }

    const setAsDefault = data.is_default === true;

    if (!setAsDefault) {
      return prisma.userAddress.update({
        where: { id },
        data,
      });
    }

    return prisma.$transaction(async (tx) => {
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

export const userAddressRepository = new UserAddressRepository();

export default userAddressRepository;
