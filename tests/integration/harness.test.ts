import { describe, expect, it } from "vitest";

import { testPrisma, testRedis } from "../setup/integration-setup";

describe("integration harness", () => {
  it("connects to this worker's own database", async () => {
    const rows = await testPrisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;
    expect(rows[0].current_database).toMatch(/^cc_test_w\d+$/);
  });

  it("has the schema applied", async () => {
    await expect(testPrisma.user.count()).resolves.toBe(0);
  });

  it("resets the display id sequence between tests", async () => {
    const rows = await testPrisma.$queryRaw<
      { next_id: bigint }[]
    >`SELECT nextval('order_display_id_seq') as next_id`;
    expect(rows[0].next_id.toString()).toBe("1000");
  });

  it("resets it again for the next test", async () => {
    const rows = await testPrisma.$queryRaw<
      { next_id: bigint }[]
    >`SELECT nextval('order_display_id_seq') as next_id`;
    expect(rows[0].next_id.toString()).toBe("1000");
  });

  it("reaches redis", async () => {
    await testRedis.set("k", "v");
    await expect(testRedis.get("k")).resolves.toBe("v");
  });
});
