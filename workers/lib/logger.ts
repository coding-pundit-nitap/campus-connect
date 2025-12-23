import pino, { Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

const baseConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  base: {
    service: "campus-connect-worker",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "secret",
      "*.secret",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
};

const logger: Logger = isProduction
  ? pino(baseConfig)
  : pino({
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,service,env",
        },
      },
    });

export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

export const loggers = {
  worker: createLogger({ component: "worker" }),
  notification: createLogger({ component: "notification" }),
  search: createLogger({ component: "search" }),
  audit: createLogger({ component: "audit" }),
  db: createLogger({ component: "database" }),
};

export default logger;
