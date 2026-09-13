import { describe, expect, it } from "vitest";

import { BatchRepository } from "../../../src/repositories/batch.repository";
import { createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("BatchRepository.adjustCollectiveTotal", () => {
  it("increments collective_total by the given delta", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 100,
      },
    });

    const repo = new BatchRepository(testPrisma);
    const updated = await repo.adjustCollectiveTotal(batch.id, 50);

    expect(updated).not.toBeNull();
    expect(Number(updated!.collective_total)).toBe(150);
  });

  it("decrements collective_total with a negative delta and never goes below zero", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 30,
      },
    });

    const repo = new BatchRepository(testPrisma);
    const updated = await repo.adjustCollectiveTotal(batch.id, -100);

    expect(Number(updated!.collective_total)).toBe(0);
  });

  it("returns null for a non-existent batch", async () => {
    const repo = new BatchRepository(testPrisma);
    const result = await repo.adjustCollectiveTotal("does-not-exist", 10);
    expect(result).toBeNull();
  });
});
