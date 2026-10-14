import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformSettingsRepository } from "./platform-settings.repository";

describe("PlatformSettingsRepository", () => {
  let prisma: PrismaMock;
  let repo: PlatformSettingsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repo = new PlatformSettingsRepository(asPrisma(prisma));
  });

  describe("getSettings", () => {
    it("gets-or-creates the default row atomically with one upsert", async () => {
      const row = { id: "default", platform_fee: 5 };
      prisma.platformSettings.upsert.mockResolvedValueOnce(row);

      await expect(repo.getSettings()).resolves.toBe(row);
      expect(prisma.platformSettings.upsert).toHaveBeenCalledWith({
        where: { id: "default" },
        update: {},
        create: { id: "default", platform_fee: 0 },
      });
      // No separate find-then-create: that pair races on first use.
      expect(prisma.platformSettings.findUnique).not.toHaveBeenCalled();
      expect(prisma.platformSettings.create).not.toHaveBeenCalled();
    });
  });

  it("updatePlatformFee upserts the default row", async () => {
    prisma.platformSettings.upsert.mockResolvedValueOnce({ id: "default" });

    await repo.updatePlatformFee(7.5);

    expect(prisma.platformSettings.upsert).toHaveBeenCalledWith({
      where: { id: "default" },
      update: { platform_fee: 7.5 },
      create: { id: "default", platform_fee: 7.5 },
    });
  });

  it("getPlatformFee converts the stored Decimal-like fee to a number", async () => {
    prisma.platformSettings.upsert.mockResolvedValueOnce({
      id: "default",
      platform_fee: { toString: () => "12.5", valueOf: () => 12.5 },
    });

    await expect(repo.getPlatformFee()).resolves.toBe(12.5);
  });
});
