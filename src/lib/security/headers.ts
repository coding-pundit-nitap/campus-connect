import { NextResponse } from "next/server";

/**
 * Security Headers Module
 * Provides utilities for setting security-related HTTP headers
 */

export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  cspDirectives?: string[];
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  enableXFrameOptions?: boolean;
  frameOptionsValue?: "DENY" | "SAMEORIGIN";
}

const minioPublicEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT;
if (!minioPublicEndpoint) {
  throw new Error("NEXT_PUBLIC_MINIO_ENDPOINT is not defined");
}

// We need to parse the URL to get the origin (e.g., http://127.0.0.1:9000)
const minioOrigin = new URL(minioPublicEndpoint).origin;

const defaultConfig: Required<SecurityHeadersConfig> = {
  enableCSP: true,
  cspDirectives: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https: blob: ${minioOrigin}`,
    "font-src 'self' data:",
    `connect-src 'self' https: wss: ${minioOrigin}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ],
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  enableXFrameOptions: true,
  frameOptionsValue: "DENY",
};

/**
 * Add comprehensive security headers to a NextResponse
 * Helps protect against XSS, clickjacking, MIME sniffing, and other common attacks
 */
export function addSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const finalConfig = { ...defaultConfig, ...config };

  // Content Security Policy - Helps prevent XSS attacks
  if (finalConfig.enableCSP) {
    const cspValue = finalConfig.cspDirectives.join("; ");

    // Apply CSP in both development and production
    // In development, we allow HTTP connections to localhost for MinIO
    response.headers.set("Content-Security-Policy", cspValue);
  }

  // Strict Transport Security - Force HTTPS
  if (finalConfig.enableHSTS) {
    response.headers.set(
      "Strict-Transport-Security",
      `max-age=${finalConfig.hstsMaxAge}; includeSubDomains; preload`
    );
  }

  // Prevent clickjacking attacks
  if (finalConfig.enableXFrameOptions) {
    response.headers.set("X-Frame-Options", finalConfig.frameOptionsValue);
  }

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
