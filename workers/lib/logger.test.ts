import { beforeEach, describe, expect, it, vi } from "vitest";

const { pinoMock, root } = vi.hoisted(() => {
  const root = { child: vi.fn((ctx: unknown) => ({ ctx })) };
  const pinoMock = Object.assign(
    vi.fn((_config: unknown) => root),
    { stdTimeFunctions: { isoTime: () => ',"time":"iso"' } }
  );
  return { pinoMock, root };
});
vi.mock("pino", () => ({ default: pinoMock }));

async function load(env: { NODE_ENV: string; LOG_LEVEL: string }) {
  vi.resetModules();
  vi.doMock("./env.js", () => ({ env }));
  return import("./logger.js");
}

type PinoConfig = {
  level: string;
  base: Record<string, string>;
  transport?: { target: string };
  formatters: { level: (label: string) => unknown };
  redact: { paths: string[]; censor: string };
};
const lastConfig = () =>
  pinoMock.mock.calls.at(-1)?.[0] as unknown as PinoConfig;

describe("worker logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs JSON without a transport in production", async () => {
    const mod = await load({ NODE_ENV: "production", LOG_LEVEL: "warn" });

    expect(lastConfig().transport).toBeUndefined();
    expect(lastConfig().level).toBe("warn");
    expect(lastConfig().base).toEqual({
      service: "campus-connect-worker",
      env: "production",
    });
    expect(mod.default).toBe(root);
  });

  it("pretty-prints outside production", async () => {
    await load({ NODE_ENV: "development", LOG_LEVEL: "debug" });

    expect(lastConfig().transport?.target).toBe("pino-pretty");
  });

  it.each([
    ["production", "info"],
    ["development", "debug"],
  ])("defaults the level in %s to %s", async (NODE_ENV, level) => {
    await load({ NODE_ENV, LOG_LEVEL: "" });

    expect(lastConfig().level).toBe(level);
  });

  it("falls back to 'development' when NODE_ENV is empty", async () => {
    await load({ NODE_ENV: "", LOG_LEVEL: "info" });

    expect(lastConfig().base.env).toBe("development");
  });

  it("formats the level as a label and redacts secrets", async () => {
    await load({ NODE_ENV: "production", LOG_LEVEL: "info" });

    expect(lastConfig().formatters.level("warn")).toEqual({ level: "warn" });
    expect(lastConfig().redact.paths).toEqual(
      expect.arrayContaining(["password", "*.accessToken"])
    );
    expect(lastConfig().redact.censor).toBe("[REDACTED]");
  });

  it("exposes component child loggers", async () => {
    const { loggers, createLogger } = await load({
      NODE_ENV: "production",
      LOG_LEVEL: "info",
    });

    expect(Object.keys(loggers)).toEqual([
      "worker",
      "notification",
      "search",
      "audit",
      "db",
      "batch",
    ]);
    expect(loggers.db).toEqual({ ctx: { component: "database" } });
    expect(createLogger({ job: "x" })).toEqual({ ctx: { job: "x" } });
  });
});
