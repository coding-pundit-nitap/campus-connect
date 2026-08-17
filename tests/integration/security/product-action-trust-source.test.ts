import { describe, expect, it } from "vitest";

import {
  deleteProductAction,
  updateProductAction,
} from "../../../src/actions/product/product-actions";
import { createProduct, createShop, createUser } from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("updateProductAction and deleteProductAction agree on shop ownership even when the session's shop_id claim disagrees with the database", () => {
  it("rejects an update/delete on shopB's product when the session (falsely) claims shop_id=shopB, but the database says the caller owns shopA", async () => {
    const shopA = await createShop();
    const owner = await createUser({ shop_id: shopA.id });

    const shopB = await createShop();
    await createUser({ shop_id: shopB.id });
    const shopBsProduct = await createProduct({ shop_id: shopB.id });

    const before = await testPrisma.product.findUniqueOrThrow({
      where: { id: shopBsProduct.id },
    });

    asUser({ ...owner, shop_id: shopB.id });

    const updateRejection = updateProductAction(shopBsProduct.id, {
      name: "Hijacked via stale session shop_id",
      price: 1,
      stock_quantity: 999,
      discount: 90,
    });
    await expect(updateRejection).rejects.toMatchObject({
      name: "ForbiddenError",
    });
    await updateRejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(shopB.id);
    });

    const deleteRejection = deleteProductAction(shopBsProduct.id);
    await expect(deleteRejection).rejects.toMatchObject({
      name: "ForbiddenError",
    });
    await deleteRejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(shopB.id);
    });

    const after = await testPrisma.product.findUniqueOrThrow({
      where: { id: shopBsProduct.id },
    });
    expect(after.name).toBe(before.name);
    expect(after.price.toString()).toBe(before.price.toString());
    expect(after.stock_quantity).toBe(before.stock_quantity);
    expect(after.deleted_at).toBeNull();
  });
});
