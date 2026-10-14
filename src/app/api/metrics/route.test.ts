import { makeRequest, readJson } from "@tests/helpers";
import { overrideEnv } from "@tests/helpers/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prom = vi.hoisted(() => {
  const metric = () => ({ inc: vi.fn(), observe: vi.fn() });
  return {
    register: {
      metrics: vi.fn(async () => "# metrics"),
      contentType: "text/plain; version=0.0.4",
    } as { metrics: () => Promise<string>; contentType: string } | undefined,
    collectDefaultMetrics: vi.fn(),
    Histogram: vi.fn(function Histogram() {
      return metric();
    }),
    Counter: vi.fn(function Counter() {
      return metric();
    }),
  };
});

vi.mock("prom-client", () => ({
  get register() {
    return prom.register;
  },
  collectDefaultMetrics: prom.collectDefaultMetrics,
  Histogram: prom.Histogram,
  Counter: prom.Counter,
}));

type RouteModule = typeof import("./route");

/** Fresh module per test: the route keeps one-time init state. */
async function load(nodeEnv: string): Promise<RouteModule> {
  vi.resetModules();
  const { env } = await import("@/config/env.config");
  restore = overrideEnv(env, { NODE_ENV: nodeEnv });
  return import("./route");
}

let restore: () => void = () => {};
const realRegister = prom.register;
const req = () =>
  makeRequest("/api/metrics", { headers: { "x-forwarded-for": "1.2.3.4" } });

describe("GET /api/metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prom.register = realRegister;
  });
  afterEach(() => restore());

  it("returns 404 outside production", async () => {
    const { GET } = await load("test");

    expect(await readJson(await GET(req()))).toEqual({
      status: 404,
      body: { error: "Metrics endpoint only available in production" },
    });
  });

  it("initializes prometheus once and serves the registry", async () => {
    const { GET } = await load("production");

    const res = await GET(req());
    await GET(req());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain; version=0.0.4");
    expect(await res.text()).toBe("# metrics");
    expect(prom.collectDefaultMetrics).toHaveBeenCalledTimes(1);
    expect(prom.Histogram).toHaveBeenCalledTimes(2);
    expect(prom.Counter).toHaveBeenCalledTimes(3);
  });

  it("returns 500 when prom-client exposes no registry", async () => {
    prom.register = undefined;
    const { GET } = await load("production");

    expect(await readJson(await GET(req()))).toEqual({
      status: 500,
      body: { error: "Metrics not initialized" },
    });
  });

  it("retries initialization on the next request after it fails", async () => {
    prom.Histogram.mockImplementationOnce(() => {
      throw new Error("duplicate metric");
    });
    const { GET } = await load("production");

    await GET(req());
    await GET(req());

    expect(prom.collectDefaultMetrics).toHaveBeenCalledTimes(2);
  });

  it("returns 500 when rendering metrics fails", async () => {
    vi.mocked(realRegister!.metrics).mockRejectedValueOnce(new Error("boom"));
    const { GET } = await load("production");

    expect(await readJson(await GET(req()))).toEqual({
      status: 500,
      body: { error: "Failed to generate metrics" },
    });
  });
});

describe("metric trackers", () => {
  afterEach(() => restore());

  it("record to the initialized metrics in production", async () => {
    const mod = await load("production");
    await mod.GET(req());

    mod.trackAuthAttempt("success", "google");
    mod.trackActiveUser("ADMIN");
    mod.trackDatabaseQuery("findMany", "Order", 0.25);

    expect(mod.authenticationAttempts!.inc).toHaveBeenCalledWith({
      status: "success",
      method: "google",
    });
    expect(mod.activeUsers!.inc).toHaveBeenCalledWith({ role: "ADMIN" });
    expect(mod.databaseQueryDuration!.observe).toHaveBeenCalledWith(
      { operation: "findMany", model: "Order" },
      0.25
    );
  });

  it("are no-ops before initialization or outside production", async () => {
    const mod = await load("test");

    expect(() => {
      mod.trackAuthAttempt("failed", "google");
      mod.trackActiveUser("USER");
      mod.trackDatabaseQuery("findMany", "Order", 1);
    }).not.toThrow();
    expect(mod.authenticationAttempts).toBeNull();
  });
});
