import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pinoMock = vi.hoisted(() => {
  const child = vi.fn((bindings: object) => ({ bindings }));
  return {
    factory: vi.fn((_options: Record<string, unknown>) => ({ child })),
    child,
  };
});

vi.mock("pino", () => ({ default: pinoMock.factory }));

const loadLogger = async () => import("./logger");

describe("logger", () => {
  beforeEach(() => {
    vi.resetModules();
    pinoMock.factory.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses pino-pretty and debug level outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LOG_LEVEL", undefined);

    await loadLogger();

    expect(pinoMock.factory).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "debug",
        transport: expect.objectContaining({ target: "pino-pretty" }),
      })
    );
  });

  it("uses plain JSON and info level in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOG_LEVEL", undefined);

    await loadLogger();

    const options = pinoMock.factory.mock.calls[0][0];
    expect(options.level).toBe("info");
    expect(options).not.toHaveProperty("transport");
  });

  it("honours an explicit LOG_LEVEL", async () => {
    vi.stubEnv("LOG_LEVEL", "warn");

    await loadLogger();

    expect(pinoMock.factory).toHaveBeenCalledWith(
      expect.objectContaining({ level: "warn" })
    );
  });

  it("creates child loggers tagged with a module name", async () => {
    const { createLogger } = await loadLogger();

    const child = createLogger("orders");

    expect(pinoMock.child).toHaveBeenCalledWith({ module: "orders" });
    expect(child).toEqual({ bindings: { module: "orders" } });
  });
});
