import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
  var redisSubscriber: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

const redis =
  global.redis || new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisSubscriber = global.redisSubscriber || redis.duplicate();

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
  global.redisSubscriber = redisSubscriber;
}

redis.on("error", (error) => console.log("Redis Error:", error));
redisSubscriber.on("error", (error) =>
  console.log("Redis Subscriber Error: ", error)
);

redis.on("connect", () => console.log("✅ Redis clients initialized."));

export { redis as redisPublisher, redisSubscriber };
