import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseRepository } from "./base.repository";

type Row = { id: string };

class TestRepository extends BaseRepository<
  Row,
  { where: { id: string } },
  { take?: number },
  { data: Row },
  { where: { id: string }; data: Partial<Row> },
  { where: { id: string } }
> {}

describe("BaseRepository", () => {
  const delegate = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  let repo: TestRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TestRepository(delegate);
  });

  it.each([
    ["findUnique", { where: { id: "1" } }, { id: "1" }],
    ["findMany", { take: 2 }, [{ id: "1" }]],
    ["create", { data: { id: "1" } }, { id: "1" }],
    ["update", { where: { id: "1" }, data: { id: "2" } }, { id: "2" }],
    ["delete", { where: { id: "1" } }, { id: "1" }],
  ] as const)(
    "%s forwards args to the delegate and returns its result",
    async (method, args, result) => {
      delegate[method].mockResolvedValueOnce(result);

      await expect(
        (repo[method] as (a: unknown) => Promise<unknown>)(args)
      ).resolves.toEqual(result);
      expect(delegate[method]).toHaveBeenCalledWith(args);
    }
  );

  it("findMany allows calling without args", async () => {
    delegate.findMany.mockResolvedValueOnce([]);
    await expect(repo.findMany()).resolves.toEqual([]);
    expect(delegate.findMany).toHaveBeenCalledWith(undefined);
  });
});
