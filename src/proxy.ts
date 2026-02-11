import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Counter, Histogram } from "prom-client";

import { auth } from "@/auth";
import {
  adminRoutes,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/rbac";

let httpRequestDuration: Histogram | null = null;
let httpRequestTotal: Counter | null = null;

if (process.env.NODE_ENV === "production") {
  try {
    const metricsModule = await import("./app/api/metrics/route");
    httpRequestDuration = metricsModule.httpRequestDuration;
    httpRequestTotal = metricsModule.httpRequestTotal;
  } catch {
    console.warn(
      "[Proxy] Metrics module not available, skipping metrics tracking"
    );
  }
}

function matchRoute(path: string, route: string) {
  const regex = new RegExp(
    "^" + route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/") + "$"
  );
  return regex.test(path);
}

export async function proxy(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { nextUrl } = req;
    const path = nextUrl.pathname;

    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role;

    const isApiAuthRoute = apiAuthPrefix.some((p) => path.startsWith(p));

    const isPublicRoute = publicRoutes.some((route) => matchRoute(path, route));

    const isAuthRoute = authRoutes.some((route) => matchRoute(path, route));

    const isAdminRoute = adminRoutes.some((route) => matchRoute(path, route));

    const isMetricsRoute = path === "/api/metrics";

    let response: NextResponse;

    /**
     * Allow metrics (nginx should protect in prod)
     */
    if (isMetricsRoute) {
      response = NextResponse.next();
    } else if (isApiAuthRoute) {
      /**
       * Allow auth API routes
       */
      response = NextResponse.next();
    } else if (isPublicRoute) {
      /**
       * Allow public pages
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
     * 📊 Metrics Tracking (Production Only)
     */
    if (
      process.env.NODE_ENV === "production" &&
      httpRequestDuration &&
      httpRequestTotal
    ) {
      trackMetrics(req, response, startTime).catch((err) => {
        console.error("[Proxy] Metrics error:", err);
      });
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

async function trackMetrics(
  request: NextRequest,
  response: NextResponse,
  startTime: number
) {
  try {
    const duration = (Date.now() - startTime) / 1000;
    const route = getRoutePattern(request.nextUrl.pathname);
    const method = request.method;
    const statusCode = response.status.toString();

    httpRequestDuration?.observe(
      { method, route, status_code: statusCode },
      duration
    );

    httpRequestTotal?.inc({
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
