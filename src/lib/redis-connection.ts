import { ConnectionOptions } from "bullmq";

import { createLogger } from "@/lib/logger";
const log = createLogger("redis-connection");

const getRedisConfig = (): ConnectionOptions => {
  if (process.env.REDIS_URL) {
    try {
      const connectionUrl = new URL(process.env.REDIS_URL);
      return {
        host: connectionUrl.hostname,
        port: parseInt(connectionUrl.port || "6379"),
        maxRetriesPerRequest: null,
      };
    } catch (e) {
      log.error({ err: e }, "Invalid REDIS_URL, falling back to defaults");
    }
  }

  return {
    host: "redis",
    port: 6379,
    maxRetriesPerRequest: null,
  };
};

export const redisConnection: ConnectionOptions = getRedisConfig();
