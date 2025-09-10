import { NextRequest } from "next/server";

import {
  generateRateLimitKey,
  getClientIP,
  isInternalIP,
} from "./ip-detection";
import { SecurityEventType, securityLogger } from "./logger";
import { getRateLimitConfig, type RateLimitConfig } from "./rate-limit.config";

/**
 * Rate Limiting Module
 * Provides comprehensive rate limiting functionality with Redis-like interface
 */

export interface RateLimitOptions extends Partial<RateLimitConfig> {
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (request: NextRequest, limit: RateLimitInfo) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsPerWindow: number;
  resetTime: Date;
  remainingPoints: number;
}

/**
 * In-memory rate limiting store
 * In production, replace with Redis or similar distributed store
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null;
  }

  async set(
    key: string,
    value: { count: number; resetTime: number }
  ): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const existing = this.store.get(key);
    if (existing) {
      existing.count++;
      this.store.set(key, existing);
      return existing;
    }
    throw new Error("Key not found");
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limiting middleware function
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<boolean> {
  const config = { ...getRateLimitConfig(), ...options };

  // Check if route should be skipped
  if (
    config.skipRoutes?.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )
  ) {
    return true;
  }

  // Generate rate limit key
  const keyGenerator =
    options.keyGenerator || ((req) => generateRateLimitKey(req));
  const key = keyGenerator(request);

  // Skip rate limiting for internal IPs in development if configured
  const ip = getClientIP(request);
  if (config.skipInternalIPs && isInternalIP(ip)) {
    return true;
  }

  const now = Date.now();
  const windowEnd = now + config.windowMs;

  try {
    const existing = await rateLimitStore.get(key);

    if (!existing || now > existing.resetTime) {
      // Create new window
      await rateLimitStore.set(key, {
        count: 1,
        resetTime: windowEnd,
      });
      return true;
    }

    if (existing.count >= config.max) {
      // Rate limit exceeded
      const limitInfo: RateLimitInfo = {
        totalHits: existing.count,
        totalHitsPerWindow: existing.count,
        resetTime: new Date(existing.resetTime),
        remainingPoints: 0,
      };

      // Log the violation
      securityLogger.logViolation(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded for key: ${key}`,
        ip,
        request.headers.get("user-agent") || undefined,
        {
          key,
          requestCount: existing.count,
          windowMs: config.windowMs,
          maxRequests: config.max,
          path: request.nextUrl.pathname,
          method: request.method,
        }
      );

      // Call custom handler if provided
      if (options.onLimitReached) {
        options.onLimitReached(request, limitInfo);
      }

      return false;
    }

    // Increment counter
    await rateLimitStore.increment(key);
    return true;
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("Rate limiting error:", error);
    return true;
  }
}

/**
 * Get current rate limit status for a request
 */
export async function getRateLimitStatus(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitInfo | null> {
  const config = { ...getRateLimitConfig(), ...options };
  const keyGenerator =
    options.keyGenerator || ((req) => generateRateLimitKey(req));
  const key = keyGenerator(request);

  try {
    const existing = await rateLimitStore.get(key);

    if (!existing) {
      return {
        totalHits: 0,
        totalHitsPerWindow: 0,
        resetTime: new Date(Date.now() + config.windowMs),
        remainingPoints: config.max,
      };
    }

    const now = Date.now();
    if (now > existing.resetTime) {
      return {
        totalHits: 0,
        totalHitsPerWindow: 0,
        resetTime: new Date(now + config.windowMs),
        remainingPoints: config.max,
      };
    }

    return {
      totalHits: existing.count,
      totalHitsPerWindow: existing.count,
      resetTime: new Date(existing.resetTime),
      remainingPoints: Math.max(0, config.max - existing.count),
    };
  } catch (error) {
    console.error("Error getting rate limit status:", error);
    return null;
  }
}

/**
 * Reset rate limit for a specific key
 */
export async function resetRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<void> {
  const keyGenerator =
    options.keyGenerator || ((req) => generateRateLimitKey(req));
  const key = keyGenerator(request);

  try {
    await rateLimitStore.delete(key);
  } catch (error) {
    console.error("Error resetting rate limit:", error);
  }
}

/**
 * Create a rate limit middleware with custom options
 */
export function createRateLimiter(options: RateLimitOptions) {
  return (request: NextRequest) => rateLimit(request, options);
}

/**
 * Sliding window rate limiter (more sophisticated)
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();

  constructor(
    private windowSize: number = 60000, // 1 minute
    private maxRequests: number = 100
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get or create window for this key
    let window = this.windows.get(key) || [];

    // Remove requests outside the current window
    window = window.filter((timestamp) => timestamp > windowStart);

    // Check if we're under the limit
    if (window.length >= this.maxRequests) {
      this.windows.set(key, window);
      return false;
    }

    // Add current request to window
    window.push(now);
    this.windows.set(key, window);

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowSize;

    for (const [key, window] of this.windows.entries()) {
      const filtered = window.filter((timestamp) => timestamp > cutoff);
      if (filtered.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filtered);
      }
    }
  }
}
