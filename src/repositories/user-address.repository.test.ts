// M1: `UserAddressRepository.setDefault` checked ownership *before* opening
// its `$transaction`, but the transaction's own `tx.userAddress.update`
// still targeted `where: { id: address_id }` alone - the ownership
// guarantee lived only in that pre-check, making the write TOCTOU-adjacent
// rather than atomic. Fixed by folding `user_id` into the final update's
// `where` too, so the database itself enforces the boundary regardless of
// what did or didn't change between the check and the write.
//
// This is a unit test (mocked prisma client), not an integration test:
// with everything running single-threaded and awaited in sequence, there
// is no way to force a real race between the pre-check and the transaction
// through the public API - the only way to observe whether the guarantee
// is atomic (query-level) or advisory (app-level-only) is to assert on the
// exact `where` argument the transactional update is called with.
import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { UserAddressRepository } from "@/repositories/user-address.repository";

function buildFakePrismaClient(
  existingAddress: { id: string; user_id: string } | null
) {
  const fakeClient = createPrismaMock();
  // Separate double for the interactive-transaction client, so assertions
  // target the writes made through `tx`.
  const tx = createPrismaMock();
  fakeClient.userAddress.findUnique.mockResolvedValue(existingAddress);
  tx.userAddress.updateMany.mockResolvedValue({ count: 1 });
  tx.userAddress.update.mockResolvedValue({ id: "addr-1", is_default: true });
  fakeClient.$transaction.mockImplementation(
    async (fn: (t: typeof tx) => unknown) => fn(tx)
  );

  return {
    fakeClient,
    updateMany: tx.userAddress.updateMany,
    update: tx.userAddress.update,
    findUnique: fakeClient.userAddress.findUnique,
    transaction: fakeClient.$transaction,
  };
}

describe("UserAddressRepository.setDefault - M1 (atomic ownership scoping)", () => {
  it("scopes the transactional update by BOTH address id and user id, not id alone", async () => {
    const { fakeClient, update } = buildFakePrismaClient({
      id: "addr-1",
      user_id: "user-1",
    });

    const repo = new UserAddressRepository(asPrisma(fakeClient));
    await repo.setDefault("user-1", "addr-1");

    expect(update).toHaveBeenCalledTimes(1);
    const [args] = update.mock.calls[0] as [{ where: Record<string, unknown> }];
    // The regression this guards: `where` used to be `{ id: "addr-1" }`
    // alone. Assert user_id is present, not merely that id is - a where
    // clause missing user_id would still satisfy a weaker `toMatchObject`
    // check against just `{ id: "addr-1" }`.
    expect(args.where).toEqual({ id: "addr-1", user_id: "user-1" });
  });

  it("never opens the transaction (and so never gets a chance to write) when the pre-check ownership fails", async () => {
    const { fakeClient, transaction } = buildFakePrismaClient({
      id: "addr-1",
      user_id: "victim",
    });

    const repo = new UserAddressRepository(asPrisma(fakeClient));
    const result = await repo.setDefault("attacker", "addr-1");

    expect(result).toBeNull();
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("UserAddressRepository", () => {
  let prisma: PrismaMock;
  let tx: PrismaMock;
  let repo: UserAddressRepository;
  const own = { id: "addr-1", user_id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    tx = createPrismaMock();
    prisma.$transaction.mockImplementation(
      async (fn: (t: PrismaMock) => unknown) => fn(tx)
    );
    repo = new UserAddressRepository(asPrisma(prisma));
  });

  describe("findById", () => {
    it("queries by id without options", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(own);
      await expect(repo.findById("addr-1")).resolves.toBe(own);
      expect(prisma.userAddress.findUnique).toHaveBeenCalledWith({
        where: { id: "addr-1" },
      });
    });

    it("forces the id over a caller where", async () => {
      await repo.findById("addr-1", {
        select: { id: true },
        where: { id: "other" },
      } as unknown as Omit<Prisma.UserAddressFindUniqueArgs, "where">);
      expect(prisma.userAddress.findUnique).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "addr-1" },
      });
    });
  });

  describe("findByUserId", () => {
    it("lists the user's addresses with the default first", async () => {
      await repo.findByUserId("user-1");
      expect(prisma.userAddress.findMany).toHaveBeenCalledWith({
        orderBy: { is_default: "desc" },
        where: { user_id: "user-1" },
      });
    });

    it("lets options override orderBy but never the user scope", async () => {
      await repo.findByUserId("user-1", {
        orderBy: { created_at: "asc" },
        where: { user_id: "victim" },
      } as unknown as Omit<Prisma.UserAddressFindManyArgs, "where">);
      expect(prisma.userAddress.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: "asc" },
        where: { user_id: "user-1" },
      });
    });
  });

  describe("deleteByIdAndUserId", () => {
    it.each([
      ["the address is missing", null],
      ["the address belongs to someone else", { ...own, user_id: "victim" }],
    ])("returns null without deleting when %s", async (_label, found) => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(found);
      await expect(
        repo.deleteByIdAndUserId("addr-1", "user-1")
      ).resolves.toBeNull();
      expect(prisma.userAddress.delete).not.toHaveBeenCalled();
    });

    it("deletes an owned address", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(own);
      prisma.userAddress.delete.mockResolvedValueOnce(own);
      await expect(repo.deleteByIdAndUserId("addr-1", "user-1")).resolves.toBe(
        own
      );
      // Owner-scoped write: closes the check-then-delete race.
      expect(prisma.userAddress.delete).toHaveBeenCalledWith({
        where: { id: "addr-1", user_id: "user-1" },
      });
    });
  });

  describe("setDefault", () => {
    it("returns null when the address does not exist", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(null);
      await expect(repo.setDefault("user-1", "addr-1")).resolves.toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("clears the previous default before setting the new one", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(own);
      tx.userAddress.update.mockResolvedValueOnce({ ...own, is_default: true });

      await expect(repo.setDefault("user-1", "addr-1")).resolves.toEqual({
        ...own,
        is_default: true,
      });
      expect(tx.userAddress.updateMany).toHaveBeenCalledWith({
        where: { user_id: "user-1", is_default: true },
        data: { is_default: false },
      });
      expect(tx.userAddress.update).toHaveBeenCalledWith({
        where: { id: "addr-1", user_id: "user-1" },
        data: { is_default: true },
      });
    });
  });

  describe("createWithDefault", () => {
    it.each([
      ["is_default is omitted", {}],
      ["is_default is false", { is_default: false }],
    ])("creates directly without a transaction when %s", async (_l, extra) => {
      const data = { label: "Home", ...extra } as never;
      prisma.userAddress.create.mockResolvedValueOnce(own);

      await expect(repo.createWithDefault(data, "user-1")).resolves.toBe(own);
      expect(prisma.userAddress.create).toHaveBeenCalledWith({ data });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("clears the user's current default then creates inside a transaction", async () => {
      const data = { label: "Home", is_default: true } as never;
      tx.userAddress.create.mockResolvedValueOnce(own);

      await expect(repo.createWithDefault(data, "user-1")).resolves.toBe(own);
      expect(tx.userAddress.updateMany).toHaveBeenCalledWith({
        where: { user_id: "user-1", is_default: true },
        data: { is_default: false },
      });
      expect(tx.userAddress.create).toHaveBeenCalledWith({ data });
      expect(prisma.userAddress.create).not.toHaveBeenCalled();
    });
  });

  describe("updateWithDefault", () => {
    it.each([
      ["the address is missing", null],
      ["the address belongs to someone else", { ...own, user_id: "victim" }],
    ])("returns null without writing when %s", async (_label, found) => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(found);
      await expect(
        repo.updateWithDefault("addr-1", "user-1", { label: "x" })
      ).resolves.toBeNull();
      expect(prisma.userAddress.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("updates directly when not becoming the default", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(own);
      prisma.userAddress.update.mockResolvedValueOnce(own);

      await expect(
        repo.updateWithDefault("addr-1", "user-1", { label: "x" })
      ).resolves.toBe(own);
      expect(prisma.userAddress.update).toHaveBeenCalledWith({
        where: { id: "addr-1", user_id: "user-1" },
        data: { label: "x" },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("clears other defaults then updates inside a transaction", async () => {
      prisma.userAddress.findUnique.mockResolvedValueOnce(own);
      tx.userAddress.update.mockResolvedValueOnce(own);

      await repo.updateWithDefault("addr-1", "user-1", { is_default: true });

      expect(tx.userAddress.updateMany).toHaveBeenCalledWith({
        where: { user_id: "user-1", is_default: true, id: { not: "addr-1" } },
        data: { is_default: false },
      });
      expect(tx.userAddress.update).toHaveBeenCalledWith({
        where: { id: "addr-1", user_id: "user-1" },
        data: { is_default: true },
      });
    });
  });

  describe("delegating CRUD", () => {
    it.each([
      ["findUnique", { where: { id: "addr-1" } }],
      ["findMany", { take: 1 }],
      ["create", { data: { label: "x" } }],
    ] as const)("%s forwards args", async (method, args) => {
      prisma.userAddress[method].mockResolvedValueOnce("ok");
      await expect(
        (repo[method] as (a: unknown) => Promise<unknown>)(args)
      ).resolves.toBe("ok");
      expect(prisma.userAddress[method]).toHaveBeenCalledWith(args);
    });

    it("update(args) forwards args", async () => {
      const args = { where: { id: "addr-1" }, data: { label: "x" } };
      await repo.update(args);
      expect(prisma.userAddress.update).toHaveBeenCalledWith(args);
    });

    it("update(id, data, options) forces the id; missing data becomes {}", async () => {
      await repo.update(
        "addr-1",
        undefined as unknown as Prisma.UserAddressUpdateInput,
        { where: { id: "other" } } as unknown as Omit<
          Prisma.UserAddressUpdateArgs,
          "where" | "data"
        >
      );
      expect(prisma.userAddress.update).toHaveBeenCalledWith({
        where: { id: "addr-1" },
        data: {},
      });
    });

    it("delete(args) forwards args", async () => {
      await repo.delete({ where: { id: "addr-1" } });
      expect(prisma.userAddress.delete).toHaveBeenCalledWith({
        where: { id: "addr-1" },
      });
    });
  });

  describe("buildings", () => {
    it("findBuildingById only returns active buildings", async () => {
      await repo.findBuildingById("bld-1");
      expect(prisma.building.findFirst).toHaveBeenCalledWith({
        where: { id: "bld-1", is_active: true },
      });
    });

    it("findBuildingByName matches name case-insensitively within the block", async () => {
      await repo.findBuildingByName("Alpha", null);
      expect(prisma.building.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: "Alpha", mode: "insensitive" },
          hostel_block: null,
        },
      });
    });

    it("createBuilding inserts the building", async () => {
      const data = { name: "Alpha", hostel_block: "A" };
      prisma.building.create.mockResolvedValueOnce({ id: "bld-1", ...data });
      await expect(repo.createBuilding(data)).resolves.toEqual({
        id: "bld-1",
        ...data,
      });
      expect(prisma.building.create).toHaveBeenCalledWith({ data });
    });
  });
});
