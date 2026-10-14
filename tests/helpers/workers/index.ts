/**
 * Test doubles for the standalone worker build (workers/**).
 *
 * Worker sources compile with tsconfig.worker.json (NodeNext, no path
 * aliases), so worker tests import this file relatively
 * ("../../tests/helpers/workers/index.js") and it may only depend on vitest
 * and real packages, never on "@/..." or "@tests/...".
 */
import type { Logger } from "pino";
import { type Mock, vi } from "vitest";

export type FakeLogger = {
  [
    K in "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "child"
  ]: Mock;
};

/** pino-shaped logger whose methods are vi.fn(); `child()` returns itself. */
export function fakeLogger(): FakeLogger & Logger {
  const log = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  log.child.mockReturnValue(log);
  return log as unknown as FakeLogger & Logger;
}

/** vi.mock factory for workers/lib/logger.ts. */
export function loggerModule() {
  const loggers = {
    worker: fakeLogger(),
    notification: fakeLogger(),
    search: fakeLogger(),
    audit: fakeLogger(),
    db: fakeLogger(),
    batch: fakeLogger(),
  };
  return {
    loggers,
    createLogger: vi.fn(() => fakeLogger()),
    default: fakeLogger(),
  };
}

type Handler = (...args: never[]) => unknown;

/** Stand-in for bullmq's Worker: records its processor and event handlers. */
export class FakeWorker {
  static instances: FakeWorker[] = [];
  readonly handlers = new Map<string, Handler>();
  readonly close = vi.fn(async () => undefined);

  constructor(
    readonly name: string,
    readonly processor: (...args: unknown[]) => Promise<unknown>,
    readonly opts: unknown
  ) {
    FakeWorker.instances.push(this);
  }

  on(event: string, handler: Handler): this {
    this.handlers.set(event, handler);
    return this;
  }

  /** Invokes a registered event handler as BullMQ would. */
  emit(event: string, ...args: unknown[]): unknown {
    const handler = this.handlers.get(event) as
      ((...a: unknown[]) => unknown) | undefined;
    if (!handler) throw new Error(`No handler registered for "${event}"`);
    return handler(...args);
  }

  static byName(name: string): FakeWorker {
    const found = FakeWorker.instances.find((w) => w.name === name);
    if (!found) throw new Error(`No FakeWorker named "${name}"`);
    return found;
  }
}

/** Stand-in for bullmq's Queue. */
export class FakeQueue {
  static instances: FakeQueue[] = [];
  readonly add = vi.fn();
  readonly close = vi.fn(async () => undefined);
  readonly getJobSchedulers = vi.fn(async () => [] as { id?: string }[]);
  readonly removeJobScheduler = vi.fn(async () => true);
  readonly upsertJobScheduler = vi.fn();

  constructor(
    readonly name: string,
    readonly opts: unknown
  ) {
    FakeQueue.instances.push(this);
  }

  static byName(name: string): FakeQueue {
    const found = FakeQueue.instances.find((q) => q.name === name);
    if (!found) throw new Error(`No FakeQueue named "${name}"`);
    return found;
  }
}

/** vi.mock factory for "bullmq". */
export function bullmqModule() {
  FakeWorker.instances = [];
  FakeQueue.instances = [];
  return { Worker: FakeWorker, Queue: FakeQueue };
}
