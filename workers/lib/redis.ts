import Redis from "ioredis";

import { env } from "../../src/config/env.config";

const redisUrl = env.REDIS_URL || `redis://${env.REDIS_HOST || "redis"}:6379`;

const globalForRedis = global as unknown as {
  redis: Redis | undefined;
};

export const redisPublisher =
  globalForRedis.redis || new Redis(redisUrl, { maxRetriesPerRequest: null });

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redisPublisher;
}

redisPublisher.setMaxListeners(0);
redisPublisher.removeAllListeners("error");
redisPublisher.on("error", (error) => console.error("Redis Error:", error));
redisPublisher.on("connect", () =>
  console.log("✅ Worker Redis client connected.")
);
