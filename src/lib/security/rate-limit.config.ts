/**
 * Rate limiting configuration
 * Environment-specific settings for rate limiting middleware
 */

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipInternalIPs?: boolean;
  skipRoutes?: string[];
}

export const getRateLimitConfig = (): RateLimitConfig => {
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min in dev, 15 min in prod
    max: isDevelopment ? 1000 : 100, // Much higher limit in development
    skipInternalIPs: isDevelopment, // Skip rate limiting for internal IPs in development
    skipRoutes: isDevelopment
      ? [
          "/favicon.ico",
          "/.well-known/",
          "/api/health",
          "/_next/static",
          "/_next/image",
          "/api/auth/session", // NextAuth makes many session checks
        ]
      : ["/favicon.ico", "/_next/static", "/_next/image"],
  };
};

/**
 * Routes that should have more lenient rate limiting
 */
export const getLenientRateLimitConfig = (): RateLimitConfig => {
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    windowMs: 60 * 1000, // 1 minute
    max: isDevelopment ? 500 : 50, // Higher limit for static assets and health checks
    skipInternalIPs: isDevelopment,
  };
};
