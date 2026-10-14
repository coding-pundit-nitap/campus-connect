import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { PrismaPgMock, PrismaClientMock } = vi.hoisted(() => ({
  PrismaPgMock: vi.fn(function PrismaPg() {}),
  PrismaClientMock: vi.fn(function PrismaClient() {}),
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: PrismaPgMock }));
vi.mock("../generated/client/index.js", () => ({
  PrismaClient: PrismaClientMock,
}));

const globalForPrisma = global as unknown as {
  prisma: unknown;
  adapter: unknown;
};

async function load(NODE_ENV: string) {
  vi.resetModules();
  vi.doMock("./env.js", () => ({
    env: { NODE_ENV, DATABASE_URL: "postgres://db/test" },
  }));
  return (await import("./prisma.js")).prisma;
}

describe("worker prisma client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalForPrisma.prisma = undefined;
    globalForPrisma.adapter = undefined;
  });
  afterEach(() => {
    globalForPrisma.prisma = undefined;
    globalForPrisma.adapter = undefined;
  });

  it("creates a pg-adapter client with info/warn/error logging", async () => {
    const client = await load("production");

    expect(PrismaPgMock).toHaveBeenCalledWith({
      connectionString: "postgres://db/test",
    });
    expect(PrismaClientMock).toHaveBeenCalledWith({
      log: ["info", "warn", "error"],
      adapter: PrismaPgMock.mock.instances[0],
    });
    expect(client).toBe(PrismaClientMock.mock.instances[0]);
  });

  it("does not cache the client globally in production", async () => {
    await load("production");

    expect(globalForPrisma.prisma).toBeUndefined();
    expect(globalForPrisma.adapter).toBeUndefined();
  });

  it("caches client and adapter globally outside production", async () => {
    const client = await load("development");

    expect(globalForPrisma.prisma).toBe(client);
    expect(globalForPrisma.adapter).toBe(PrismaPgMock.mock.instances[0]);
  });

  it("reuses cached instances across reloads", async () => {
    const cachedClient = {};
    globalForPrisma.prisma = cachedClient;
    globalForPrisma.adapter = {};

    const client = await load("development");

    expect(client).toBe(cachedClient);
    expect(PrismaPgMock).not.toHaveBeenCalled();
    expect(PrismaClientMock).not.toHaveBeenCalled();
  });
});
