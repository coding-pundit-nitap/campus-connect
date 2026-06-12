import { NextRequest, NextResponse } from "next/server";

import { applyRateLimit, RateLimitConfig } from "@/lib/rate-limit";

/**
 * Resolve per-path rate limit config.
 *
 * - /api/auth/*   → 10 req / 60 s  (login / OAuth endpoints — strict)
 * - /api/upload/* → 20 req / 60 s  (presigned URL generation)
 * - /api/search/* → 30 req / 60 s  (search endpoints)
 * - everything else → 60 req / 60 s (default)
 */
function resolveConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith("/api/auth")) {
    return { limit: 10, windowSeconds: 60 };
  }
  if (pathname.startsWith("/api/upload")) {
    return { limit: 20, windowSeconds: 60 };
  }
  if (pathname.startsWith("/api/search")) {
    return { limit: 30, windowSeconds: 60 };
  }
  return { limit: 60, windowSeconds: 60 };
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Only rate-limit API routes.
  if (pathname.startsWith("/api/")) {
    const config = resolveConfig(pathname);
    const limited = await applyRateLimit(req, config);
    if (limited) return limited;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
