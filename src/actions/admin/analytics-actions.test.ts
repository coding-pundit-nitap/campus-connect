import { asAdmin, itGuardsAdminAccess } from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InternalServerError } from "@/lib/custom-error";

import { getDashboardAnalyticsAction } from "./analytics-actions";
import { getOrderStatsAction } from "./order-actions";
import { getShopStatsAction } from "./shop-actions";
import { getUserStatsAction } from "./user-actions";

vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);
vi.mock("./user-actions", () => ({ getUserStatsAction: vi.fn() }));
vi.mock("./shop-actions", () => ({ getShopStatsAction: vi.fn() }));
vi.mock("./order-actions", () => ({ getOrderStatsAction: vi.fn() }));

const ok = <T>(data: T) => ({ success: true, error: false, data }) as never;
const failed = { success: false, error: true, data: null } as never;

describe("getDashboardAnalyticsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
    vi.mocked(getUserStatsAction).mockResolvedValue(ok({ totalUsers: 1 }));
    vi.mocked(getShopStatsAction).mockResolvedValue(ok({ totalShops: 2 }));
    vi.mocked(getOrderStatsAction).mockResolvedValue(ok({ totalOrders: 3 }));
  });

  itGuardsAdminAccess(
    () => getDashboardAnalyticsAction(),
    "Failed to retrieve dashboard analytics."
  );

  it("combines the user, shop and order stats", async () => {
    const res = await getDashboardAnalyticsAction();

    expect(res.data).toEqual({
      users: { totalUsers: 1 },
      shops: { totalShops: 2 },
      orders: { totalOrders: 3 },
    });
  });

  it.each([
    ["user", getUserStatsAction, "Failed to retrieve user statistics"],
    ["shop", getShopStatsAction, "Failed to retrieve shop statistics"],
    ["order", getOrderStatsAction, "Failed to retrieve order statistics"],
  ])(
    "throws InternalServerError when the %s stats fail",
    async (_name, action, message) => {
      vi.mocked(action).mockResolvedValue(failed);

      const promise = getDashboardAnalyticsAction();

      await expect(promise).rejects.toThrow(InternalServerError);
      await expect(promise).rejects.toThrow(message);
    }
  );
});
