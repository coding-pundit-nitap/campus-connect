import pino, { Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

const baseConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  base: {
    service: "campus-connect",
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

export function logError(
  loggerInstance: Logger,
  error: unknown,
  message: string,
  extra?: Record<string, unknown>
): void {
  if (error instanceof Error) {
    loggerInstance.error(
      {
        err: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        ...extra,
      },
      message
    );
  } else {
    loggerInstance.error({ err: error, ...extra }, message);
  }
}

export const loggers = {
  api: createLogger({ component: "api" }),
  auth: createLogger({ component: "auth" }),
  order: createLogger({ component: "order" }),
  search: createLogger({ component: "search" }),
  notification: createLogger({ component: "notification" }),
  upload: createLogger({ component: "upload" }),
  worker: createLogger({ component: "worker" }),
  db: createLogger({ component: "database" }),
};

export default logger;
