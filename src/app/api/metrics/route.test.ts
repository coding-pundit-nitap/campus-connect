import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

const TOKEN = "t".repeat(40);

/** Fresh module per test: the route keeps one-time init and token state. */
async function load(
  nodeEnv: string,
  auth: { METRICS_TOKEN?: string; METRICS_TOKEN_FILE?: string } = {
    METRICS_TOKEN: TOKEN,
  }
): Promise<RouteModule> {
  vi.resetModules();
  const { env } = await import("@/config/env.config");
  restore = overrideEnv(env, {
    NODE_ENV: nodeEnv,
    METRICS_TOKEN: undefined,
    METRICS_TOKEN_FILE: undefined,
    ...auth,
  });
  return import("./route");
}

let restore: () => void = () => {};
const realRegister = prom.register;
const req = (authorization: string | null = `Bearer ${TOKEN}`) =>
  makeRequest("/api/metrics", {
    headers: {
      "x-forwarded-for": "1.2.3.4",
      ...(authorization === null ? {} : { authorization }),
    },
  });

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

  describe("only Prometheus may scrape (bearer token)", () => {
    const unauthorized = { status: 401, body: { error: "Unauthorized" } };

    it.each([
      ["no Authorization header", null],
      ["a wrong token", "Bearer wrong-token"],
      ["the token with a wrong scheme", `Basic ${TOKEN}`],
      ["an empty bearer", "Bearer "],
      ["a token prefix", `Bearer ${TOKEN.slice(0, 20)}`],
    ])("rejects a request with %s", async (_label, authorization) => {
      const { GET } = await load("production");

      expect(await readJson(await GET(req(authorization)))).toEqual(
        unauthorized
      );
      expect(prom.collectDefaultMetrics).not.toHaveBeenCalled();
    });

    it("stays closed when no token is configured, even with a header", async () => {
      const { GET } = await load("production", {});

      expect(await readJson(await GET(req()))).toEqual(unauthorized);
    });

    it("accepts the token read from METRICS_TOKEN_FILE (Docker secret)", async () => {
      const file = join(mkdtempSync(join(tmpdir(), "metrics-")), "token");
      writeFileSync(file, "file-token-0123456789-0123456789-abc\n");
      const { GET } = await load("production", { METRICS_TOKEN_FILE: file });

      const res = await GET(req("Bearer file-token-0123456789-0123456789-abc"));
      expect(res.status).toBe(200);
    });

    it("the file takes precedence over METRICS_TOKEN", async () => {
      const file = join(mkdtempSync(join(tmpdir(), "metrics-")), "token");
      writeFileSync(file, "from-file-token-0123456789-0123456789");
      const { GET } = await load("production", {
        METRICS_TOKEN: TOKEN,
        METRICS_TOKEN_FILE: file,
      });

      expect((await GET(req())).status).toBe(401);
    });

    it.each([
      ["missing", "/nonexistent/metrics_token"],
      ["empty", "EMPTY"],
    ])("stays closed when the token file is %s", async (_label, path) => {
      let file = path;
      if (path === "EMPTY") {
        file = join(mkdtempSync(join(tmpdir(), "metrics-")), "token");
        writeFileSync(file, "  \n");
      }
      const { GET } = await load("production", { METRICS_TOKEN_FILE: file });

      expect((await GET(req())).status).toBe(401);
      expect((await GET(req("Bearer "))).status).toBe(401);
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
