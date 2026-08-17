// Regression guard for the packing summary that vendors actually read.
//
// BatchService.getBatchSummary resolves product names for every line item in
// a batch. It used to look them up with:
//
//     productRepository.findManyByShopId("", {
//       where: { id: { in: productIds } },
//       select: { id: true, name: true },
//     })
//
// deliberately passing an empty shop id and relying on the caller `where`
// overriding the scope. But `findManyByShopId` merged the scope FIRST
// (`where: { shop_id, deleted_at: null, ...where }`), and the caller `where`
// names only `id` - so nothing overwrote `shop_id: ""`. The query matched no
// rows, `products` came back empty, and every line item fell through to
// `product?.name || "Unknown Item"`.
//
// batch.service.ts populates `item_summary` from this for every LOCKED /
// IN_TRANSIT batch, so the vendor console's packing list was blank-labelled
// in production. Fixed by scoping the lookup to the batch's own shop.
//
// Relative imports, not the "@/" alias - vite-tsconfig-paths does not cover
// tests/**/*.ts (see tests/factories/index.ts for the full rationale).
import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import {
  createOrderAtStatus,
  createProduct,
  createShop,
  createUser,
  futureSlotTime,
  seedOpenBatch,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

const { batchService } = createContainer({ prisma: testPrisma });

async function seedBatchWithItems() {
  const shop = await createShop();
  const buyer = await createUser();
  const { at } = futureSlotTime();
  const batch = await seedOpenBatch({ cutoffAt: at, shop_id: shop.id });

  const samosa = await createProduct({ shop_id: shop.id, name: "Samosa" });
  const chai = await createProduct({ shop_id: shop.id, name: "Masala Chai" });

  const order = await createOrderAtStatus({
    shop_id: shop.id,
    order_status: "BATCHED",
    user_id: buyer.id,
  });
  await testPrisma.order.update({
    where: { id: order.id },
    data: { batch_id: batch.id },
  });

  await testPrisma.orderItem.createMany({
    data: [
      { order_id: order.id, product_id: samosa.id, quantity: 3, price: 20 },
      { order_id: order.id, product_id: chai.id, quantity: 2, price: 15 },
    ],
  });

  return { shop, batch, samosa, chai };
}

describe("BatchService.getBatchSummary", () => {
  it("resolves real product names instead of falling back to 'Unknown Item'", async () => {
    const { batch, samosa, chai } = await seedBatchWithItems();

    const summary = await batchService.getBatchSummary(batch.id);

    // The bug's signature: a non-empty summary where every name is the
    // fallback. Assert the fallback is absent before checking the contents,
    // so a regression reports the real cause.
    expect(summary.map((s) => s.name)).not.toContain("Unknown Item");
    expect(summary).toHaveLength(2);

    const byId = new Map(summary.map((s) => [s.product_id, s]));
    expect(byId.get(samosa.id)?.name).toBe("Samosa");
    expect(byId.get(samosa.id)?.quantity).toBe(3);
    expect(byId.get(chai.id)?.name).toBe("Masala Chai");
    expect(byId.get(chai.id)?.quantity).toBe(2);
  });

  it("does not leak product names from another shop's batch", async () => {
    const { batch, samosa } = await seedBatchWithItems();

    // A same-named product at a different shop must not be what we resolve.
    const otherShop = await createShop();
    await createProduct({ shop_id: otherShop.id, name: "Samosa" });

    const summary = await batchService.getBatchSummary(batch.id);
    const resolved = summary.find((s) => s.product_id === samosa.id);

    expect(resolved?.name).toBe("Samosa");
    // Resolution is keyed by product_id, so the count stays at this batch's
    // two line items regardless of what other shops sell.
    expect(summary).toHaveLength(2);
  });
});
