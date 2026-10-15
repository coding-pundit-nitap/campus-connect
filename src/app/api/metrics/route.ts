import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";

import { NextRequest, NextResponse } from "next/server";
import type { Counter, Histogram, Registry } from "prom-client";

import { env } from "@/config/env.config";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
const log = createLogger("route");

let register: Registry | null = null;
export let httpRequestDuration: Histogram | null = null;
export let httpRequestTotal: Counter | null = null;
export let authenticationAttempts: Counter | null = null;
export let activeUsers: Counter | null = null;
export let databaseQueryDuration: Histogram | null = null;

let initialized = false;

let cachedToken: string | null | undefined;

/** The scrape token from METRICS_TOKEN_FILE or METRICS_TOKEN (read once). */
function expectedToken(): string | null {
  if (cachedToken !== undefined) return cachedToken;
  let token = env.METRICS_TOKEN ?? null;
  if (env.METRICS_TOKEN_FILE) {
    try {
      token = readFileSync(env.METRICS_TOKEN_FILE, "utf8").trim() || null;
    } catch (error) {
      log.error({ err: error }, "[Metrics] Cannot read METRICS_TOKEN_FILE");
      token = null;
    }
  }
  cachedToken = token;
  return token;
}

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Only Prometheus may scrape: it must send `Authorization: Bearer <token>`.
 * Fails closed when no token is configured. Compares digests so the check
 * is constant-time regardless of input length.
 */
function isAuthorizedScrape(request: NextRequest): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const match = /^Bearer (.+)$/.exec(
    request.headers.get("authorization") ?? ""
  );
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(expected));
}

async function initializeMetrics() {
  if (initialized || env.NODE_ENV !== "production") return;
  initialized = true;

  try {
    const promClient = await import("prom-client");

    register = promClient.register;
    promClient.collectDefaultMetrics({ register });

    httpRequestDuration = new promClient.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      registers: [register],
    });

    httpRequestTotal = new promClient.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [register],
    });

    authenticationAttempts = new promClient.Counter({
      name: "authentication_attempts_total",
      help: "Total number of authentication attempts",
      labelNames: ["status", "method"],
      registers: [register],
    });

    activeUsers = new promClient.Counter({
      name: "active_users_total",
      help: "Total number of active users",
      labelNames: ["role"],
      registers: [register],
    });

    databaseQueryDuration = new promClient.Histogram({
      name: "database_query_duration_seconds",
      help: "Duration of database queries in seconds",
      labelNames: ["operation", "model"],
      registers: [register],
    });

    log.debug("[Metrics] Prometheus metrics initialized for production");
  } catch (error) {
    log.error({ err: error }, "[Metrics] Failed to initialize Prometheus:");
    initialized = false;
  }
}

export async function GET(request: NextRequest) {
  if (env.NODE_ENV !== "production") {
    return jsonResponse(
      { error: "Metrics endpoint only available in production" },
      404
    );
  }

  if (!isAuthorizedScrape(request)) {
    log.warn(
      {
        forwardedFor: request.headers.get("x-forwarded-for"),
        realIp: request.headers.get("x-real-ip"),
      },
      "[Metrics] Rejected unauthorized scrape"
    );
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    await initializeMetrics();

    if (!register) {
      return jsonResponse({ error: "Metrics not initialized" }, 500);
    }

    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  } catch (error) {
    log.error({ err: error }, "[Metrics] Error generating metrics:");
    return jsonResponse({ error: "Failed to generate metrics" }, 500);
  }
}

export function trackAuthAttempt(status: "success" | "failed", method: string) {
  if (env.NODE_ENV === "production" && authenticationAttempts) {
    authenticationAttempts.inc({ status, method });
  }
}

export function trackActiveUser(role: string) {
  if (env.NODE_ENV === "production" && activeUsers) {
    activeUsers.inc({ role });
  }
}

export function trackDatabaseQuery(
  operation: string,
  model: string,
  duration: number
) {
  if (env.NODE_ENV === "production" && databaseQueryDuration) {
    databaseQueryDuration.observe({ operation, model }, duration);
  }
}
