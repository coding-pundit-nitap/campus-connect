import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
  var redisSubscriber: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

const redis =
  global.redis || new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisSubscriber = global.redisSubscriber || redis.duplicate();

global.redis = redis;
global.redisSubscriber = redisSubscriber;

redis.setMaxListeners(0);
redisSubscriber.setMaxListeners(0);

redis.removeAllListeners("error");
redis.removeAllListeners("connect");
redis.removeAllListeners("close");
redis.removeAllListeners("ready");

redisSubscriber.removeAllListeners("error");
redisSubscriber.removeAllListeners("close");
redisSubscriber.removeAllListeners("ready");

redis.on("error", (error) => console.log("Redis Error:", error));
redisSubscriber.on("error", (error) =>
  console.log("Redis Subscriber Error: ", error)
);
redis.on("connect", () => console.log("✅ Redis clients initialized."));

export const redisSSE = redis;
export { redis as redisPublisher, redisSubscriber };
