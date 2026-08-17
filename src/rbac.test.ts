import { describe, expect, it } from "vitest";

import { adminRoutes, matchRoute, publicApiRoutes, publicRoutes } from "@/rbac";

describe("matchRoute", () => {
  it("matches an exact route", () => {
    expect(matchRoute("/about", "/about")).toBe(true);
  });

  it("rejects a non-matching route", () => {
    expect(matchRoute("/about", "/contact")).toBe(false);
  });

  it("matches a single :param segment", () => {
    expect(matchRoute("/shops/abc123", "/shops/:shop_id")).toBe(true);
  });

  it("does not let a :param span a slash", () => {
    expect(matchRoute("/shops/abc/extra", "/shops/:shop_id")).toBe(false);
  });

  it("matches a :path* wildcard across slashes", () => {
    expect(matchRoute("/api/images/a/b/c.png", "/api/images/:path*")).toBe(true);
  });

  it("requires at least one segment for a wildcard", () => {
    expect(matchRoute("/api/images/", "/api/images/:path*")).toBe(false);
  });

  it("anchors both ends", () => {
    expect(matchRoute("/prefix/about", "/about")).toBe(false);
    expect(matchRoute("/about/suffix", "/about")).toBe(false);
  });
});

describe("route tables", () => {
  it("treats /admin as admin-only and not public", () => {
    expect(adminRoutes.some((r) => matchRoute("/admin", r))).toBe(true);
    expect(publicRoutes.some((r) => matchRoute("/admin", r))).toBe(false);
  });

  it("treats a nested admin path as admin-only", () => {
    expect(adminRoutes.some((r) => matchRoute("/admin/users", r))).toBe(true);
  });

  it("keeps the product detail API public", () => {
    expect(
      publicApiRoutes.some((r) => matchRoute("/api/products/p1", r))
    ).toBe(true);
  });

  it("does not expose the orders API as public", () => {
    // /api/orders is trivially absent, but the real near-miss is a
    // parameterized path like /api/orders/:order_id accidentally
    // matching a wildcard or :param pattern in publicApiRoutes.
    const orderPaths = [
      "/api/orders",
      "/api/orders/some-order-id",
      "/api/orders/some-order-id/status",
    ];
    for (const path of orderPaths) {
      expect(
        publicApiRoutes.some((r) => matchRoute(path, r)),
        `${path} should not be public`
      ).toBe(false);
    }
  });
});
