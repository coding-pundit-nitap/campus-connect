import { ConnectionOptions } from "bullmq";

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
      console.error("Invalid REDIS_URL, falling back to defaults", e);
    }
  }

  return {
    host: "redis",
    port: 6379,
    maxRetriesPerRequest: null,
  };
};

export const redisConnection: ConnectionOptions = getRedisConfig();
