import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PayoutRepository } from "./payout.repository";

describe("PayoutRepository", () => {
  let prisma: PrismaMock;
  let repo: PayoutRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repo = new PayoutRepository(asPrisma(prisma));
  });

  it.each([
    ["findMany", { take: 5 }, [{ id: "p1" }]],
    ["findUnique", { where: { id: "p1" } }, { id: "p1" }],
    ["count", { where: { shop_id: "s1" } }, 2],
    ["aggregate", { _sum: { amount: true } }, { _sum: { amount: 10 } }],
  ] as const)(
    "%s forwards args to prisma.payout and returns the result",
    async (method, args, result) => {
      prisma.payout[method].mockResolvedValueOnce(result);

      await expect(
        (repo[method] as (a: unknown) => Promise<unknown>)(args)
      ).resolves.toEqual(result);
      expect(prisma.payout[method]).toHaveBeenCalledWith(args);
    }
  );
});
