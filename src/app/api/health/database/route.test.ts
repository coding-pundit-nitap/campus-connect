import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);

describe("GET /api/health/database", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports healthy with a rounded latency when SELECT 1 succeeds", async () => {
    db.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const data = await expectSuccess<{ status: string; latency: number }>(
      await GET()
    );

    expect(data.status).toBe("healthy");
    expect(Number.isInteger(data.latency)).toBe(true);
  });

  it("returns 503 when the database is unreachable", async () => {
    db.$queryRaw.mockRejectedValue(new Error("down"));

    await expectError(await GET(), 503, "Database is not accessible");
  });
});
