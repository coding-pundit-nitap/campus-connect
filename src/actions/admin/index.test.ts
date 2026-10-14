import { describe, expect, it, vi } from "vitest";

import * as adminActions from "./index";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));

describe("admin actions barrel", () => {
  it.each([
    "getDashboardAnalyticsAction",
    "getAuditLogsAction",
    "getBroadcastStatsAction",
    "getAllCategoriesAction",
    "getAllOrdersAction",
    "getAllPayoutsAction",
    "getAllProductsAction",
    "getAllReviewsAction",
    "getAllShopsAction",
    "getAllUsersAction",
  ])("re-exports %s", (name) => {
    expect(adminActions[name as keyof typeof adminActions]).toBeTypeOf(
      "function"
    );
  });
});
