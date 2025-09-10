import { NextRequest, NextResponse } from "next/server";


import { SecurityEventType,securityLogger } from "@/lib/security-logger";

/**
 * Security middleware that adds essential security headers to all responses
 * Helps protect against XSS, clickjacking, MIME sniffing, and other common attacks
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy - Helps prevent XSS attacks
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for Next.js dev
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Only set CSP in production to avoid Next.js dev server issues
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", cspDirectives);
  }

  // Strict Transport Security - Force HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filtering
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy - Restrict access to browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

/**
 * Rate limiting configuration
 * Simple in-memory rate limiting (for production, use Redis or similar)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  options: { windowMs: number; max: number } = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }
): boolean {
  const ip = getClientIP(request);
  const now = Date.now();


  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return true;
  }


  if (record.count >= options.max) {
    // Log rate limit violation
    securityLogger.logViolation(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for IP: ${ip}`,
      ip,
      request.headers.get("user-agent") || undefined,
      {
        requestCount: record.count,
        windowMs: options.windowMs,
        maxRequests: options.max,
        path: request.nextUrl.pathname,
      }
    );
    return false;
  }


  record.count++;
  return true;
}

/**
 * Extract client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const xClientIp = request.headers.get("x-client-ip");

  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  if (xRealIp) {
    return xRealIp;
  }

  if (xClientIp) {
    return xClientIp;
  }

  // Fallback to connection remote address
  return (request as any).ip || "unknown";
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString("base64");

}
