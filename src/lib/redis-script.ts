import { redisPublisher } from "./redis";

const TRACK_CONNECTION_SCRIPT = `
  local key = KEYS[1]
  local connectionId = ARGV[1]
  local now = tonumber(ARGV[2])
  local staleThreshold = tonumber(ARGV[3])
  local maxConnections = tonumber(ARGV[4])
  local ttl = tonumber(ARGV[5])

  redis.call('ZADD', key, now, connectionId)
  redis.call('ZREMRANGEBYSCORE', key, 0, staleThreshold)

  local count = redis.call('ZCARD', key)

  if count > maxConnections then
    redis.call('ZREM', key, connectionId)
    return 0
  end

  redis.call('EXPIRE', key, ttl)
  return 1
`;

export async function trackConnectionAtomic(
  userId: string,
  connectionId: string,
  maxConnections: number,
  ttlSeconds: number
): Promise<boolean> {
  const key = `sse:connections:${userId}`;
  const now = Date.now();
  const staleThreshold = now - ttlSeconds * 1000;

  const result = await redisPublisher.eval(
    TRACK_CONNECTION_SCRIPT,
    1, // number of keys
    key, // KEYS[1]
    connectionId,
    String(now),
    String(staleThreshold),
    String(maxConnections),
    String(ttlSeconds)
  );

  return Number(result) === 1;
}
