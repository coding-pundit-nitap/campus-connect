import { asMock, overrideEnv } from "@tests/helpers/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { env } from "@/config/env.config";
import { prisma } from "@/lib/prisma";

import sitemap, { revalidate } from "./sitemap";

const db = asMock(prisma);
const BASE = env.NEXT_PUBLIC_APP_URL;
const UPDATED = new Date("2026-01-01T00:00:00Z");

describe("sitemap", () => {
  let restore: () => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    db.shop.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([]);
  });
  afterEach(() => restore());

  it("revalidates hourly", () => {
    expect(revalidate).toBe(3600);
  });

  it("lists static pages followed by active shops and products", async () => {
    db.shop.findMany.mockResolvedValue([{ id: "s1", updated_at: UPDATED }]);
    db.product.findMany.mockResolvedValue([{ id: "p1", updated_at: UPDATED }]);

    const entries = await sitemap();

    expect(entries[0]).toMatchObject({ url: BASE, priority: 1.0 });
    expect(entries.slice(-2)).toEqual([
      {
        url: `${BASE}/shops/s1`,
        lastModified: UPDATED,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${BASE}/product/p1`,
        lastModified: UPDATED,
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ]);
    expect(db.shop.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { is_active: true, deleted_at: null } })
    );
  });

  it("falls back to static pages when the database fails", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    db.product.findMany.mockRejectedValue(new Error("db down"));

    const entries = await sitemap();

    expect(entries).toHaveLength(9);
    expect(entries.every((e) => !e.url.includes("/product/"))).toBe(true);
  });

  it("uses the production URL without an app URL", async () => {
    restore = overrideEnv(env, { NEXT_PUBLIC_APP_URL: undefined });

    const [home] = await sitemap();

    expect(home.url).toBe("https://connect.nitap.ac.in");
  });
});
