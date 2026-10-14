import pino from "pino";

/**
 * Factory for vi.mock("@/lib/logger") in tests that call vi.resetModules().
 * Re-importing the real logger spawns a new pino-pretty transport (and a
 * process "exit" listener) per reload; this stand-in is a silent pino
 * instance without a transport, created once per factory call.
 *
 *   vi.mock("@/lib/logger", async () =>
 *     (await import("@tests/helpers/lib/logger")).silentLoggerModule());
 */
export function silentLoggerModule() {
  const logger = pino({ level: "silent" });
  return {
    logger,
    createLogger: (name: string) => logger.child({ module: name }),
  };
}
