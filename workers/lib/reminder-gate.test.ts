import { describe, expect, it, vi } from "vitest";

vi.mock("./redis.js", () => ({ redisPublisher: { set: vi.fn() } }));

import { redisPublisher } from "./redis.js";
import { createRedisReminderGate } from "./reminder-gate.js";

describe("createRedisReminderGate", () => {
  it("acquires with SET NX EX under a namespaced key", async () => {
    const redis = { set: vi.fn().mockResolvedValue("OK") };
    const gate = createRedisReminderGate(redis as never);

    await expect(gate.tryAcquire("stale-batch:b1", 1800)).resolves.toBe(true);
    expect(redis.set).toHaveBeenCalledWith(
      "reminder:stale-batch:b1",
      "1",
      "EX",
      1800,
      "NX"
    );
  });

  it("reports not-due when the key already exists", async () => {
    const redis = { set: vi.fn().mockResolvedValue(null) };
    const gate = createRedisReminderGate(redis as never);

    await expect(gate.tryAcquire("k", 60)).resolves.toBe(false);
  });

  it("uses the shared worker redis client by default", async () => {
    vi.mocked(redisPublisher.set).mockResolvedValueOnce("OK" as never);

    await expect(createRedisReminderGate().tryAcquire("k", 60)).resolves.toBe(
      true
    );
    expect(redisPublisher.set).toHaveBeenCalled();
  });
});
