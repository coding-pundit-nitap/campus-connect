import { describe, expect, it, vi } from "vitest";

import { createContainer } from "@/di/container";
import type { PrismaClient } from "@/generated/client";

const { orderServiceConstructorSpy } = vi.hoisted(() => ({
  orderServiceConstructorSpy: vi.fn(),
}));

vi.mock("@/services/order/order.service", () => ({
  OrderService: vi.fn().mockImplementation((...args: unknown[]) => {
    orderServiceConstructorSpy(...args);
    return { __mockOrderService: true };
  }),
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
});
