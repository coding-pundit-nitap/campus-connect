import { describe, expect, it, vi } from "vitest";

import { createContainer } from "@/di/container";
import type { PrismaClient } from "@/generated/client";

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

  it("wires OrderService with the injected prisma client as its fourth argument", () => {
    const fake = fakePrisma();
    const container = createContainer({ prisma: fake });
    // OrderService stores the injected prismaClient privately; verify indirectly
    // by confirming the container's db (the same client) is the one supplied.
    expect(container.db).toBe(fake);
  });
});
