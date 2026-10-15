// Rule-based tests for the route access matrix enforced by the proxy
// (src/proxy.ts + src/rbac.ts). Each case drives the proxy with a request
// and asserts what the visitor gets: through, redirected to sign in, or
// redirected with error=unauthorized. Rules A2, A3, A4, A38.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  throws: false,
  httpRequestDuration: null as null | { observe: ReturnType<typeof vi.fn> },
  httpRequestTotal: null as null | { inc: ReturnType<typeof vi.fn> },
}));

// The session is only found when the proxy forwards the request headers.
vi.mock("@/auth", () => ({
  auth: {
    api: {
      getSession: async (args: { headers?: unknown }) => {
        if (state.throws) throw new Error("auth store down");
        return args?.headers instanceof Headers ? state.session : null;
      },
    },
  },
}));
vi.mock("@/app/api/metrics/route", () => ({
  get httpRequestDuration() {
    return state.httpRequestDuration;
  },
  get httpRequestTotal() {
    return state.httpRequestTotal;
  },
}));

type ProxyModule = typeof import("./proxy");
let restoreEnv: () => void = () => {};

async function load(nodeEnv: string): Promise<ProxyModule> {
  vi.resetModules();
  const { env } = await import("@/config/env.config");
  const { overrideEnv } = await import("@tests/helpers/api");
  restoreEnv = overrideEnv(env, { NODE_ENV: nodeEnv });
  return import("./proxy");
}

const visit = (proxy: ProxyModule["proxy"], path: string) =>
  proxy(new NextRequest(`http://localhost${path}`));

const passesThrough = (res: Response) =>
  res.headers.get("x-middleware-next") === "1";
const target = (res: Response) => {
  const raw = res.headers.get("location");
  return raw ? new URL(raw) : null;
};
const sentToSignIn = (res: Response, path: string) =>
  !passesThrough(res) &&
  target(res)?.pathname === "/" &&
  target(res)?.searchParams.get("callbackUrl") === path;
const refusedAsNonAdmin = (res: Response) =>
  !passesThrough(res) &&
  target(res)?.pathname === "/" &&
  target(res)?.searchParams.get("error") === "unauthorized";

const as = (role: "USER" | "ADMIN" | null) => {
  state.session = role ? { user: { id: "u1", role } } : null;
};

const PUBLIC_PAGES = [
  "/",
  "/search",
  "/about",
  "/contact",
  "/feed",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/shops",
  "/shops/shop-1",
  "/product/p-1",
  "/manifest.json",
  "/.well-known/assetlinks.json",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

const PUBLIC_APIS = [
  "/api/health/status",
  "/api/health/database",
  "/api/images/campus-connect/shop-images/a.png",
  "/api/shops/all",
  "/api/shops/shop-1",
  "/api/shops/shop-1/products",
  "/api/shops/shop-1/next-slot",
  "/api/shops/shop-1/batch-slots",
  "/api/products",
  "/api/products/p-1",
  "/api/reviews/p-1",
  "/api/search",
  "/api/search/products",
];

const PROTECTED = [
  "/orders",
  "/checkout",
  "/owner-shops",
  "/owner-shops/orders/o-1",
  "/api/orders",
  "/api/cart",
  "/api/notifications",
  "/api/vendor/earnings",
  "/api/upload",
  "/api/users/me",
  "/api/shops/shop-1/batch-progress",
];

const ADMIN = [
  "/admin",
  "/admin/users",
  "/admin/users/u-2",
  "/admin/users/u-2/audit/deep",
];

describe("proxy access matrix", () => {
  let proxy: ProxyModule["proxy"];

  beforeEach(async () => {
    state.session = null;
    state.throws = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    ({ proxy } = await load("test"));
  });
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
  });

  describe("RULE A2: public pages and public APIs are reachable signed out", () => {
    it.each([...PUBLIC_PAGES, ...PUBLIC_APIS])(
      "RULE A2: %s is reachable signed out",
      async (path) => {
        as(null);
        expect(passesThrough(await visit(proxy, path))).toBe(true);
      }
    );
  });

  describe("RULE A2: every other page and API requires a session", () => {
    it.each(PROTECTED)(
      "RULE A2: %s sends a signed-out visitor to sign in with a callbackUrl",
      async (path) => {
        as(null);
        expect(sentToSignIn(await visit(proxy, path), path)).toBe(true);
      }
    );

    it.each(PROTECTED)(
      "RULE A2: %s is reachable for a signed-in user",
      async (path) => {
        as("USER");
        expect(passesThrough(await visit(proxy, path))).toBe(true);
      }
    );

    it("RULE A2: the session is read from the incoming request (a signed-in user is recognised)", async () => {
      as("ADMIN");
      expect(passesThrough(await visit(proxy, "/admin"))).toBe(true);
    });
  });

  describe("RULE A3: everything under /admin is ADMIN-only, at any depth", () => {
    it.each(ADMIN)(
      "RULE A3: %s sends a signed-out visitor to sign in",
      async (path) => {
        as(null);
        expect(sentToSignIn(await visit(proxy, path), path)).toBe(true);
      }
    );

    it.each(ADMIN)(
      "RULE A3: %s refuses a signed-in non-admin",
      async (path) => {
        as("USER");
        expect(refusedAsNonAdmin(await visit(proxy, path))).toBe(true);
      }
    );

    it.each(ADMIN)("RULE A3: %s lets an admin through", async (path) => {
      as("ADMIN");
      expect(passesThrough(await visit(proxy, path))).toBe(true);
    });

    it("RULE A3: a look-alike path (/administrator) is not treated as admin", async () => {
      as("USER");
      expect(passesThrough(await visit(proxy, "/administrator"))).toBe(true);
    });
  });

  describe("RULE A2: auth pages", () => {
    it("RULE A2: a signed-in user visiting /error is sent to DEFAULT_LOGIN_REDIRECT (/)", async () => {
      as("USER");
      const res = await visit(proxy, "/error");
      expect(passesThrough(res)).toBe(false);
      expect(target(res)?.pathname).toBe("/");
      expect(target(res)?.search).toBe("");
    });

    it("RULE A2: a signed-out visitor sees /error only after signing in (it is not a public page)", async () => {
      as(null);
      expect(sentToSignIn(await visit(proxy, "/error"), "/error")).toBe(true);
    });

    it.each(["/api/auth/session", "/api/auth/callback/google"])(
      "RULE A2: auth API %s is always reachable, even if the auth store is down",
      async (path) => {
        state.throws = true;
        expect(passesThrough(await visit(proxy, path))).toBe(true);
      }
    );

    it("RULE A2: /api/metrics passes the proxy without a session (the route enforces its own Prometheus bearer token)", async () => {
      state.throws = true;
      expect(passesThrough(await visit(proxy, "/api/metrics"))).toBe(true);
    });
  });

  describe("RULE A4: the proxy fails closed when the session lookup fails", () => {
    it.each([...PROTECTED, ...ADMIN])(
      "RULE A4: %s is not passed through when the auth store is down",
      async (path) => {
        state.throws = true;
        expect(sentToSignIn(await visit(proxy, path), path)).toBe(true);
      }
    );

    it.each(["/", "/shops/shop-1", "/api/products"])(
      "RULE A4: public %s stays reachable when the auth store is down",
      async (path) => {
        state.throws = true;
        expect(passesThrough(await visit(proxy, path))).toBe(true);
      }
    );
  });

  it("RULE A2: the request duration header reports elapsed milliseconds", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => {
      const t = now;
      now += 250;
      return t;
    });
    const res = await visit(proxy, "/api/auth/session");
    expect(Number(res.headers.get("x-middleware-duration"))).toBe(250);

    now = 2_000_000;
    as(null);
    const page = await visit(proxy, "/about");
    expect(Number(page.headers.get("x-middleware-duration"))).toBeLessThan(
      10_000
    );
    expect(Number(page.headers.get("x-middleware-duration"))).toBeGreaterThan(
      0
    );
  });

  it("matcher: runs for pages and APIs (including API asset-like paths) but not for static assets", async () => {
    const { config } = await import("./proxy");
    const matches = (path: string) =>
      config.matcher.some((m) => new RegExp(`^${m}$`).test(path));

    expect(matches("/admin")).toBe(true);
    expect(matches("/orders")).toBe(true);
    expect(matches("/api/images/b/a.png")).toBe(true);
    expect(matches("/_next/static/chunk.js")).toBe(false);
    expect(matches("/logo.png")).toBe(false);
  });

  it.todo(
    "RULE A38: signed-out calls to protected /api/* get a 401 JSON response from the proxy rather than a 307 redirect to the home page — code currently redirects; needs product decision"
  );
});

describe("proxy metrics", () => {
  beforeEach(() => {
    state.session = null;
    state.throws = false;
    state.httpRequestDuration = { observe: vi.fn() };
    state.httpRequestTotal = { inc: vi.fn() };
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
    state.httpRequestDuration = null;
    state.httpRequestTotal = null;
  });

  it("records nothing outside production, even when metrics exist", async () => {
    const { proxy } = await load("test");
    await visit(proxy, "/");
    expect(state.httpRequestDuration!.observe).not.toHaveBeenCalled();
    expect(state.httpRequestTotal!.inc).not.toHaveBeenCalled();
  });

  it("records nothing while only one of the two metrics is initialised", async () => {
    const { proxy } = await load("production");
    state.httpRequestTotal = null;
    await visit(proxy, "/");
    expect(state.httpRequestDuration!.observe).not.toHaveBeenCalled();

    state.httpRequestTotal = { inc: vi.fn() };
    state.httpRequestDuration = null;
    await visit(proxy, "/");
    expect(state.httpRequestTotal.inc).not.toHaveBeenCalled();
  });

  it("observes the request duration in seconds", async () => {
    const { proxy } = await load("production");
    let now = 5_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => {
      const t = now;
      now += 2_000;
      return t;
    });
    await visit(proxy, "/");
    const seconds = state.httpRequestDuration!.observe.mock.calls[0][1];
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThan(60);
  });

  it("labels a path segment holding an e-mail address as :email", async () => {
    const { proxy } = await load("production");
    as("USER");
    await visit(proxy, "/profile/jane.doe@b.com");
    expect(state.httpRequestTotal!.inc).toHaveBeenCalledWith(
      expect.objectContaining({ route: "/profile/:email" })
    );
  });
});
