import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  PrismaPg: vi.fn(function (this: object, opts: object) {
    Object.assign(this, { kind: "adapter", opts });
  }),
  PrismaClient: vi.fn(function (this: object, opts: object) {
    Object.assign(this, { kind: "client", opts });
  }),
}));

vi.mock("@/config/env.config", () => ({ env: mocks.env }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mocks.PrismaPg }));
vi.mock("@/generated/client", () => ({ PrismaClient: mocks.PrismaClient }));

type GlobalSlots = { prisma?: unknown; adapter?: unknown };
const slots = global as unknown as GlobalSlots;

const load = async () => (await import("./prisma")).prisma;

describe("prisma singleton", () => {
  let saved: GlobalSlots;

  beforeEach(() => {
    vi.resetModules();
    mocks.PrismaPg.mockClear();
    mocks.PrismaClient.mockClear();
    saved = { prisma: slots.prisma, adapter: slots.adapter };
    delete slots.prisma;
    delete slots.adapter;
    Object.assign(mocks.env, {
      DATABASE_URL: "postgres://db",
      NODE_ENV: "test",
    });
  });

  afterEach(() => {
    slots.prisma = saved.prisma;
    slots.adapter = saved.adapter;
  });

  it("creates a pg adapter from DATABASE_URL and logs only errors", async () => {
    const prisma = await load();

    expect(mocks.PrismaPg).toHaveBeenCalledWith({
      connectionString: "postgres://db",
    });
    expect(mocks.PrismaClient).toHaveBeenCalledWith({
      log: ["error"],
      adapter: mocks.PrismaPg.mock.instances[0],
    });
    expect(prisma).toBe(mocks.PrismaClient.mock.instances[0]);
  });

  it("logs warnings too in development", async () => {
    mocks.env.NODE_ENV = "development";

    await load();

    expect(mocks.PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ["warn", "error"] })
    );
  });

  it("caches the client on global outside production (hot-reload safe)", async () => {
    const prisma = await load();

    expect(slots.prisma).toBe(prisma);
    expect(slots.adapter).toBe(mocks.PrismaPg.mock.instances[0]);
  });

  it("does not cache on global in production", async () => {
    mocks.env.NODE_ENV = "production";

    await load();

    expect(slots.prisma).toBeUndefined();
    expect(slots.adapter).toBeUndefined();
  });

  it("reuses an existing global client and adapter", async () => {
    const existing = { kind: "existing" };
    slots.prisma = existing;
    slots.adapter = { kind: "existing-adapter" };

    const prisma = await load();

    expect(prisma).toBe(existing);
    expect(mocks.PrismaPg).not.toHaveBeenCalled();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });
});
