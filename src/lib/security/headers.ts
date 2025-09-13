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

const defaultConfig: Required<SecurityHeadersConfig> = {
  enableCSP: true,
  cspDirectives: [
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

    // Only set CSP in production to avoid Next.js dev server issues
    if (process.env.NODE_ENV === "production") {
      response.headers.set("Content-Security-Policy", cspValue);
    }
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

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString("base64");
}

/**
 * Create a CSP header value with nonce support
 */
export function createCSPWithNonce(
  nonce: string,
  customDirectives?: string[]
): string {
  const baseDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  const directives = customDirectives || baseDirectives;
  return directives.join("; ");
}
