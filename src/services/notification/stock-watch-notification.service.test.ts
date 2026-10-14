import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "@/di/container";
import { prisma } from "@/lib/prisma";

import { notifyStockWatchers } from "./stock-watch-notification.service";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const db = vi.mocked(prisma, true);

describe("notifyStockWatchers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 0 without notifying when nobody is watching", async () => {
    db.stockWatch.findMany.mockResolvedValue([]);

    await expect(notifyStockWatchers("p1", "Pen", "Store")).resolves.toBe(0);
    expect(notificationService.publishNotification).not.toHaveBeenCalled();
    expect(db.stockWatch.deleteMany).not.toHaveBeenCalled();
  });

  it("notifies every watcher, even if one fails, then clears the watch list", async () => {
    db.stockWatch.findMany.mockResolvedValue([
      { id: "w1", user_id: "u1" },
      { id: "w2", user_id: "u2" },
    ] as never);
    vi.mocked(notificationService.publishNotification)
      .mockRejectedValueOnce(new Error("q"))
      .mockResolvedValueOnce(undefined);

    await expect(notifyStockWatchers("p1", "Pen", "Store")).resolves.toBe(2);

    expect(db.stockWatch.findMany).toHaveBeenCalledWith({
      where: { product_id: "p1" },
      select: { user_id: true, id: true },
    });
    expect(notificationService.publishNotification).toHaveBeenCalledWith("u2", {
      title: "Back in Stock!",
      message: '"Pen" at Store is now back in stock.',
      type: "SUCCESS",
      category: "ORDER",
      action_url: "/product/p1",
    });
    expect(db.stockWatch.deleteMany).toHaveBeenCalledWith({
      where: { product_id: "p1" },
    });
  });

  it("returns 0 when the lookup fails", async () => {
    db.stockWatch.findMany.mockRejectedValue(new Error("db"));

    await expect(notifyStockWatchers("p1", "Pen", "Store")).resolves.toBe(0);
  });
});
