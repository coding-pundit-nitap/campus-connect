import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => console.error("Redis Error:", err));

export const redisPublisher = redis;
export const redisSubscriber = redis.duplicate();

redisSubscriber.on("error", (err) =>
  console.error("Redis Subscriber Error:", err)
);

redis.on("connect", () => console.log("✅ Redis clients initialized."));
