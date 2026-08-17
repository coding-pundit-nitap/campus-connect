import { describe, expect, it, vi } from "vitest";

import { createContainer } from "@/di/container";
import type { PrismaClient } from "@/generated/client";

const {
  orderServiceConstructorSpy,
  batchServiceConstructorSpy,
  reviewServiceConstructorSpy,
} = vi.hoisted(() => ({
  orderServiceConstructorSpy: vi.fn(),
  batchServiceConstructorSpy: vi.fn(),
  reviewServiceConstructorSpy: vi.fn(),
}));

vi.mock("@/services/order/order.service", () => ({
  OrderService: vi.fn().mockImplementation((...args: unknown[]) => {
    orderServiceConstructorSpy(...args);
    return { __mockOrderService: true };
  }),
}));

vi.mock("@/services/batch/batch.service", () => ({
  BatchService: vi.fn().mockImplementation((...args: unknown[]) => {
    batchServiceConstructorSpy(...args);
    return { __mockBatchService: true };
  }),
}));

vi.mock("@/services/review/review.service", () => ({
  ReviewService: vi.fn().mockImplementation((...args: unknown[]) => {
    reviewServiceConstructorSpy(...args);
    return { __mockReviewService: true };
  }),
}));

// Mock BullMQ producers to prevent module-level `new Queue(...)` from opening
// a real Redis socket. NotificationService imports notificationQueue, and
// AuditService imports auditQueue — both construct a BullMQ Queue with a
// live Redis connection at import time. Without these mocks, every unit test
// that transitively imports @/di/container triggers ECONNREFUSED noise on
// stderr and retry latency when no Redis service is available.
vi.mock("@/lib/notification/notification-producer", () => ({
  NOTIFICATION_QUEUE_NAME: "notification-queue",
  notificationQueue: { add: vi.fn().mockResolvedValue({}) },
}));
vi.mock("@/lib/audit/audit-producer", () => ({
  AUDIT_QUEUE_NAME: "audit-log-queue",
  auditQueue: { add: vi.fn().mockResolvedValue({}) },
}));

function fakePrisma() {
  return { $transaction: vi.fn() } as unknown as PrismaClient;
}

describe("createContainer", () => {
  it("wires services against the supplied prisma client", () => {
    const container = createContainer({ prisma: fakePrisma() });
    expect(container.orderService).toBeDefined();
    expect(container.cartService).toBeDefined();
    expect(container.userRepository).toBeDefined();
    expect(container.db).toBeDefined();
  });

  it("returns independent graphs per call", () => {
    const a = createContainer({ prisma: fakePrisma() });
    const b = createContainer({ prisma: fakePrisma() });
    expect(a.orderService).not.toBe(b.orderService);
    expect(a.userRepository).not.toBe(b.userRepository);
  });

  it("constructs OrderService with the injected prisma client as its fourth argument", () => {
    orderServiceConstructorSpy.mockClear();
    const fake = fakePrisma();
    createContainer({ prisma: fake });

    expect(orderServiceConstructorSpy).toHaveBeenCalledTimes(1);
    const [, , , prismaArg] = orderServiceConstructorSpy.mock.calls[0];
    expect(prismaArg).toBe(fake);
  });

  it("constructs BatchService with the injected prisma client as its sixth argument", () => {
    batchServiceConstructorSpy.mockClear();
    const fake = fakePrisma();
    createContainer({ prisma: fake });

    expect(batchServiceConstructorSpy).toHaveBeenCalledTimes(1);
    const [, , , , , prismaArg] = batchServiceConstructorSpy.mock.calls[0];
    expect(prismaArg).toBe(fake);
  });

  it("constructs ReviewService with the injected prisma client as its fourth argument", () => {
    reviewServiceConstructorSpy.mockClear();
    const fake = fakePrisma();
    createContainer({ prisma: fake });

    expect(reviewServiceConstructorSpy).toHaveBeenCalledTimes(1);
    const [, , , prismaArg] = reviewServiceConstructorSpy.mock.calls[0];
    expect(prismaArg).toBe(fake);
  });
});
