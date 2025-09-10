import { NextRequest, NextResponse } from "next/server";

import { isSameOrigin, requiresCSRFProtection } from "./csrf-protection";
import { addSecurityHeaders } from "./headers";
import { getClientIP } from "./ip-detection";
import { SecurityEventType, securityLogger } from "./logger";
import { rateLimit, RateLimitOptions } from "./rate-limiting";

/**
 * Comprehensive Security Middleware
 * Combines all security measures into a single, configurable middleware
 */

export interface SecurityMiddlewareConfig {
  enableSecurityHeaders?: boolean;
  enableRateLimit?: boolean;
  enableCSRFProtection?: boolean;
  enableRequestLogging?: boolean;
  customRateLimitOptions?: RateLimitOptions;
  skipPaths?: string[];
}

const defaultConfig: Required<SecurityMiddlewareConfig> = {
  enableSecurityHeaders: true,
  enableRateLimit: true,
  enableCSRFProtection: true,
  enableRequestLogging: true,
  customRateLimitOptions: {},
  skipPaths: ["/favicon.ico", "/_next/static", "/_next/image"],
};

/**
 * Main security middleware function
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityMiddlewareConfig = {}
): Promise<NextResponse | null> {
  const finalConfig = { ...defaultConfig, ...config };
  const { pathname } = request.nextUrl;

  // Skip processing for specified paths
  if (finalConfig.skipPaths.some((path) => pathname.startsWith(path))) {
    return null; // Continue to next middleware
  }

  // Log security-relevant requests
  if (finalConfig.enableRequestLogging) {
    logSecurityEvent(request);
  }

  // Apply rate limiting
  if (finalConfig.enableRateLimit) {
    const rateLimitPassed = await rateLimit(
      request,
      finalConfig.customRateLimitOptions
    );
    if (!rateLimitPassed) {
      return createSecurityResponse(
        "Too Many Requests",
        429,
        finalConfig.enableSecurityHeaders
      );
    }
  }

  // Apply CSRF protection for state-changing methods
  if (
    finalConfig.enableCSRFProtection &&
    requiresCSRFProtection(request.method)
  ) {
    if (!isSameOrigin(request)) {
      securityLogger.logViolation(
        SecurityEventType.CSRF_VIOLATION,
        "CSRF protection failed: Invalid origin",
        getClientIP(request),
        request.headers.get("user-agent") || undefined,
        {
          origin: request.headers.get("origin"),
          referer: request.headers.get("referer"),
          path: pathname,
          method: request.method,
        }
      );

      return createSecurityResponse(
        "Forbidden: Invalid origin",
        403,
        finalConfig.enableSecurityHeaders
      );
    }
  }

  // Continue to next middleware
  return null;
}

/**
 * Create a security response with appropriate headers
 */
function createSecurityResponse(
  message: string,
  status: number,
  enableSecurityHeaders: boolean
): NextResponse {
  const response = new NextResponse(message, { status });

  if (enableSecurityHeaders) {
    return addSecurityHeaders(response);
  }

  return response;
}

/**
 * Log security-relevant events
 */
function logSecurityEvent(request: NextRequest): void {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent");

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /(exec|eval|system|cmd)/i, // Command injection
  ];

  const fullPath = pathname + search;
  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(fullPath)
  );

  if (isSuspicious) {
    securityLogger.logViolation(
      SecurityEventType.SUSPICIOUS_REQUEST,
      "Suspicious request pattern detected",
      ip,
      userAgent || undefined,
      {
        path: pathname,
        query: search,
        method,
        patterns: suspiciousPatterns
          .filter((pattern) => pattern.test(fullPath))
          .map((p) => p.source),
      }
    );
  }

  // Log high-risk requests
  const highRiskPaths = [
    "/admin",
    "/api/admin",
    "/.env",
    "/wp-admin",
    "/phpmyadmin",
    "/config",
  ];

  if (highRiskPaths.some((path) => pathname.startsWith(path))) {
    securityLogger.logViolation(
      SecurityEventType.ACCESS_DENIED,
      "Access attempt to high-risk path",
      ip,
      userAgent || undefined,
      {
        path: pathname,
        method,
        category: "high-risk-path",
      }
    );
  }
}

/**
 * Security response wrapper that ensures security headers are applied
 */
export function withSecurity(response: NextResponse): NextResponse {
  return addSecurityHeaders(response);
}

/**
 * Enhanced middleware creator with custom configuration
 */
export function createSecurityMiddleware(
  config: SecurityMiddlewareConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return securityMiddleware(request, config);
  };
}

/**
 * Security health check
 */
export function performSecurityHealthCheck(): {
  status: "healthy" | "warning" | "critical";
  checks: Array<{ name: string; status: boolean; message?: string }>;
} {
  const checks = [
    {
      name: "Environment Variables",
      status: !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
      message: process.env.AUTH_SECRET
        ? undefined
        : "AUTH_SECRET not configured properly",
    },
    {
      name: "HTTPS in Production",
      status:
        process.env.NODE_ENV !== "production" ||
        (process.env.AUTH_URL?.startsWith("https://") ?? false),
      message:
        process.env.NODE_ENV === "production" &&
        !process.env.AUTH_URL?.startsWith("https://")
          ? "HTTPS not configured for production"
          : undefined,
    },
    {
      name: "Security Headers",
      status: true, // Always available in this implementation
    },
    {
      name: "Rate Limiting",
      status: true, // Always available in this implementation
    },
    {
      name: "CSRF Protection",
      status: true, // Always available in this implementation
    },
  ];

  const failedChecks = checks.filter((check) => !check.status);
  const criticalFailures = failedChecks.filter(
    (check) =>
      check.name === "HTTPS in Production" ||
      check.name === "Environment Variables"
  );

  let status: "healthy" | "warning" | "critical";
  if (criticalFailures.length > 0) {
    status = "critical";
  } else if (failedChecks.length > 0) {
    status = "warning";
  } else {
    status = "healthy";
  }

  return { status, checks };
}
