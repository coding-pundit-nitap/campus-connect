import { Prisma } from "@/generated/client";

export abstract class BaseRepository<
  TModel,
  TDelegate extends {
    findUnique: (args: never) => Promise<unknown>;
    findFirst: (args: never) => Promise<unknown>;
    findMany: (args: never) => Promise<unknown>;
    create: (args: never) => Promise<unknown>;
    update: (args: never) => Promise<unknown>;
    delete: (args: never) => Promise<unknown>;
    count: (args: never) => Promise<unknown>;
  },
> {
  constructor(protected readonly delegate: TDelegate) {}

  async findById<
    T extends Omit<Parameters<TDelegate["findUnique"]>[0], "where">,
  >(
    id: string,
    options?: T
  ): Promise<Prisma.Result<
    TDelegate,
    T & { where: { id: string } },
    "findUnique"
  > | null> {
    return this.delegate.findUnique({
      where: { id },
      ...options,
    } as Parameters<TDelegate["findUnique"]>[0]) as Promise<Prisma.Result<
      TDelegate,
      T & { where: { id: string } },
      "findUnique"
    > | null>;
  }

  async findFirst<T extends Parameters<TDelegate["findFirst"]>[0]>(
    args: T
  ): Promise<Prisma.Result<TDelegate, T, "findFirst"> | null> {
    return this.delegate.findFirst(
      args as Parameters<TDelegate["findFirst"]>[0]
    ) as Promise<Prisma.Result<TDelegate, T, "findFirst"> | null>;
  }

  async findMany<T extends Parameters<TDelegate["findMany"]>[0]>(
    args?: T
  ): Promise<Prisma.Result<TDelegate, T, "findMany">> {
    return this.delegate.findMany(
      args as Parameters<TDelegate["findMany"]>[0]
    ) as Promise<Prisma.Result<TDelegate, T, "findMany">>;
  }

  async create<T extends Parameters<TDelegate["create"]>[0]>(
    args: T
  ): Promise<Prisma.Result<TDelegate, T, "create">> {
    return this.delegate.create(
      args as Parameters<TDelegate["create"]>[0]
    ) as Promise<Prisma.Result<TDelegate, T, "create">>;
  }

  async update<
    T extends Omit<Parameters<TDelegate["update"]>[0], "where" | "data">,
  >(
    id: string,
    data: Parameters<TDelegate["update"]>[0]["data"],
    options?: T
  ): Promise<
    Prisma.Result<
      TDelegate,
      T & {
        where: { id: string };
        data: Parameters<TDelegate["update"]>[0]["data"];
      },
      "update"
    >
  > {
    return this.delegate.update({
      where: { id },
      data,
      ...options,
    } as Parameters<TDelegate["update"]>[0]) as Promise<
      Prisma.Result<
        TDelegate,
        T & {
          where: { id: string };
          data: Parameters<TDelegate["update"]>[0]["data"];
        },
        "update"
      >
    >;
  }

  async delete<T extends Omit<Parameters<TDelegate["delete"]>[0], "where">>(
    id: string,
    options?: T
  ): Promise<
    Prisma.Result<TDelegate, T & { where: { id: string } }, "delete">
  > {
    return this.delegate.delete({
      where: { id },
      ...options,
    } as Parameters<TDelegate["delete"]>[0]) as Promise<
      Prisma.Result<TDelegate, T & { where: { id: string } }, "delete">
    >;
  }

  async count<T extends Parameters<TDelegate["count"]>[0]>(
    args?: T
  ): Promise<number> {
    return this.delegate.count(
      args as Parameters<TDelegate["count"]>[0]
    ) as Promise<number>;
  }
}
