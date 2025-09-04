import { Prisma, UserAddress } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateAddressDto = Prisma.UserAddressCreateInput;

export type UpdateAddressDto = Prisma.UserAddressUpdateInput;

type UserAddressFindOptions = Omit<Prisma.UserAddressFindManyArgs, "where">;

type UserAddressCreateOptions = Omit<Prisma.UserAddressCreateArgs, "data">;

type UserAddressUpdateOptions = Omit<Prisma.UserAddressUpdateArgs, "where">;

type UserAddressDeleteOptions = Omit<Prisma.UserAddressDeleteArgs, "where">;

class UserAddressRepository {
  async getAddressesByUserId(id: string): Promise<UserAddress[]>;
  async getAddressesByUserId<T extends UserAddressFindOptions>(
    id: string,
    options: T
  ): Promise<
    Prisma.UserAddressGetPayload<{ where: { user_id: string } } & T>[]
  >;
  async getAddressesByUserId<T extends UserAddressFindOptions>(
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
}

export const userAddressRepository = new UserAddressRepository();

export default userAddressRepository;
