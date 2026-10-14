import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Counter, Histogram } from "prom-client";

import { auth } from "@/auth";
import {
  adminRoutes,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  matchRoute,
  publicApiRoutes,
  publicRoutes,
} from "@/rbac";

import { env } from "./config/env.config";

// Keep the module namespace, not copies of its exports: the metrics are
// created lazily (on the first /api/metrics scrape), so the exported `let`
// bindings are still null at import time and must be read live.
let metricsModule: typeof import("./app/api/metrics/route") | null = null;

if (env.NODE_ENV === "production") {
  try {
    metricsModule = await import("./app/api/metrics/route");
  } catch {
    console.warn(
      "[Proxy] Metrics module not available, skipping metrics tracking"
    );
  }
}

export async function proxy(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { nextUrl } = req;
    const path = nextUrl.pathname;

    const isApiAuthRoute = apiAuthPrefix.some((p) => path.startsWith(p));
    const isMetricsRoute = path === "/api/metrics";

    if (isApiAuthRoute || isMetricsRoute) {
      const response = NextResponse.next();
      response.headers.set(
        "x-middleware-duration",
        String(Date.now() - startTime)
      );
      return response;
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role;

    const isPublicRoute = publicRoutes.some((route) => matchRoute(path, route));

    const isPublicApiRoute = publicApiRoutes.some((route) =>
      matchRoute(path, route)
    );

    const isAuthRoute = authRoutes.some((route) => matchRoute(path, route));

    const isAdminRoute = adminRoutes.some((route) => matchRoute(path, route));

    let response: NextResponse;

    if (isPublicRoute) {
      /**
       * Allow public pages
       */
      response = NextResponse.next();
    } else if (isPublicApiRoute) {
      /**
       * Allow public API routes
       */
      response = NextResponse.next();
    } else if (isAuthRoute && isLoggedIn) {
      /**
       * Redirect logged-in users away from login/register
       */
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = DEFAULT_LOGIN_REDIRECT;
      response = NextResponse.redirect(redirectUrl);
    } else if (isAdminRoute) {
      /**
       * Admin routes protection
       */
      if (!isLoggedIn) {
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("callbackUrl", path);
        response = NextResponse.redirect(redirectUrl);
      } else if (userRole !== "ADMIN") {
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("error", "unauthorized");
        response = NextResponse.redirect(redirectUrl);
      } else {
        response = NextResponse.next();
      }
    } else if (!isLoggedIn) {
      /**
       * All other routes require authentication
       */
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("callbackUrl", path);
      response = NextResponse.redirect(redirectUrl);
    } else {
      /**
       * Default allow
       */
      response = NextResponse.next();
    }

    /**
     * Metrics Tracking (Production Only)
     */
    const requestDuration = metricsModule?.httpRequestDuration;
    const requestTotal = metricsModule?.httpRequestTotal;
    if (env.NODE_ENV === "production" && requestDuration && requestTotal) {
      trackMetrics(req, response, startTime, requestDuration, requestTotal);
    }

    response.headers.set(
      "x-middleware-duration",
      String(Date.now() - startTime)
    );

    return response;
  } catch (error) {
    console.error("[PROXY ERROR]:", error);
    return NextResponse.next();
  }
}

function trackMetrics(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  requestDuration: Histogram,
  requestTotal: Counter
) {
  try {
    const duration = (Date.now() - startTime) / 1000;
    const route = getRoutePattern(request.nextUrl.pathname);
    const method = request.method;
    const statusCode = response.status.toString();

    requestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );

    requestTotal.inc({
      method,
      route,
      status_code: statusCode,
    });
  } catch (error) {
    console.error("[Proxy] Error in trackMetrics:", error);
  }
}

function getRoutePattern(pathname: string): string {
  return pathname
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "/:id"
    )
    .replace(/\/\d+/g, "/:id")
    .replace(/\/[^\/]+@[^\/]+/g, "/:email")
    .replace(/\/posts\/[^\/]+/g, "/posts/:slug")
    .replace(/\/users\/[^\/]+/g, "/users/:id");
}

// Export matcher config for Next.js middleware
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
