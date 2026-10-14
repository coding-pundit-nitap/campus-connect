import { redisPublisher } from "./redis.js";

/** Decides whether a recurring reminder may fire now (rate limiting). */
export interface ReminderGate {
  /** Resolves true at most once per `ttlSeconds` for a given key. */
  tryAcquire(key: string, ttlSeconds: number): Promise<boolean>;
}

type SetNx = Pick<typeof redisPublisher, "set">;

export function createRedisReminderGate(
  redis: SetNx = redisPublisher
): ReminderGate {
  return {
    async tryAcquire(key, ttlSeconds) {
      const res = await redis.set(
        `reminder:${key}`,
        "1",
        "EX",
        ttlSeconds,
        "NX"
      );
      return res === "OK";
    },
  };
}
