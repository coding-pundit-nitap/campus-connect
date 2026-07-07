import { ConnectionOptions } from "bullmq";

import { env } from "../../src/config/env.config";

const getRedisConfig = (): ConnectionOptions => {
  if (env.REDIS_URL) {
    try {
      const connectionUrl = new URL(env.REDIS_URL);
      return {
        host: connectionUrl.hostname,
        port: parseInt(connectionUrl.port || "6379"),
        maxRetriesPerRequest: null,
      };
    } catch (e) {
      console.error("Invalid REDIS_URL, falling back to defaults", e);
    }
  }

  return {
    host: env.REDIS_HOST || "redis",
    port: 6379,
    maxRetriesPerRequest: null,
  };
};

export const redisConnection: ConnectionOptions = getRedisConfig();
