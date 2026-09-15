// Relative imports, not the "@/" alias - vite-tsconfig-paths does not cover
// tests/**/*.ts (see tests/factories/index.ts for the full rationale).
import { describe, expect, it } from "vitest";

import { GET } from "../../../src/app/api/shops/[shop_id]/batch-progress/route";
import { createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("GET /api/shops/[shop_id]/batch-progress", () => {
  it("returns the open batch's collective progress when a minimum is configured", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 200,
        min_order_value_snapshot: 500,
      },
    });

    const response = await GET(
      new Request(`http://localhost/api/shops/${shop.id}/batch-progress`),
      { params: Promise.resolve({ shop_id: shop.id }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      status: "OPEN",
      collectiveTotal: 200,
      minRequired: 500,
      isMet: false,
    });
  });

  it("returns minRequired null and isMet true when the shop has no batch minimum configured", async () => {
    const shop = await createShop({ accepting_orders: true });

    const response = await GET(
      new Request(`http://localhost/api/shops/${shop.id}/batch-progress`),
      { params: Promise.resolve({ shop_id: shop.id }) }
    );
    const body = await response.json();

    expect(body.data).toMatchObject({
      batchId: null,
      minRequired: null,
      isMet: true,
    });
  });
});
