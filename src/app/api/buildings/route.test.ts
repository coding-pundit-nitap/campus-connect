import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);

describe("GET /api/buildings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active buildings ordered by name", async () => {
    db.building.findMany.mockResolvedValue([{ id: "b1" }]);

    expect(await expectSuccess(await GET())).toEqual([{ id: "b1" }]);
    expect(db.building.findMany).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: [{ name: "asc" }, { hostel_block: "asc" }],
    });
  });

  it("returns 500 when the query fails", async () => {
    db.building.findMany.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Failed to fetch buildings");
  });
});
