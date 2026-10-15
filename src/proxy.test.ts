import { overrideEnv } from "@tests/helpers/api";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getSession: vi.fn(),
  httpRequestDuration: null as null | { observe: ReturnType<typeof vi.fn> },
  httpRequestTotal: null as null | { inc: ReturnType<typeof vi.fn> },
}));

vi.mock("@/auth", () => ({
  auth: { api: { getSession: state.getSession } },
}));
// Getters mimic the live `export let` bindings of the real metrics module.
const metricsFactory = vi.hoisted(() => () => ({
  get httpRequestDuration() {
    return state.httpRequestDuration;
  },
  get httpRequestTotal() {
    return state.httpRequestTotal;
  },
}));
vi.mock("@/app/api/metrics/route", () => metricsFactory());

type ProxyModule = typeof import("./proxy");
let restoreEnv: () => void = () => {};
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

/** Fresh proxy module evaluated under the given NODE_ENV. */
async function load(nodeEnv: string): Promise<ProxyModule> {
  vi.resetModules();
  const { env } = await import("@/config/env.config");
  restoreEnv = overrideEnv(env, { NODE_ENV: nodeEnv });
  return import("./proxy");
}

const request = (path: string) => new NextRequest(`http://localhost${path}`);
const signIn = (role = "USER") =>
  state.getSession.mockResolvedValue({ user: { id: "u1", role } });

const isPassThrough = (res: Response) =>
  res.headers.get("x-middleware-next") === "1";
const location = (res: Response) => {
  const raw = res.headers.get("location");
  return raw ? new URL(raw) : null;
};

describe("proxy", () => {
  let proxy: ProxyModule["proxy"];

  beforeEach(async () => {
    vi.clearAllMocks();
    state.getSession.mockResolvedValue(null);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    ({ proxy } = await load("test"));
  });
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
  });

  it.each(["/api/auth/session", "/api/metrics"])(
    "passes %s through without reading the session",
    async (path) => {
      const res = await proxy(request(path));

      expect(isPassThrough(res)).toBe(true);
      expect(res.headers.get("x-middleware-duration")).toMatch(/^\d+$/);
      expect(state.getSession).not.toHaveBeenCalled();
    }
  );

  it.each(["/", "/shops/s1", "/api/products", "/api/search/products"])(
    "allows anonymous access to public %s",
    async (path) => {
      const res = await proxy(request(path));

      expect(isPassThrough(res)).toBe(true);
      expect(res.headers.get("x-middleware-duration")).toMatch(/^\d+$/);
    }
  );

  it("redirects signed-in users away from auth routes", async () => {
    signIn();

    const res = await proxy(request("/error"));

    expect(location(res)?.pathname).toBe("/");
    expect(location(res)?.search).toBe("");
  });

  it("redirects anonymous users from protected pages with a callbackUrl", async () => {
    const res = await proxy(request("/orders"));

    expect(location(res)?.pathname).toBe("/");
    expect(location(res)?.searchParams.get("callbackUrl")).toBe("/orders");
  });

  it("allows signed-in users onto protected pages", async () => {
    signIn();

    expect(isPassThrough(await proxy(request("/orders")))).toBe(true);
  });

  describe("admin routes", () => {
    it("redirects anonymous users with a callbackUrl", async () => {
      const res = await proxy(request("/admin/users"));

      expect(location(res)?.searchParams.get("callbackUrl")).toBe(
        "/admin/users"
      );
    });

    it("redirects non-admins with an unauthorized error", async () => {
      signIn("USER");

      const res = await proxy(request("/admin"));

      expect(location(res)?.pathname).toBe("/");
      expect(location(res)?.searchParams.get("error")).toBe("unauthorized");
    });

    it("allows admins", async () => {
      signIn("ADMIN");

      expect(isPassThrough(await proxy(request("/admin")))).toBe(true);
    });
  });

  it("fails closed on protected pages when the session lookup throws", async () => {
    state.getSession.mockRejectedValue(new Error("db down"));

    const res = await proxy(request("/orders"));
    expect(isPassThrough(res)).toBe(false);
    expect(location(res)?.searchParams.get("callbackUrl")).toBe("/orders");
    expect(consoleError).toHaveBeenCalled();
  });

  it("keeps public pages reachable when the session lookup throws", async () => {
    state.getSession.mockRejectedValue(new Error("db down"));

    expect(isPassThrough(await proxy(request("/shops/s1")))).toBe(true);
  });

  it("exports a matcher config", async () => {
    const { config } = await import("./proxy");

    expect(config.matcher).toHaveLength(2);
  });
});

describe("proxy metrics (production)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.getSession.mockResolvedValue(null);
    state.httpRequestDuration = null;
    state.httpRequestTotal = null;
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
  });

  const enableMetrics = () => {
    state.httpRequestDuration = { observe: vi.fn() };
    state.httpRequestTotal = { inc: vi.fn() };
  };

  it("records metrics created after the proxy module loaded", async () => {
    const { proxy } = await load("production");
    enableMetrics(); // e.g. the first /api/metrics scrape initialized them

    await proxy(request("/"));

    expect(state.httpRequestDuration!.observe).toHaveBeenCalledWith(
      { method: "GET", route: "/", status_code: "200" },
      expect.any(Number)
    );
    expect(state.httpRequestTotal!.inc).toHaveBeenCalledWith({
      method: "GET",
      route: "/",
      status_code: "200",
    });
  });

  it.each([
    ["/shops/123e4567-e89b-12d3-a456-426614174000", "/shops/:id"],
    ["/orders/42", "/orders/:id"],
    ["/profile/a@b.com", "/profile/:email"],
    ["/posts/hello-world", "/posts/:slug"],
    ["/users/abc", "/users/:id"],
  ])("normalizes %s to the route label %s", async (path, route) => {
    signIn();
    const { proxy } = await load("production");
    enableMetrics();

    await proxy(request(path));

    expect(state.httpRequestTotal!.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route })
    );
  });

  it("skips tracking while the metrics are not initialized", async () => {
    const { proxy } = await load("production");

    const res = await proxy(request("/"));

    expect(isPassThrough(res)).toBe(true);
  });

  it("still responds when recording a metric throws", async () => {
    const { proxy } = await load("production");
    enableMetrics();
    state.httpRequestDuration!.observe.mockImplementation(() => {
      throw new Error("label mismatch");
    });

    const res = await proxy(request("/"));

    expect(isPassThrough(res)).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      "[Proxy] Error in trackMetrics:",
      expect.any(Error)
    );
  });

  it("works without metrics when the metrics module fails to load", async () => {
    vi.doMock("@/app/api/metrics/route", () => {
      throw new Error("prom-client missing");
    });
    const { proxy } = await load("production");
    vi.doMock("@/app/api/metrics/route", () => metricsFactory());

    expect(isPassThrough(await proxy(request("/")))).toBe(true);
    expect(consoleWarn).toHaveBeenCalled();
  });
});
