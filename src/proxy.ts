import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Counter, Histogram } from "prom-client";

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
    const isPublicRoute =
      path === "/" || publicRoutes.some((p) => path.startsWith(p));
    const isAuthRoute = authRoutes.some((p) => path.startsWith(p));
    const isAdminRoute = adminRoutes.some((p) => path.startsWith(p));
    const isApiRoute = path.startsWith("/api/");

    const isMetricsRoute = path === "/api/metrics";

    let response: NextResponse;

    if (isMetricsRoute) {
      // Metrics endpoint is handled by nginx ACL in production
      // Just allow it through - nginx will restrict access
      response = NextResponse.next();
    } else if (isApiAuthRoute || isPublicRoute || isApiRoute) {
      // Always allow access to API auth routes and public routes
      response = NextResponse.next();
    } else if (isAuthRoute && isLoggedIn) {
      // Redirect logged-in users away from auth routes to the default redirect path
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = DEFAULT_LOGIN_REDIRECT;
      response = NextResponse.redirect(redirectUrl);
    } else if (isAdminRoute) {
      // Admin routes require both authentication and ADMIN role
      if (!isLoggedIn) {
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        response = NextResponse.redirect(redirectUrl);
      } else if (userRole !== "ADMIN") {
        // Redirect non-admin users to homepage with error
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("error", "unauthorized");
        response = NextResponse.redirect(redirectUrl);
      } else {
        response = NextResponse.next();
      }
    } else if (!isAuthRoute && !isLoggedIn) {
      // Redirect unauthenticated users trying to access protected routes to login
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      response = NextResponse.redirect(redirectUrl);
    } else {
      // Allow access in all other cases (e.g., logged-in users accessing non-auth routes)
      response = NextResponse.next();
    }

    if (
      process.env.NODE_ENV === "production" &&
      httpRequestDuration &&
      httpRequestTotal
    ) {
      trackMetrics(req, response, startTime).catch((err) => {
        console.error("[Proxy] Error tracking metrics:", err);
      });
    }

    const duration = Date.now() - startTime;
    response.headers.set("x-middleware-duration", String(duration));

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
