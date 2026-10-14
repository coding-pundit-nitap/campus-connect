import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Shared behavioural suite for the two "named lookup entity" repositories
 * (BrandRepository, CategoryRepository). They expose the same public API over
 * a different Prisma model, so one suite asserts both query shapes.
 */
type NamedEntityRepo = {
  findById(id: string, options?: object): Promise<unknown>;
  findByName(name: string, options?: object): Promise<unknown>;
  search(term: string, limit?: number): Promise<unknown>;
  findOrCreate(name: string): Promise<unknown>;
  deleteEmpty(): Promise<string[]>;
  deleteIfEmpty(id: string): Promise<boolean>;
  getActive(): Promise<unknown>;
  findUnique(args: object): Promise<unknown>;
  findMany(args?: object): Promise<unknown>;
  create(args: object): Promise<unknown>;
  update(
    idOrArgs: unknown,
    data?: unknown,
    options?: unknown
  ): Promise<unknown>;
  delete(idOrArgs: unknown): Promise<unknown>;
  count(args?: object): Promise<number>;
};

export function describeNamedEntityRepository(
  label: string,
  model: string,
  build: (client: ReturnType<typeof asPrisma>) => NamedEntityRepo
) {
  describe(label, () => {
    let prisma: PrismaMock;
    let delegate: PrismaMock[string];
    let repo: NamedEntityRepo;

    beforeEach(() => {
      vi.clearAllMocks();
      prisma = createPrismaMock();
      delegate = prisma[model];
      repo = build(asPrisma(prisma));
    });

    describe.each([
      ["findById", "id"],
      ["findByName", "name"],
    ] as const)("%s", (method, key) => {
      it("queries findUnique by its scope key", async () => {
        delegate.findUnique.mockResolvedValueOnce({ id: "e1" });
        await expect(repo[method]("v")).resolves.toEqual({ id: "e1" });
        expect(delegate.findUnique).toHaveBeenCalledWith({
          where: { [key]: "v" },
        });
      });

      it("keeps select/include but never lets a caller where override the key", async () => {
        await repo[method]("v", {
          select: { id: true },
          where: { [key]: "other" },
        });
        expect(delegate.findUnique).toHaveBeenCalledWith({
          select: { id: true },
          where: { [key]: "v" },
        });
      });
    });

    describe("search", () => {
      it("does a case-insensitive contains search with the default limit", async () => {
        delegate.findMany.mockResolvedValueOnce([{ id: "e1" }]);
        await expect(repo.search("ab")).resolves.toEqual([{ id: "e1" }]);
        expect(delegate.findMany).toHaveBeenCalledWith({
          where: { name: { contains: "ab", mode: "insensitive" } },
          take: 10,
        });
      });

      it("honours a custom limit", async () => {
        await repo.search("ab", 3);
        expect(delegate.findMany.mock.calls[0][0].take).toBe(3);
      });
    });

    describe("findOrCreate", () => {
      it("returns the existing row without creating", async () => {
        delegate.findUnique.mockResolvedValueOnce({ id: "e1", name: "X" });
        await expect(repo.findOrCreate("X")).resolves.toEqual({
          id: "e1",
          name: "X",
        });
        expect(delegate.create).not.toHaveBeenCalled();
      });

      it("creates the row when the name is unknown", async () => {
        delegate.findUnique.mockResolvedValueOnce(null);
        delegate.create.mockResolvedValueOnce({ id: "e2", name: "Y" });
        await expect(repo.findOrCreate("Y")).resolves.toEqual({
          id: "e2",
          name: "Y",
        });
        expect(delegate.create).toHaveBeenCalledWith({ data: { name: "Y" } });
      });
    });

    describe("deleteEmpty", () => {
      it("returns [] and deletes nothing when every row has products", async () => {
        delegate.findMany.mockResolvedValueOnce([]);
        await expect(repo.deleteEmpty()).resolves.toEqual([]);
        expect(delegate.findMany).toHaveBeenCalledWith({
          where: { products: { none: {} } },
          select: { id: true, name: true },
        });
        expect(delegate.deleteMany).not.toHaveBeenCalled();
      });

      it("deletes the empty rows and returns their ids", async () => {
        delegate.findMany.mockResolvedValueOnce([
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ]);
        await expect(repo.deleteEmpty()).resolves.toEqual(["a", "b"]);
        expect(delegate.deleteMany).toHaveBeenCalledWith({
          where: { id: { in: ["a", "b"] } },
        });
      });
    });

    describe("deleteIfEmpty", () => {
      it("returns false when the row does not exist", async () => {
        delegate.findUnique.mockResolvedValueOnce(null);
        await expect(repo.deleteIfEmpty("e1")).resolves.toBe(false);
        expect(delegate.findUnique).toHaveBeenCalledWith({
          where: { id: "e1" },
          include: { _count: { select: { products: true } } },
        });
        expect(delegate.delete).not.toHaveBeenCalled();
      });

      it("returns false and keeps the row when it still has products", async () => {
        delegate.findUnique.mockResolvedValueOnce({
          id: "e1",
          _count: { products: 2 },
        });
        await expect(repo.deleteIfEmpty("e1")).resolves.toBe(false);
        expect(delegate.delete).not.toHaveBeenCalled();
      });

      it("deletes the row and returns true when it has no products", async () => {
        delegate.findUnique.mockResolvedValueOnce({
          id: "e1",
          _count: { products: 0 },
        });
        await expect(repo.deleteIfEmpty("e1")).resolves.toBe(true);
        expect(delegate.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
      });
    });

    it("getActive lists rows with a live product in an active shop, by name", async () => {
      delegate.findMany.mockResolvedValueOnce([{ id: "e1" }]);
      await expect(repo.getActive()).resolves.toEqual([{ id: "e1" }]);
      expect(delegate.findMany).toHaveBeenCalledWith({
        where: {
          products: {
            some: {
              deleted_at: null,
              shop: { is_active: true, deleted_at: null },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    });

    describe("delegating CRUD", () => {
      it.each([
        ["findUnique", { where: { id: "e1" } }],
        ["findMany", { take: 1 }],
        ["create", { data: { name: "Z" } }],
        ["count", { where: { name: "Z" } }],
      ] as const)("%s passes args straight through", async (method, args) => {
        delegate[method].mockResolvedValueOnce("result");
        await expect(repo[method](args)).resolves.toBe("result");
        expect(delegate[method]).toHaveBeenCalledWith(args);
      });

      it("update(args) passes args straight through", async () => {
        const args = { where: { id: "e1" }, data: { name: "Z" } };
        await repo.update(args);
        expect(delegate.update).toHaveBeenCalledWith(args);
      });

      it("update(id, data, options) forces the id over a caller where", async () => {
        await repo.update(
          "e1",
          { name: "Z" },
          { select: { id: true }, where: { id: "other" } }
        );
        expect(delegate.update).toHaveBeenCalledWith({
          select: { id: true },
          where: { id: "e1" },
          data: { name: "Z" },
        });
      });

      it("update(id) without data sends an empty data object", async () => {
        await repo.update("e1");
        expect(delegate.update).toHaveBeenCalledWith({
          where: { id: "e1" },
          data: {},
        });
      });

      it("delete(id) deletes by id", async () => {
        await repo.delete("e1");
        expect(delegate.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
      });

      it("delete(args) passes args straight through", async () => {
        await repo.delete({ where: { id: "e1" } });
        expect(delegate.delete).toHaveBeenCalledWith({ where: { id: "e1" } });
      });
    });
  });
}
