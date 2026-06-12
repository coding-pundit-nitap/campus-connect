import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 60,
  windowSeconds: 60,
};

// ---------------------------------------------------------------------------
// In-memory fallback store (single-instance; used when Redis is unavailable)
// ---------------------------------------------------------------------------

const memStore = new Map<string, InMemoryEntry>();

function rateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const existing = memStore.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + config.windowSeconds * 1000;
    memStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.limit - 1, resetAt };
  }

  existing.count++;
  if (existing.count > config.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    success: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Redis-backed implementation (sliding window via INCR + PEXPIRE)
// ---------------------------------------------------------------------------

async function rateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  try {
    // Lazy import so this module is safe to use in Edge/middleware without
    // pulling in the full ioredis bundle at build time.
    const { redisPublisher: redis } = await import("@/lib/redis");

    const windowMs = config.windowSeconds * 1000;
    const now = Date.now();

    // Atomic increment; set expiry only on first call in the window.
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttlMs = await redis.pttl(key);
    const resetAt = now + (ttlMs > 0 ? ttlMs : windowMs);

    if (count > config.limit) {
      return { success: false, remaining: 0, resetAt };
    }

    return {
      success: true,
      remaining: config.limit - count,
      resetAt,
    };
  } catch {
    // Redis unavailable — signal caller to fall back to memory store.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Check rate limit for the given request.
 * Uses Redis when available; falls back to in-memory automatically.
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const key = `rl:${ip}:${req.nextUrl.pathname}`;

  const redisResult = await rateLimitRedis(key, config);
  if (redisResult !== null) return redisResult;

  return rateLimitMemory(key, config);
}

/** Build a 429 Too Many Requests response. */
export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

/**
 * Apply rate limiting at the start of an API route handler.
 * Returns a 429 `NextResponse` if the limit is exceeded, or `null` if allowed.
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const limited = await applyRateLimit(req, { limit: 30, windowSeconds: 60 });
 *   if (limited) return limited;
 *   // … handler logic
 * }
 * ```
 */
export async function applyRateLimit(
  req: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await rateLimit(req, config);
  if (!result.success) {
    return rateLimitResponse(result.resetAt);
  }
  return null;
}
