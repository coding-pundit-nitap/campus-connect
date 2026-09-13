# Collective Batch Minimum Order Value Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shop-configurable collective minimum order value across all orders in a batch, branch cutoff handling to an owner-decided `PENDING_REVIEW` state when a batch falls short, and show live progress toward the threshold to users in the cart drawer, checkout, shop page, and order history.

**Architecture:** Two new scalar columns on `Batch` (`collective_total`, `min_order_value_snapshot`) plus one nullable column on `Shop` (`batch_min_order_value`) and a new `BatchStatus.PENDING_REVIEW` enum value. Every order-creation/cancellation code path that touches a batched order updates `collective_total` atomically through a single `BatchRepository.adjustCollectiveTotal` helper, which also returns the fresh totals so the caller can publish a `BATCH_PROGRESS_UPDATED` event over the **existing** Redis pub/sub used by the notification system (`redisPublisher` / `notificationEmitter`) — no new queue or worker needed. A new per-shop SSE route and `useBatchProgress` hook deliver live updates to the client; a new `GET /api/shops/[shopId]/batch-progress` route serves the initial value.

**Tech Stack:** Next.js 15 (App Router), Prisma 7, PostgreSQL, ioredis (existing `redisPublisher`/`redisSubscriber`/`notificationEmitter`), TanStack Query, react-hook-form + zod, Vitest (`test:unit` / `test:integration`).

**Spec:** `docs/superpowers/specs/2026-09-14-batch-collective-minimum-order-design.md`

## Global Constraints

- `Shop.batch_min_order_value` defaults to `null` (disabled) — no existing shop's behavior changes until an owner opts in.
- `Batch.min_order_value_snapshot` is set once at batch creation and never re-read from `Shop` afterward — an owner changing the shop's threshold must not affect an already-open batch.
- The existing per-user `min_order_value` check in `order.service.ts:409-415` is untouched — checkout gating for an individual user never depends on the collective total.
- All `collective_total` mutations go through `BatchRepository.adjustCollectiveTotal` (or the equivalent inline `tx.batch.update` inside `order.service.ts`'s own transaction) — never a bare `tx.batch.update({ data: { collective_total: ... } })` elsewhere, so every mutation site is auditable.
- Realtime progress publishing happens **after** the DB transaction that changed `collective_total` commits, wrapped in `try/catch`, non-blocking (same idiom as the existing `notificationService.publishNotification` calls in `order.service.ts:526-538`) — a failed Redis publish must never fail the request.
- Money fields are Prisma `Decimal(10,2)`; convert with `Number(...)` before comparing/arithmetic in TypeScript, exactly as the rest of the codebase already does (e.g. `order.service.ts:410`).

---

## Task 1: Schema migration — new columns and `PENDING_REVIEW` status

**Files:**
- Modify: `prisma/schema.prisma`
- Create: new migration folder under `prisma/migrations/` (auto-named by `prisma migrate dev`)

**Interfaces:**
- Produces: `Shop.batch_min_order_value: Decimal | null`, `Batch.collective_total: Decimal`, `Batch.min_order_value_snapshot: Decimal | null`, `BatchStatus.PENDING_REVIEW`.

- [ ] **Step 1: Add the new fields to `prisma/schema.prisma`**

In the `BatchStatus` enum (currently lines 91-97), add the new value:

```prisma
enum BatchStatus {
  OPEN
  LOCKED
  IN_TRANSIT
  COMPLETED
  CANCELLED
  PENDING_REVIEW
}
```

In `model Shop` (currently lines 227-264), add a sibling to `min_order_value` (line 246):

```prisma
  min_order_value      Decimal  @default(50.00) @db.Decimal(10, 2)
  batch_min_order_value Decimal? @db.Decimal(10, 2)
  default_delivery_fee Decimal @default(0) @db.Decimal(10, 2)
  direct_delivery_fee  Decimal @default(0) @db.Decimal(10, 2)
```

In `model Batch` (currently lines 586-609), add two fields after `status`:

```prisma
  cutoff_time DateTime
  status      BatchStatus @default(OPEN)

  collective_total        Decimal  @default(0) @db.Decimal(10, 2)
  min_order_value_snapshot Decimal? @db.Decimal(10, 2)
```

- [ ] **Step 2: Generate the migration**

Run: `pnpm db:migrate --name add_batch_collective_minimum`

Expected: a new folder under `prisma/migrations/` containing `migration.sql` with `ALTER TYPE "BatchStatus" ADD VALUE 'PENDING_REVIEW'`, `ALTER TABLE "Shop" ADD COLUMN "batch_min_order_value" DECIMAL(10,2)`, and `ALTER TABLE "Batch" ADD COLUMN "collective_total" DECIMAL(10,2) NOT NULL DEFAULT 0, ADD COLUMN "min_order_value_snapshot" DECIMAL(10,2)`. Prisma Client regenerates automatically.

- [ ] **Step 3: Backfill `collective_total` for any currently-OPEN batches**

Append to the generated `migration.sql` (before the `COMMIT`, if present, or as a follow-up statement in the same file) so existing in-flight batches don't start at a stale 0:

```sql
UPDATE "Batch" b
SET collective_total = COALESCE((
  SELECT SUM(o.item_total) FROM "Order" o
  WHERE o.batch_id = b.id
), 0)
WHERE b.status = 'OPEN';
```

- [ ] **Step 4: Apply and verify**

Run: `pnpm db:migrate` (applies pending migration to the dev DB), then `pnpm exec prisma studio` is not required — instead run `pnpm exec tsc --noEmit` to confirm the regenerated Prisma Client types compile against existing code.
Expected: no new TypeScript errors (the new fields are additive/optional, existing code doesn't reference them yet).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add collective batch minimum order value schema"
```

---

## Task 2: `BatchRepository.adjustCollectiveTotal` helper

**Files:**
- Modify: `src/repositories/batch.repository.ts`
- Test: `tests/integration/batch/adjust-collective-total.test.ts`

**Interfaces:**
- Produces: `BatchRepository.adjustCollectiveTotal(batchId: string, delta: number, tx?: Prisma.TransactionClient): Promise<{ id: string; shop_id: string; status: BatchStatus; collective_total: Decimal; min_order_value_snapshot: Decimal | null } | null>` — returns `null` if the batch doesn't exist (e.g. already deleted), otherwise the fresh row after the delta is applied.
- Consumes: nothing new (uses `this.prismaClient` already present on the class, per the constructor at line 20).

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/batch/adjust-collective-total.test.ts
import { describe, expect, it } from "vitest";

import { BatchRepository } from "../../../src/repositories/batch.repository";
import { createBatchSlot, createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("BatchRepository.adjustCollectiveTotal", () => {
  it("increments collective_total by the given delta", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 100,
      },
    });

    const repo = new BatchRepository(testPrisma);
    const updated = await repo.adjustCollectiveTotal(batch.id, 50);

    expect(updated).not.toBeNull();
    expect(Number(updated!.collective_total)).toBe(150);
  });

  it("decrements collective_total with a negative delta and never goes below zero", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 30,
      },
    });

    const repo = new BatchRepository(testPrisma);
    const updated = await repo.adjustCollectiveTotal(batch.id, -100);

    expect(Number(updated!.collective_total)).toBe(0);
  });

  it("returns null for a non-existent batch", async () => {
    const repo = new BatchRepository(testPrisma);
    const result = await repo.adjustCollectiveTotal("does-not-exist", 10);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- adjust-collective-total`
Expected: FAIL with `repo.adjustCollectiveTotal is not a function`.

- [ ] **Step 3: Implement `adjustCollectiveTotal`**

Add to `src/repositories/batch.repository.ts`, after the existing `updateStatus` method (currently lines 243-248):

```typescript
  async adjustCollectiveTotal(
    batchId: string,
    delta: number,
    tx?: Prisma.TransactionClient
  ): Promise<Batch | null> {
    const client = tx ?? this.prismaClient;
    const existing = await client.batch.findUnique({
      where: { id: batchId },
      select: { collective_total: true },
    });
    if (!existing) {
      return null;
    }
    const nextTotal = Math.max(
      0,
      Math.round((Number(existing.collective_total) + delta) * 100) / 100
    );
    return client.batch.update({
      where: { id: batchId },
      data: { collective_total: nextTotal },
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:integration -- adjust-collective-total`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/repositories/batch.repository.ts tests/integration/batch/adjust-collective-total.test.ts
git commit -m "feat: add BatchRepository.adjustCollectiveTotal helper"
```

---

## Task 3: Snapshot the threshold when a batch is created

**Files:**
- Modify: `src/services/batch/batch.service.ts:381-388` (`ensureNextOpenBatch`)
- Modify: `src/services/order/order.service.ts:172-183` (fresh-batch-create branch inside `findOrCreateBatchForRequestedTime`)
- Test: `tests/integration/batch/batch-min-snapshot.test.ts`

**Interfaces:**
- Consumes: `ShopRepository` (already injected into `BatchService` per its constructor, line 79) for reading `batch_min_order_value`; `order.service.ts` already has `shop.batch_min_order_value` available if selected in its existing `tx.shop.findFirst` select (line 277-287).

- [ ] **Step 1: Write the failing test for `ensureNextOpenBatch`**

```typescript
// tests/integration/batch/batch-min-snapshot.test.ts
import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createBatchSlot, createShop, futureSlotTime } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("batch_min_order_value snapshot on creation", () => {
  it("ensureNextOpenBatch copies the shop's batch_min_order_value onto the new batch", async () => {
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 500,
    });
    const { cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.ensureNextOpenBatch(shop.id);

    const batch = await testPrisma.batch.findFirst({ where: { shop_id: shop.id } });
    expect(batch).not.toBeNull();
    expect(Number(batch!.min_order_value_snapshot)).toBe(500);
    expect(Number(batch!.collective_total)).toBe(0);
  });

  it("ensureNextOpenBatch leaves the snapshot null when the shop has no batch_min_order_value", async () => {
    const shop = await createShop({ accepting_orders: true });
    const { cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.ensureNextOpenBatch(shop.id);

    const batch = await testPrisma.batch.findFirst({ where: { shop_id: shop.id } });
    expect(batch!.min_order_value_snapshot).toBeNull();
  });
});
```

(This assumes the `createShop` factory in `tests/factories` accepts arbitrary `Shop` field overrides — it already does for `accepting_orders`, per `batch-race.test.ts:85`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- batch-min-snapshot`
Expected: FAIL — `min_order_value_snapshot` is `null`/`0` regardless of the shop's configured value, since nothing sets it yet.

- [ ] **Step 3: Implement the snapshot in `ensureNextOpenBatch`**

In `src/services/batch/batch.service.ts`, `ensureNextOpenBatch` currently reads (lines 354-389):

```typescript
  async ensureNextOpenBatch(shopId: string): Promise<void> {
    const slots = await this.getActiveSlots(shopId);
    if (slots.length === 0) {
      return;
    }
    ...
    await this.batchRepository.create({
      data: {
        shop_id: shopId,
        cutoff_time: cutoffTime,
        status: "OPEN",
        slot_id: slot?.id,
      },
    });
  }
```

Change it to also fetch and snapshot the threshold:

```typescript
  async ensureNextOpenBatch(shopId: string): Promise<void> {
    const slots = await this.getActiveSlots(shopId);
    if (slots.length === 0) {
      return;
    }

    const cutoffTime = await this.computeNextCutoffFromSlots(
      shopId,
      new Date(),
      slots
    );
    const existing = await this.batchRepository.findOpenBatchByCutoff(
      shopId,
      cutoffTime,
      { select: { id: true } }
    );

    if (existing) {
      return;
    }

    const cutoffZoned = getZonedParts(cutoffTime, APP_TIME_ZONE);
    const minutesFromMidnight = cutoffZoned.hour * 60 + cutoffZoned.minute;
    const slot = slots.find(
      (item) => item.cutoff_time_minutes === minutesFromMidnight
    );

    const shop = await this.shopRepository.findById(shopId, {
      select: { batch_min_order_value: true },
    });

    await this.batchRepository.create({
      data: {
        shop_id: shopId,
        cutoff_time: cutoffTime,
        status: "OPEN",
        slot_id: slot?.id,
        collective_total: 0,
        min_order_value_snapshot: shop?.batch_min_order_value ?? null,
      },
    });
  }
```

- [ ] **Step 4: Implement the snapshot in `order.service.ts`'s fresh-batch-create branch**

In `src/services/order/order.service.ts`, the checkout transaction's `shop` select (lines 275-287) already runs inside the same `tx` as batch creation. Add `batch_min_order_value: true` to that select:

```typescript
        const shop = await tx.shop.findFirst({
          where: { id: shop_id, deleted_at: null },
          select: {
            id: true,
            name: true,
            is_active: true,
            accepting_orders: true,
            min_order_value: true,
            batch_min_order_value: true,
            default_delivery_fee: true,
            direct_delivery_fee: true,
            user: { select: { id: true } },
          },
        });
```

Then in `findOrCreateBatchForRequestedTime` (same file), the fresh-create branch (lines 172-183) currently reads:

```typescript
    await tx.$executeRawUnsafe(`SAVEPOINT batch_insert`);
    try {
      const created = await tx.batch.create({
        data: {
          shop_id,
          cutoff_time: cutoffTime,
          status: "OPEN",
          slot_id: matchingSlot.id,
        },
      });
```

Change it to accept and use the shop's threshold — update the method signature to take it as a parameter, and update its one call site:

```typescript
  private async findOrCreateBatchForRequestedTime(
    tx: Prisma.TransactionClient,
    shop_id: string,
    requested_delivery_time: Date,
    batchMinOrderValue: number | null
  ) {
    ...
    await tx.$executeRawUnsafe(`SAVEPOINT batch_insert`);
    try {
      const created = await tx.batch.create({
        data: {
          shop_id,
          cutoff_time: cutoffTime,
          status: "OPEN",
          slot_id: matchingSlot.id,
          collective_total: 0,
          min_order_value_snapshot: batchMinOrderValue,
        },
      });
```

Update the call site (around line 459 in `createOrderFromCart`):

```typescript
          const batch = await this.findOrCreateBatchForRequestedTime(
            tx,
            shop_id,
            requested_delivery_time,
            shop.batch_min_order_value !== null && shop.batch_min_order_value !== undefined
              ? Number(shop.batch_min_order_value)
              : null
          );
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:integration -- batch-min-snapshot`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the existing batch-race suite to confirm no regression**

Run: `pnpm test:integration -- batch-race`
Expected: PASS (both existing tests still pass — the new parameter defaults to `null` for shops without the feature enabled, matching the factory's default `Shop.batch_min_order_value` of `null`).

- [ ] **Step 7: Commit**

```bash
git add src/services/batch/batch.service.ts src/services/order/order.service.ts tests/integration/batch/batch-min-snapshot.test.ts
git commit -m "feat: snapshot batch_min_order_value onto batches at creation"
```

---

## Task 4: Increment `collective_total` when an order is placed against a batch

**Files:**
- Modify: `src/services/order/order.service.ts:470-500` (`createOrderFromCart`)
- Test: `tests/integration/batch/batch-collective-total-race.test.ts`

**Interfaces:**
- Produces: after this task, every order attached to a batch (`batchIdToLink` truthy) increases that batch's `collective_total` by `itemTotal`, atomically, inside the same transaction that creates the order.

- [ ] **Step 1: Write the failing concurrency test**

This extends the existing `batch-race.test.ts` pattern (same helpers, same shape) to assert on `collective_total` instead of just row counts:

```typescript
// tests/integration/batch/batch-collective-total-race.test.ts
import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createBatchSlot, createShop, futureSlotTime, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("Batch.collective_total under concurrent checkouts", () => {
  it("equals the sum of all successfully placed orders' item_total, with no lost updates", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const a = await seedCartForShop(shop);
    const b = await seedCartForShop(shop);

    const { orderService } = createContainer({ prisma: testPrisma });

    const results = await Promise.allSettled([
      orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at),
      orderService.createOrderFromCart(b.user.id, shop.id, "CASH", b.address.id, undefined, at),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const batches = await testPrisma.batch.findMany({ where: { shop_id: shop.id } });
    expect(batches).toHaveLength(1);

    const orders = await testPrisma.order.findMany({ where: { batch_id: batches[0].id } });
    const expectedTotal = orders.reduce((sum, o) => sum + Number(o.item_total), 0);

    expect(Number(batches[0].collective_total)).toBeCloseTo(expectedTotal, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- batch-collective-total-race`
Expected: FAIL — `collective_total` stays `0` because nothing increments it yet.

- [ ] **Step 3: Implement the increment**

In `src/services/order/order.service.ts`, `createOrderFromCart`, right after `const order = await tx.order.create({...})` (currently ending at line 500) and before the stock-decrement `Promise.all` block (line 502), add:

```typescript
        const order = await tx.order.create({
          data: {
            display_id,
            user_id: user_id,
            shop_id: shop_id,
            ...(batchIdToLink ? { batch_id: batchIdToLink } : {}),
            item_total: itemTotal,
            delivery_fee: deliveryFee,
            platform_fee: platformFee,
            total_price: totalPrice,
            payment_method,
            payment_status:
              payment_method === "ONLINE" ? "COMPLETED" : "PENDING",
            pg_payment_id,
            upi_transaction_id,
            delivery_address_snapshot,
            requested_delivery_time,
            customer_notes,
            is_direct_delivery: is_direct_delivery ?? false,
            items: {
              create: cart.items.map((item) => {
                const prod = productDetailsMap.get(item.product_id);
                return {
                  product_id: item.product_id,
                  quantity: item.quantity,
                  price: prod ? prod.price : item.product.price,
                };
              }),
            },
          },
        });

        let updatedBatch: { id: string; shop_id: string; status: string; collective_total: number; min_order_value_snapshot: number | null } | null = null;
        if (batchIdToLink) {
          const batchAfterIncrement = await tx.batch.update({
            where: { id: batchIdToLink },
            data: { collective_total: { increment: itemTotal } },
            select: {
              id: true,
              shop_id: true,
              status: true,
              collective_total: true,
              min_order_value_snapshot: true,
            },
          });
          updatedBatch = {
            id: batchAfterIncrement.id,
            shop_id: batchAfterIncrement.shop_id,
            status: batchAfterIncrement.status,
            collective_total: Number(batchAfterIncrement.collective_total),
            min_order_value_snapshot:
              batchAfterIncrement.min_order_value_snapshot !== null
                ? Number(batchAfterIncrement.min_order_value_snapshot)
                : null,
          };
        }
```

Update the transaction's return statement (currently `return { order, shopOwnerId: shop.user?.id };` at line 522) to also return `updatedBatch`:

```typescript
        return { order, shopOwnerId: shop.user?.id, updatedBatch };
      }
    );
```

And update the destructuring of the `$transaction` result (currently `const { order, shopOwnerId } = await this.prismaClient.$transaction(...)` at line 265) to include it:

```typescript
    const { order, shopOwnerId, updatedBatch } = await this.prismaClient.$transaction(
```

This `updatedBatch` is consumed by Task 15's realtime publish, added there instead of here to keep this task's diff focused on the increment itself. For now it's an unused variable after the transaction — that's fine, Task 15 wires its usage.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:integration -- batch-collective-total-race`
Expected: PASS.

- [ ] **Step 5: Run the full batch integration suite to confirm no regression**

Run: `pnpm test:integration -- batch`
Expected: all existing batch tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/order/order.service.ts tests/integration/batch/batch-collective-total-race.test.ts
git commit -m "feat: increment Batch.collective_total atomically on order placement"
```

---

## Task 5: Decrement `collective_total` when a user cancels their own order

**Files:**
- Modify: `src/actions/orders/order-actions.ts` (`cancelOrderAction`, lines 311-366)
- Test: `tests/integration/orders/cancel-order-collective-total.test.ts`

**Interfaces:**
- Consumes: `BatchRepository.adjustCollectiveTotal` from Task 2.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/orders/cancel-order-collective-total.test.ts
import { describe, expect, it } from "vitest";

import { cancelOrderAction } from "../../../src/actions/orders/order-actions";
import { createBatchSlot, createShop, futureSlotTime, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";
import { asUser } from "../../setup/auth-test-helpers";

describe("cancelOrderAction decrements Batch.collective_total", () => {
  it("decrements the batch total by the cancelled order's item_total", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    const batchBefore = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchBefore!.collective_total)).toBeCloseTo(Number(order.item_total), 2);

    await asUser(a.user.id, () => cancelOrderAction(order.id));

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
```

(If `tests/setup/auth-test-helpers.ts` doesn't already export an `asUser` helper for running a server action as a given user, check `tests/integration/orders/*.test.ts` for however existing order-action integration tests establish the acting user — reuse that exact pattern instead of inventing `asUser`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- cancel-order-collective-total`
Expected: FAIL — `batchAfter.collective_total` still equals the order's `item_total` since nothing decrements it.

- [ ] **Step 3: Implement the decrement**

In `src/actions/orders/order-actions.ts`, `cancelOrderAction` (lines 311-366) currently ends with:

```typescript
    if (order.order_status !== "NEW") {
      throw new ValidationError(
        "Only orders with status NEW can be cancelled."
      );
    }

    if (order.payment_status === "COMPLETED") {
      throw new ValidationError(
        "Cannot cancel an order with completed payment. Please contact support."
      );
    }

    await orderRepository.updateStatus(order_id, OrderStatus.CANCELLED);
```

Change the final line to wrap the status update and the batch decrement in one transaction, and capture the result for realtime publishing (wired in Task 15):

```typescript
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      await orderRepository.updateStatus(order_id, OrderStatus.CANCELLED, tx);
      if (order.batch_id) {
        return batchRepository.adjustCollectiveTotal(
          order.batch_id,
          -Number(order.item_total),
          tx
        );
      }
      return null;
    });
```

Check the existing `orderRepository.updateStatus` signature (used elsewhere in this same file, e.g. `src/actions/orders/order-actions.ts:353`) — if it does not currently accept an optional `tx: Prisma.TransactionClient` parameter, extend it in `src/repositories/order.repository.ts` the same way `BatchRepository.adjustCollectiveTotal` accepts one (Task 2's pattern: `tx ?? this.prismaClient`), so the status update and the collective-total decrement commit atomically. Import `batchRepository` from `@/di/container` at the top of `order-actions.ts` (check the existing import block for the `@/di/container` import — add `batchRepository` to the existing destructured import if `orderRepository` is already imported from there).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:integration -- cancel-order-collective-total`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/actions/orders/order-actions.ts src/repositories/order.repository.ts tests/integration/orders/cancel-order-collective-total.test.ts
git commit -m "fix: decrement Batch.collective_total when a user cancels their order"
```

---

## Task 6: Decrement `collective_total` when a vendor rejects an order

**Files:**
- Modify: `src/actions/shop/order-management-actions.ts` (`rejectOrderAction`, lines 212-266)
- Test: `tests/integration/orders/reject-order-collective-total.test.ts`

**Interfaces:**
- Consumes: `BatchRepository.adjustCollectiveTotal` from Task 2.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/orders/reject-order-collective-total.test.ts
import { describe, expect, it } from "vitest";

import { rejectOrderAction } from "../../../src/actions/shop/order-management-actions";
import { createBatchSlot, createShop, futureSlotTime, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("rejectOrderAction decrements Batch.collective_total", () => {
  it("decrements the batch total by the rejected order's item_total", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    await rejectOrderAction(order.id, "Out of stock");

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
```

(Match whatever shop-owner-session setup the existing tests for `src/actions/shop/order-management-actions.ts` already use — check for an existing test file covering `rejectOrderAction`/`acceptOrderAction` and copy its session/auth mocking approach verbatim rather than reinventing one.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- reject-order-collective-total`
Expected: FAIL.

- [ ] **Step 3: Implement the decrement**

In `src/actions/shop/order-management-actions.ts`, `rejectOrderAction` currently ends with (lines 240-250):

```typescript
    const paymentStatus =
      order.payment_method === "ONLINE" ? "REFUNDED" : "CANCELLED";

    await orderRepository.update(orderId, {
      order_status: "CANCELLED",
      payment_status: paymentStatus,
      cancellation_reason: reason || null,
      customer_notes: order.customer_notes
        ? `${order.customer_notes}\n${rejectionNote}`
        : rejectionNote,
    });
```

Wrap in a transaction that also decrements the batch total when the order belongs to one:

```typescript
    const paymentStatus =
      order.payment_method === "ONLINE" ? "REFUNDED" : "CANCELLED";

    await prisma.$transaction(async (tx) => {
      await orderRepository.update(
        orderId,
        {
          order_status: "CANCELLED",
          payment_status: paymentStatus,
          cancellation_reason: reason || null,
          customer_notes: order.customer_notes
            ? `${order.customer_notes}\n${rejectionNote}`
            : rejectionNote,
        },
        tx
      );
      if (order.batch_id) {
        await batchRepository.adjustCollectiveTotal(
          order.batch_id,
          -Number(order.item_total),
          tx
        );
      }
    });
```

Check `orderRepository.update`'s current signature — if it doesn't accept a `tx` parameter, extend it the same way as Task 5's `updateStatus` change. Import `batchRepository` and `prisma` alongside the existing imports at the top of `order-management-actions.ts` if not already present.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:integration -- reject-order-collective-total`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/actions/shop/order-management-actions.ts tests/integration/orders/reject-order-collective-total.test.ts
git commit -m "fix: decrement Batch.collective_total when a vendor rejects an order"
```

---

## Task 7: Decrement `collective_total` on owner-driven status overrides to CANCELLED

**Files:**
- Modify: `src/actions/orders/order-actions.ts` (`updateOrderStatusAction`, lines 169-222, and `bulkUpdateOrderStatusAction`, lines ~415-520)
- Test: `tests/integration/orders/status-override-collective-total.test.ts`

**Interfaces:**
- Consumes: `BatchRepository.adjustCollectiveTotal` from Task 2.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/orders/status-override-collective-total.test.ts
import { describe, expect, it } from "vitest";

import { updateOrderStatusAction } from "../../../src/actions/orders/order-actions";
import { createBatchSlot, createShop, futureSlotTime, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("updateOrderStatusAction decrements Batch.collective_total on CANCELLED", () => {
  it("decrements the batch total when an owner manually cancels a batched order", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    await updateOrderStatusAction(order.id, "CANCELLED");

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });

  it("does not decrement twice if the order is already CANCELLED", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    await updateOrderStatusAction(order.id, "CANCELLED");
    await expect(updateOrderStatusAction(order.id, "CANCELLED")).rejects.toThrow();

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- status-override-collective-total`
Expected: FAIL on the first test (total stays at the order's `item_total`).

- [ ] **Step 3: Implement the decrement in `updateOrderStatusAction`**

Currently (lines 169-222):

```typescript
export async function updateOrderStatusAction(
  order_id: string,
  status: OrderStatus
) {
  ...
  const paymentStatus = ...;

  const updatedOrder = await prisma.order.update({
    where: { id: order_id },
    data: {
      order_status: status,
      payment_status: paymentStatus,
      actual_delivery_time: status === "COMPLETED" ? new Date() : undefined,
    },
  });
```

Change the write into a transaction, guarding against double-decrement by checking the order's *current* status before the update (this function already fetches `order` earlier in the body per the existing code — reuse that fetch's `order_status`/`batch_id`/`item_total`):

```typescript
  const wasAlreadyCancelled = order.order_status === "CANCELLED";

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: order_id },
      data: {
        order_status: status,
        payment_status: paymentStatus,
        actual_delivery_time: status === "COMPLETED" ? new Date() : undefined,
      },
    });
    if (status === "CANCELLED" && !wasAlreadyCancelled && order.batch_id) {
      await batchRepository.adjustCollectiveTotal(
        order.batch_id,
        -Number(order.item_total),
        tx
      );
    }
    return result;
  });
```

If the existing function already throws when `order.order_status === "CANCELLED"` (check the guard clauses above line 204 in the current implementation) then the "does not decrement twice" test is exercising that existing guard rather than new logic — keep whichever guard already exists and only add the decrement inside the transaction as shown.

- [ ] **Step 4: Implement the same guard in `bulkUpdateOrderStatusAction`**

Currently (relevant excerpt, lines ~471-498):

```typescript
    const ordersToUpdate = orders.filter((o) => o.order_status !== status);

    if (ordersToUpdate.length > 0) {
      await prisma.$transaction(
        ordersToUpdate.map((o) => {
          const paymentStatus = ...;
          return prisma.order.update({
            where: { id: o.id },
            data: {
              order_status: status,
              payment_status: paymentStatus,
              actual_delivery_time:
                status === "COMPLETED" ? new Date() : undefined,
            },
          });
        })
      );
    }
```

Note this already filters `o.order_status !== status` (line 471), so double-cancellation within one bulk call is impossible by construction. Extend the transaction array to include batch decrements for orders transitioning to `CANCELLED`:

```typescript
    const ordersToUpdate = orders.filter((o) => o.order_status !== status);

    if (ordersToUpdate.length > 0) {
      await prisma.$transaction([
        ...ordersToUpdate.map((o) => {
          const paymentStatus =
            status === "COMPLETED"
              ? o.payment_method === "CASH"
                ? "COMPLETED"
                : undefined
              : status === "CANCELLED"
                ? o.payment_method === "ONLINE"
                  ? "REFUNDED"
                  : "CANCELLED"
                : undefined;

          return prisma.order.update({
            where: { id: o.id },
            data: {
              order_status: status,
              payment_status: paymentStatus,
              actual_delivery_time:
                status === "COMPLETED" ? new Date() : undefined,
            },
          });
        }),
        ...(status === "CANCELLED"
          ? ordersToUpdate
              .filter((o) => o.batch_id)
              .map((o) =>
                prisma.batch.update({
                  where: { id: o.batch_id! },
                  data: { collective_total: { decrement: Number(o.item_total) } },
                })
              )
          : []),
      ]);
    }
```

Note: this uses a direct `prisma.batch.update({ data: { collective_total: { decrement: ... } } })` rather than `batchRepository.adjustCollectiveTotal`, because Prisma's `$transaction([...])` array form requires plain `PrismaPromise` operations, not an async function — `adjustCollectiveTotal`'s read-then-clamp-then-write body can't be expressed as a single `PrismaPromise`. This is a deliberate, narrow exception to the Global Constraints rule; it's safe because `decrement` is itself an atomic DB-level operation (no read-modify-write race), it just doesn't clamp at zero the way `adjustCollectiveTotal` does — acceptable here since bulk-cancelling more item value than a batch's recorded total is already an existing-data-inconsistency scenario, not one this feature introduces.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:integration -- status-override-collective-total`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/actions/orders/order-actions.ts tests/integration/orders/status-override-collective-total.test.ts
git commit -m "fix: decrement Batch.collective_total on owner-driven order cancellation"
```

---

## Task 8: Branch cutoff handling to `PENDING_REVIEW` when a batch is short

**Files:**
- Modify: `src/services/batch/batch.service.ts:812-963` (`autoCloseExpiredBatches`)
- Test: `tests/integration/batch/pending-review-cutoff.test.ts`

**Interfaces:**
- Produces: an expired `OPEN` batch whose `collective_total < min_order_value_snapshot` transitions to `PENDING_REVIEW` (orders stay `NEW`, no OTP generated) instead of `LOCKED`, and the shop owner receives a notification with the shortfall. A batch with `min_order_value_snapshot === null`, or `collective_total >= min_order_value_snapshot`, locks exactly as today.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/integration/batch/pending-review-cutoff.test.ts
import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createBatchSlot, createShop, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("autoCloseExpiredBatches with a collective minimum", () => {
  it("transitions an under-threshold expired batch to PENDING_REVIEW instead of LOCKED", async () => {
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 10000 });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 10000,
      },
    });
    const a = await seedCartForShop(shop);
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST01",
        user_id: a.user.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("PENDING_REVIEW");

    const order = await testPrisma.order.findFirst({ where: { batch_id: batch.id } });
    expect(order!.order_status).toBe("NEW");
  });

  it("locks an at-or-above-threshold expired batch exactly as before", async () => {
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 50 });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 50,
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST02",
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("LOCKED");

    const order = await testPrisma.order.findFirst({ where: { batch_id: batch.id } });
    expect(order!.order_status).toBe("BATCHED");
  });

  it("locks an expired batch unconditionally when no collective minimum is configured", async () => {
    const shop = await createShop({ accepting_orders: true });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 0,
        min_order_value_snapshot: null,
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("LOCKED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- pending-review-cutoff`
Expected: FAIL on the first test — the batch locks unconditionally today regardless of `collective_total`.

- [ ] **Step 3: Rewrite `autoCloseExpiredBatches`**

In `src/services/batch/batch.service.ts`, replace the body from line 812 to line 913 (the batch-locking half of the function; the stale-batch "Orders Waiting!" half at lines 915-963 is untouched) with:

```typescript
  async autoCloseExpiredBatches(): Promise<void> {
    const now = new Date();

    const expiredBatches = await this.prismaClient.batch.findMany({
      where: {
        status: "OPEN",
        cutoff_time: { lt: now },
      },
      select: {
        id: true,
        shop_id: true,
        shop: {
          select: {
            name: true,
            user: { select: { id: true } },
          },
        },
        orders: {
          where: { order_status: "NEW" },
          select: { id: true },
        },
      },
    });

    if (expiredBatches.length > 0) {
      log.info(`🔒 Found ${expiredBatches.length} expired batches. Locking...`);

      const batchIds = expiredBatches.map((b) => b.id).sort();

      const { lockedBatchIds, pendingReviewBatchIds, countMap, shortfallMap } =
        await this.prismaClient.$transaction(async (tx) => {
          const locked: {
            id: string;
            status: string;
            collective_total: string;
            min_order_value_snapshot: string | null;
          }[] = await tx.$queryRaw`
            SELECT id, status, collective_total, min_order_value_snapshot FROM "Batch"
            WHERE id IN (${Prisma.join(batchIds)}) AND status = 'OPEN'
            ORDER BY id
            FOR UPDATE
          `;

          const lockedBatchIds: string[] = [];
          const pendingReviewBatchIds: string[] = [];
          const shortfallMap = new Map<string, number>();

          for (const row of locked) {
            const minRequired =
              row.min_order_value_snapshot !== null
                ? Number(row.min_order_value_snapshot)
                : null;
            const collectiveTotal = Number(row.collective_total);
            if (minRequired !== null && collectiveTotal < minRequired) {
              pendingReviewBatchIds.push(row.id);
              shortfallMap.set(row.id, minRequired - collectiveTotal);
            } else {
              lockedBatchIds.push(row.id);
            }
          }

          if (pendingReviewBatchIds.length > 0) {
            await tx.batch.updateMany({
              where: { id: { in: pendingReviewBatchIds } },
              data: { status: "PENDING_REVIEW" },
            });
          }

          if (lockedBatchIds.length === 0) {
            return {
              lockedBatchIds: [],
              pendingReviewBatchIds,
              countMap: new Map<string, number>(),
              shortfallMap,
            };
          }

          await tx.batch.updateMany({
            where: { id: { in: lockedBatchIds } },
            data: { status: "LOCKED" },
          });

          await tx.$executeRaw`
            UPDATE "Order"
            SET order_status = 'BATCHED',
                delivery_otp = FLOOR(RANDOM() * 9000 + 1000)::text,
                updated_at = NOW()
            WHERE batch_id = ANY(${lockedBatchIds}::text[]) AND order_status = 'NEW'
          `;

          const orderCounts = await tx.order.groupBy({
            by: ["batch_id"],
            where: {
              batch_id: { in: lockedBatchIds },
              order_status: "BATCHED",
            },
            _count: { id: true },
          });
          const countMap = new Map(
            orderCounts.map((c) => [c.batch_id ?? "", c._count.id])
          );

          return { lockedBatchIds, pendingReviewBatchIds, countMap, shortfallMap };
        });

      if (lockedBatchIds.length > 0) {
        log.info(`✅ Successfully LOCKED ${lockedBatchIds.length} batches.`);

        const processedBatches = expiredBatches.filter((b) =>
          lockedBatchIds.includes(b.id)
        );

        for (const batch of processedBatches) {
          const activeOrderCount = countMap.get(batch.id) ?? 0;
          if (batch.shop.user && activeOrderCount > 0) {
            try {
              await this.notificationService.publishNotification(
                batch.shop.user.id,
                {
                  title: "🚀 Batch Ready!",
                  message: `Batch for ${batch.shop.name} is ready with ${activeOrderCount} orders. Start preparing!`,
                  type: "SUCCESS",
                  category: "ORDER",
                  action_url: `/owner-shops/dashboard`,
                }
              );
            } catch (notifError) {
              log.error(
                { err: notifError, batchId: batch.id },
                "Failed to publish batch notification"
              );
            }
          }
        }
      }

      if (pendingReviewBatchIds.length > 0) {
        log.info(
          `⏸️ ${pendingReviewBatchIds.length} batches fell short of their collective minimum. Awaiting owner decision.`
        );

        const processedBatches = expiredBatches.filter((b) =>
          pendingReviewBatchIds.includes(b.id)
        );

        for (const batch of processedBatches) {
          const shortfall = shortfallMap.get(batch.id) ?? 0;
          if (batch.shop.user) {
            try {
              await this.notificationService.publishNotification(
                batch.shop.user.id,
                {
                  title: "⚠️ Batch Below Minimum",
                  message: `Batch for ${batch.shop.name} is ₹${shortfall.toFixed(0)} short of its collective minimum. Decide whether to proceed or cancel.`,
                  type: "WARNING",
                  category: "ORDER",
                  action_url: `/owner-shops/dashboard`,
                }
              );
            } catch (notifError) {
              log.error(
                { err: notifError, batchId: batch.id },
                "Failed to publish pending-review notification"
              );
            }
          }
        }
      }
    }

    const IDLE_THRESHOLD_MINUTES = 30;
    const idleThreshold = new Date();
    idleThreshold.setMinutes(
      idleThreshold.getMinutes() - IDLE_THRESHOLD_MINUTES
    );

    const staleBatches = await this.prismaClient.batch.findMany({
      where: {
        status: "LOCKED",
        cutoff_time: { lt: idleThreshold },
        orders: { some: { order_status: "BATCHED" } },
      },
      select: {
        id: true,
        cutoff_time: true,
        shop: { select: { name: true, user: { select: { id: true } } } },
        orders: {
          where: { order_status: "BATCHED" },
          select: { id: true },
        },
      },
    });

    for (const batch of staleBatches) {
      if (batch.shop.user && batch.orders.length > 0) {
        const minutesLate = Math.round(
          (Date.now() - batch.cutoff_time.getTime()) / 60000
        );

        try {
          await this.notificationService.publishNotification(
            batch.shop.user.id,
            {
              title: "⚠️ Orders Waiting!",
              message: `You have ${batch.orders.length} orders waiting for ${minutesLate} mins! Start delivery NOW or they will be cancelled.`,
              type: "WARNING",
              category: "ORDER",
              action_url: `/owner-shops/dashboard`,
            }
          );
        } catch (notifError) {
          log.error(
            { err: notifError, batchId: batch.id },
            "Failed to publish stale notification"
          );
        }
      }
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:integration -- pending-review-cutoff`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full batch suite to confirm no regression**

Run: `pnpm test:integration -- batch`
Expected: PASS across all existing batch tests (shops with no `batch_min_order_value` behave identically to before).

- [ ] **Step 6: Commit**

```bash
git add src/services/batch/batch.service.ts tests/integration/batch/pending-review-cutoff.test.ts
git commit -m "feat: hold under-threshold batches as PENDING_REVIEW at cutoff"
```

---

## Task 9: `forceLockBatch` and extend `cancelBatch` for `PENDING_REVIEW`

**Files:**
- Modify: `src/services/batch/batch.service.ts` (new `forceLockBatch` method; extend `cancelBatch` guard at lines 745-747)
- Test: `tests/integration/batch/force-lock-and-cancel-pending-review.test.ts`

**Interfaces:**
- Produces: `BatchService.forceLockBatch(batchId: string, shopId: string): Promise<void>` — transitions a `PENDING_REVIEW` batch to `LOCKED` (same downstream effects as `lockBatch`: `BatchDeliveryStatus` upsert, orders → `BATCHED`, OTP generation).
- Consumes: `this.batchRepository`, `this.orderRepository`, `this.prismaClient`, `this.generateOtpForBatch` — all already present on `BatchService` (constructor at batch.service.ts:75-82).

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/integration/batch/force-lock-and-cancel-pending-review.test.ts
import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("resolving a PENDING_REVIEW batch", () => {
  it("forceLockBatch transitions PENDING_REVIEW to LOCKED and batches its NEW orders", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() - 60_000),
        status: "PENDING_REVIEW",
        collective_total: 50,
        min_order_value_snapshot: 1000,
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST03",
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 50,
        total_price: 50,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.forceLockBatch(batch.id, shop.id);

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("LOCKED");
    const order = await testPrisma.order.findFirst({ where: { batch_id: batch.id } });
    expect(order!.order_status).toBe("BATCHED");
    expect(order!.delivery_otp).not.toBeNull();
  });

  it("forceLockBatch rejects a batch that isn't PENDING_REVIEW", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: { shop_id: shop.id, cutoff_time: new Date(), status: "OPEN" },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await expect(batchService.forceLockBatch(batch.id, shop.id)).rejects.toThrow(
      "Only PENDING_REVIEW batches can be force-locked"
    );
  });

  it("cancelBatch accepts PENDING_REVIEW as a valid source status", async () => {
    const shop = await createShop({ accepting_orders: true });
    const batch = await testPrisma.batch.create({
      data: { shop_id: shop.id, cutoff_time: new Date(), status: "PENDING_REVIEW" },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    const result = await batchService.cancelBatch(batch.id, "Owner declined");

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("CANCELLED");
    expect(result.cancelled_orders).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:integration -- force-lock-and-cancel-pending-review`
Expected: FAIL — `batchService.forceLockBatch is not a function`; third test fails with `"Can only cancel LOCKED or IN_TRANSIT batches"`.

- [ ] **Step 3: Implement `forceLockBatch`**

Add to `src/services/batch/batch.service.ts`, immediately after the existing `lockBatch` method (currently ends at line 243):

```typescript
  async forceLockBatch(batchId: string, shopId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId, {
      select: { id: true, shop_id: true, status: true },
    });

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    if (batch.shop_id !== shopId) {
      throw new Error("Unauthorized: Batch does not belong to your shop");
    }

    if (batch.status !== "PENDING_REVIEW") {
      throw new Error("Only PENDING_REVIEW batches can be force-locked");
    }

    await this.batchRepository.updateStatus(batchId, "LOCKED");

    await this.prismaClient.batchDeliveryStatus.upsert({
      where: { batch_id: batchId },
      update: { current_milestone: BatchMilestone.PACKING },
      create: { batch_id: batchId, current_milestone: BatchMilestone.PACKING },
    });

    const orders = await this.orderRepository.findMany({
      where: { batch_id: batchId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      await this.orderRepository.batchUpdateStatus(orderIds, "BATCHED");
    }

    await this.generateOtpForBatch(batchId);
  }
```

- [ ] **Step 4: Extend `cancelBatch`'s guard**

In `src/services/batch/batch.service.ts`, `cancelBatch` currently has (lines 745-747):

```typescript
    if (batch.status !== "LOCKED" && batch.status !== "IN_TRANSIT") {
      throw new Error("Can only cancel LOCKED or IN_TRANSIT batches");
    }
```

Change to:

```typescript
    if (
      batch.status !== "LOCKED" &&
      batch.status !== "IN_TRANSIT" &&
      batch.status !== "PENDING_REVIEW"
    ) {
      throw new Error(
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches"
      );
    }
```

Also fix the matching duplicate guard in `src/actions/shop/batch-actions.ts:136-138` (the shop-side `cancelBatchAction`, currently unused by the wired UI but a latent inconsistency worth closing while touching this code):

```typescript
    if (
      batch.status !== "LOCKED" &&
      batch.status !== "IN_TRANSIT" &&
      batch.status !== "PENDING_REVIEW"
    ) {
      throw new BadRequestError(
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches"
      );
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:integration -- force-lock-and-cancel-pending-review`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/batch/batch.service.ts src/actions/shop/batch-actions.ts tests/integration/batch/force-lock-and-cancel-pending-review.test.ts
git commit -m "feat: allow force-locking or cancelling a PENDING_REVIEW batch"
```

---

## Task 10: `forceLockBatchAction` and the `useForceLockBatch` mutation

**Files:**
- Modify: `src/actions/shop/batch-actions.ts` (add `forceLockBatchAction`, alongside `closeBatchAction` at line 69)
- Modify: `src/actions/index.ts` or wherever `@/actions` re-exports shop batch actions (check how `closeBatchAction`/`updateBatchCutoffTimeAction` are currently exported and follow the same path)
- Modify: `src/hooks/queries/useBatch.ts` (add `useForceLockBatch`)

**Interfaces:**
- Produces: `forceLockBatchAction(batchId: string): Promise<ActionResponse<void>>` (server action, shop-owner scoped like `closeBatchAction`); `useForceLockBatch(): UseMutationResult` hook that invalidates `queryKeys.batch.orderConsole()` on success (mirroring `useCloseBatch`'s existing invalidation — check `useCloseBatch`'s `onSuccess` in the same file and copy its `invalidateQueries` calls exactly).

- [ ] **Step 1: Add `forceLockBatchAction`**

In `src/actions/shop/batch-actions.ts`, add a new export near `closeBatchAction` (line 69), following that function's existing auth/ownership-check structure (fetch the shop for the authenticated owner, verify the batch belongs to it, call the service):

```typescript
export async function forceLockBatchAction(batchId: string) {
  try {
    const user_id = await authUtils.getUserId();
    const shop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!shop) {
      throw new UnauthorizedError("User does not own a shop");
    }

    await batchService.forceLockBatch(batchId, shop.id);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      details: error instanceof Error ? error.message : "Failed to force-lock batch",
    };
  }
}
```

Match this exactly to whatever error-handling/return shape `closeBatchAction` already uses in this file (the sketch above assumes a `{ success, details? }` shape based on `useUpdateShop`'s handling of `updateShopAction`'s result — confirm against `closeBatchAction`'s actual return statement and mirror it precisely, including whether it throws vs. returns an error object, and which custom error classes it imports).

- [ ] **Step 2: Export it alongside the other shop batch actions**

Check how `closeBatchAction` is currently imported into `src/hooks/queries/useBatch.ts` (line 15-18: `import { closeBatchAction, updateBatchCutoffTimeAction } from "@/actions/shop/batch-actions";`) — add `forceLockBatchAction` to that same import statement; no barrel-file change needed since this import path already goes directly to the module, not through `@/actions`.

- [ ] **Step 3: Add `useForceLockBatch`**

In `src/hooks/queries/useBatch.ts`, add a new hook near `useCloseBatch` (find its definition in this file and place this immediately after it, matching its structure):

```typescript
export function useForceLockBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceLockBatchAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.orderConsole() });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to force-lock batch.");
    },
  });
}
```

Match the exact `onSuccess`/`onError` shape `useCloseBatch` already uses in this file (in particular, confirm whether it invalidates `queryKeys.batch.orderConsole()` only, or also `queryKeys.batch.active()`/others — mirror it exactly since `PENDING_REVIEW`→`LOCKED` should invalidate the same queries a normal lock does).

- [ ] **Step 4: Manual verification**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors — `forceLockBatchAction`'s return type matches what `useMutation`/`useForceLockBatch`'s callers expect (checked against `closeBatchAction`'s type in Step 1).

- [ ] **Step 5: Commit**

```bash
git add src/actions/shop/batch-actions.ts src/hooks/queries/useBatch.ts
git commit -m "feat: add forceLockBatchAction and useForceLockBatch hook"
```

---

## Task 11: Surface `PENDING_REVIEW` in the vendor dashboard UI

**Files:**
- Modify: `src/services/vendor/vendor-api.service.ts` (`SerializedBatch` interface, lines 11-29)
- Modify: `src/app/api/vendor/orders/console/route.ts` (no code change needed — `activeBatch` already comes straight from `batchRepository.findOpenBatchByShopId`/`findActiveBatches`, which will include the new columns automatically once selected; verify the repository calls at lines 30-37 use `include`, not a narrowing `select`, so the new scalar columns pass through by default)
- Modify: `src/components/owned-shop/vendor-command-center/batch-control-bar.tsx`
- Modify: `src/components/owned-shop/vendor-command-center/index.tsx`

**Interfaces:**
- Produces: a `PENDING_REVIEW` batch shown in `BatchControlBar` with its shortfall amount and two buttons — "Proceed Anyway" (calls `useForceLockBatch`) and a `Cancel Run` button now also enabled for this status.
- Consumes: `useForceLockBatch` from Task 10.

- [ ] **Step 1: Extend `SerializedBatch`**

In `src/services/vendor/vendor-api.service.ts`, `SerializedBatch` currently (lines 11-29):

```typescript
export interface SerializedBatch {
  id: string;
  shop_id: string;
  slot_id: string | null;
  cutoff_time: string;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  delivery_status?: { ... } | null;
}
```

Add the two new fields:

```typescript
export interface SerializedBatch {
  id: string;
  shop_id: string;
  slot_id: string | null;
  cutoff_time: string;
  status: BatchStatus;
  collective_total: string;
  min_order_value_snapshot: string | null;
  created_at: string;
  updated_at: string;
  delivery_status?: {
    id: string;
    batch_id: string;
    current_milestone: BatchMilestone;
    estimated_arrival: string | null;
    rider_name: string | null;
    rider_phone: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}
```

(No serialization code needs to change: `route.ts` passes the raw Prisma `Batch` row straight through `jsonResponse`, and Prisma `Decimal` already implements `toJSON()` returning a numeric string, so `collective_total`/`min_order_value_snapshot` arrive as JSON strings automatically — matching this type.)

- [ ] **Step 2: Verify the repository calls select these columns**

Open `src/app/api/vendor/orders/console/route.ts` and confirm lines 31-36:

```typescript
      batchRepository.findOpenBatchByShopId(shop.id, {
        include: { delivery_status: true },
      }),
      batchRepository.findActiveBatches(shop.id, {
        include: { delivery_status: true },
      }),
```

Since these use `include` (which adds relations on top of all scalar fields) rather than `select`, `collective_total` and `min_order_value_snapshot` are already returned — no change needed here. If a future refactor switches these to `select`, the new fields must be added explicitly; leave a one-line comment above the `include` blocks noting this dependency:

```typescript
    // NOTE: uses `include` (not `select`) so new Batch scalar columns
    // (e.g. collective_total, min_order_value_snapshot) pass through
    // automatically — switching to `select` requires listing them explicitly.
    const [openBatch, activeBatches] = await Promise.all([
```

- [ ] **Step 3: Extend `BatchControlBar`'s props and render a PENDING_REVIEW block**

In `src/components/owned-shop/vendor-command-center/batch-control-bar.tsx`, extend the `activeBatch` prop type (currently lines 32-37):

```typescript
  activeBatch: {
    id: string;
    cutoff_time: string;
    status: string;
    delivery_status?: { current_milestone: string } | null;
    collective_total?: string | null;
    min_order_value_snapshot?: string | null;
  } | null;
```

Add a new prop `onForceLock?: () => void` alongside `onCancelRun` (line 48).

Add a rendering block for `PENDING_REVIEW`, following the same structural pattern as the existing status-conditioned blocks (near where the `OPEN`/`LOCKED` controls are rendered — insert before the "Cancel Run" button block at line 235):

```tsx
            {activeBatch.status === "PENDING_REVIEW" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  This batch is ₹
                  {Math.max(
                    0,
                    Number(activeBatch.min_order_value_snapshot ?? 0) -
                      Number(activeBatch.collective_total ?? 0)
                  ).toFixed(0)}{" "}
                  short of its collective minimum.
                </p>
                {onForceLock && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onForceLock}
                    disabled={pending}
                    className="h-9 px-4 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Proceed Anyway
                  </Button>
                )}
              </div>
            )}
```

Update the existing "Cancel Run" button's `disabled` condition (currently line 249-253):

```typescript
                disabled={
                  pending ||
                  (activeBatch.status !== "LOCKED" &&
                    activeBatch.status !== "IN_TRANSIT" &&
                    activeBatch.status !== "PENDING_REVIEW")
                }
```

- [ ] **Step 4: Wire `onForceLock` in `VendorCommandCenter`**

In `src/components/owned-shop/vendor-command-center/index.tsx`, import `useForceLockBatch` alongside the other batch hooks, and add (near `handleCancelBatch`, lines 257-264):

```typescript
  const forceLockBatchMutation = useForceLockBatch();

  const handleForceLockBatch = useCallback(() => {
    if (activeBatch) {
      forceLockBatchMutation.mutate(activeBatch.id);
    }
  }, [activeBatch, forceLockBatchMutation]);
```

Pass it to `BatchControlBar` at the existing render call (lines 592-606):

```tsx
      <BatchControlBar
        activeBatch={activeBatch}
        ...
        onCancelRun={handleCancelBatch}
        onForceLock={handleForceLockBatch}
        ...
      />
```

- [ ] **Step 5: Manual verification**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors.

Run the dev server (`pnpm dev`), manually create a shop with `batch_min_order_value` set, place an order below it, wait for (or manually trigger) cutoff, and confirm the vendor dashboard shows the shortfall banner with a working "Proceed Anyway" button and an enabled "Cancel Run" button.

- [ ] **Step 6: Commit**

```bash
git add src/services/vendor/vendor-api.service.ts src/app/api/vendor/orders/console/route.ts src/components/owned-shop/vendor-command-center/batch-control-bar.tsx src/components/owned-shop/vendor-command-center/index.tsx
git commit -m "feat: show PENDING_REVIEW batches with force-lock/cancel actions in vendor dashboard"
```

---

## Task 12: `batch_min_order_value` validation and shop create/update wiring

**Files:**
- Modify: `src/validations/shop.ts`
- Modify: `src/actions/shop/shop-actions.ts` (`createShopAction`, lines 101-116; `updateShopAction` needs no change — it spreads `...rest`/`...updateData`, so a new schema field rides along automatically, per the traced flow)
- Modify: `src/types/shop.types.ts` (`ShopUpdateFormShop`)
- Modify: `src/hooks/ui/useShopForm.ts` (`useUpdateShop`'s `defaultValues`, lines 85-103)

**Interfaces:**
- Produces: `batchMinOrderValueSchema: z.ZodOptional<z.ZodNullable<z.ZodNumber>>` in `shopSchema`/`shopActionSchema`; `ShopActionFormData.batch_min_order_value: number | null | undefined`.

- [ ] **Step 1: Add the validation schema**

In `src/validations/shop.ts`, add a sibling to `minOrderValueSchema` (currently lines 42-45):

```typescript
const minOrderValueSchema = z
  .number()
  .min(0, "Minimum order value cannot be negative")
  .max(10000, "Minimum order value cannot exceed ₹10,000");

const batchMinOrderValueSchema = z
  .number()
  .min(0, "Collective batch minimum cannot be negative")
  .max(50000, "Collective batch minimum cannot exceed ₹50,000")
  .nullable()
  .optional();
```

Add it to `shopSchema` (currently lines 56-69), as a sibling to `min_order_value`:

```typescript
export const shopSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  location: locationSchema,
  opening: openingSchema,
  closing: closingSchema,
  image_key: image_keySchema,
  qr_image_key: qr_image_keySchema,
  upi_id: z.string(),
  min_order_value: minOrderValueSchema,
  batch_min_order_value: batchMinOrderValueSchema,
  batch_slots: z.array(batchCardSchema).max(48),
  default_delivery_fee: feeSchema,
  direct_delivery_fee: feeSchema,
});
```

- [ ] **Step 2: Pass it through `createShopAction`**

In `src/actions/shop/shop-actions.ts`, `createShopAction` currently destructures fields and passes them explicitly to `shopRepository.create` (lines 101-116). Find where `min_order_value` is destructured from the parsed form data earlier in the function and add `batch_min_order_value` alongside it, then add it to the `data` object:

```typescript
    const newShop = await shopRepository.create({
      data: {
        closing,
        description,
        location,
        name,
        opening,
        image_key,
        qr_image_key,
        upi_id,
        min_order_value,
        batch_min_order_value: batch_min_order_value ?? null,
        default_delivery_fee,
        direct_delivery_fee,
        user: { connect: { id: user_id } },
      },
    });
```

`updateShopAction` needs no code change: it destructures `{ image, qr_image, batch_slots, ...rest }` from `parsedData.data` (line 183) and spreads `...rest` into `updateData` (line 192), so `batch_min_order_value` — now part of `shopActionSchema` — rides along automatically, exactly like every other untouched field.

- [ ] **Step 3: Extend `ShopUpdateFormShop`**

In `src/types/shop.types.ts`, add a sibling to `min_order_value` (line 20):

```typescript
export type ShopUpdateFormShop = {
  id: string;
  name: string;
  description: string;
  location: string;
  opening: string;
  closing: string;
  image_key: string;
  qr_image_key: string;
  upi_id: string;
  min_order_value: string | number;
  batch_min_order_value: string | number | null;
  default_delivery_fee: string | number;
  direct_delivery_fee: string | number;
  user: {
    name: string;
    email: string;
  } | null;
};
```

Check the server component/query that builds this object for the settings page (wherever `ShopUpdateFormShop` is populated from a Prisma `Shop` row — likely near where `shop-settings-form.tsx`'s parent page fetches the shop) and add `batch_min_order_value: shop.batch_min_order_value` to that mapping, matching how `min_order_value` is already passed through there.

- [ ] **Step 4: Extend `useUpdateShop`'s default values**

In `src/hooks/ui/useShopForm.ts`, `useUpdateShop`'s `defaultValues` (lines 87-102) currently include:

```typescript
      min_order_value: Number(shop.min_order_value) || 50,
```

Add:

```typescript
      min_order_value: Number(shop.min_order_value) || 50,
      batch_min_order_value:
        shop.batch_min_order_value !== null && shop.batch_min_order_value !== undefined
          ? Number(shop.batch_min_order_value)
          : null,
```

- [ ] **Step 5: Manual verification**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors introduced (the form's `defaultValues` object must satisfy `ShopActionFormData`, which now requires — as optional/nullable — `batch_min_order_value`).

- [ ] **Step 6: Commit**

```bash
git add src/validations/shop.ts src/actions/shop/shop-actions.ts src/types/shop.types.ts src/hooks/ui/useShopForm.ts
git commit -m "feat: add batch_min_order_value validation and shop create/update wiring"
```

---

## Task 13: Shop create/settings form fields for `batch_min_order_value`

**Files:**
- Modify: `src/components/create-shop/create-shop-form/pricing-step.tsx`
- Modify: `src/components/owned-shop/settings/shop-settings-form.tsx`
- Modify: `src/components/create-shop/create-shop-form/review-step.tsx`

**Interfaces:**
- Consumes: `batch_min_order_value` from `ShopActionFormData` (Task 12).

- [ ] **Step 1: Add the field to `pricing-step.tsx`**

In `src/components/create-shop/create-shop-form/pricing-step.tsx`, add a new `FormField` immediately after the existing `min_order_value` field (currently lines 37-63), before the "Two ways students get their order" info box:

```tsx
        <FormField
          control={form.control}
          name="batch_min_order_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                Collective batch minimum (₹) — optional
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className={fieldInputClass}
                  value={field.value ?? ""}
                  placeholder="No collective minimum"
                  onChange={(e) => {
                    const raw = e.currentTarget.value;
                    field.onChange(raw === "" ? null : Number(raw));
                  }}
                />
              </FormControl>
              <FormDescription className={fieldHintClass}>
                If set, a batch won&apos;t be confirmed unless everyone&apos;s
                orders together reach this amount by the cutoff — you decide
                what happens if it falls short.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
```

- [ ] **Step 2: Add the field to `shop-settings-form.tsx`**

In `src/components/owned-shop/settings/shop-settings-form.tsx`, add a sibling `FormField` inside the existing `grid gap-6 md:grid-cols-2` (right after the `min_order_value` field, currently lines 42-70):

```tsx
          <FormField
            control={form.control}
            name="batch_min_order_value"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Collective Batch Minimum (optional)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="No collective minimum"
                      className="pl-8 h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? null : Number(raw));
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[11px] text-muted-foreground/80 leading-normal font-medium">
                  Minimum combined order total for a batch to be confirmed. Leave blank to disable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
```

- [ ] **Step 3: Add it to the review step**

In `src/components/create-shop/create-shop-form/review-step.tsx`, next to the existing minimum-order line (line 92):

```tsx
        <p>Minimum order ₹{values.min_order_value ?? 0}</p>
        {values.batch_min_order_value != null && (
          <p>Collective batch minimum ₹{values.batch_min_order_value}</p>
        )}
```

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`, navigate to the shop creation flow's pricing step and an existing shop's settings page. Confirm the new field renders, accepts a blank value (disables the feature) and a numeric value, and that submitting persists it (check via `pnpm exec prisma studio` or a DB query that `Shop.batch_min_order_value` updates).

- [ ] **Step 5: Commit**

```bash
git add src/components/create-shop/create-shop-form/pricing-step.tsx src/components/owned-shop/settings/shop-settings-form.tsx src/components/create-shop/create-shop-form/review-step.tsx
git commit -m "feat: add collective batch minimum field to shop create/settings forms"
```

---

## Task 14: `GET /api/shops/[shopId]/batch-progress` read endpoint

**Files:**
- Create: `src/app/api/shops/[shopId]/batch-progress/route.ts`
- Modify: `src/lib/query-keys.ts` (add `batch.progress`)
- Test: `tests/integration/api/batch-progress.test.ts`

**Interfaces:**
- Produces: `GET /api/shops/:shopId/batch-progress` → `ActionResponse<{ batchId: string | null; status: BatchStatus | null; collectiveTotal: number; minRequired: number | null; isMet: boolean; cutoffTime: string | null }>`.

- [ ] **Step 1: Add the query key**

In `src/lib/query-keys.ts`, inside the `batch` object (currently lines 174-183), add a sibling to `nextSlot`:

```typescript
  batch: {
    all: ["batch"] as const,
    vendorDashboard: () => ["batch", "vendor", "dashboard"] as const,
    nextSlot: (shopId: string) => ["batch", "next-slot", shopId] as const,
    progress: (shopId: string) => ["batch", "progress", shopId] as const,
    summary: (batchId: string) => ["batch", batchId, "summary"] as const,
    active: () => ["batch", "active"] as const,
    directDeliveries: () => ["batch", "direct-deliveries"] as const,
    deliveryRun: () => ["batch", "delivery-run"] as const,
    orderConsole: () => ["batch", "order-console"] as const,
  },
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/integration/api/batch-progress.test.ts
import { describe, expect, it } from "vitest";

import { GET } from "../../../src/app/api/shops/[shopId]/batch-progress/route";
import { createShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("GET /api/shops/[shopId]/batch-progress", () => {
  it("returns the open batch's collective progress when a minimum is configured", async () => {
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 500 });
    await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 60 * 60 * 1000),
        status: "OPEN",
        collective_total: 200,
        min_order_value_snapshot: 500,
      },
    });

    const response = await GET(
      new Request(`http://localhost/api/shops/${shop.id}/batch-progress`),
      { params: Promise.resolve({ shopId: shop.id }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      status: "OPEN",
      collectiveTotal: 200,
      minRequired: 500,
      isMet: false,
    });
  });

  it("returns minRequired null and isMet true when the shop has no batch minimum configured", async () => {
    const shop = await createShop({ accepting_orders: true });

    const response = await GET(
      new Request(`http://localhost/api/shops/${shop.id}/batch-progress`),
      { params: Promise.resolve({ shopId: shop.id }) }
    );
    const body = await response.json();

    expect(body.data).toMatchObject({
      batchId: null,
      minRequired: null,
      isMet: true,
    });
  });
});
```

(Match the exact Next.js App Router route-handler signature — `{ params }: { params: Promise<{ shopId: string }> }` — already used by other dynamic API routes in this codebase, e.g. check `src/app/api/shops/[shopId]/batch-slots/route.ts` if it exists, or any sibling `[shopId]` route, and mirror its exact signature/params-unwrapping pattern.)

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test:integration -- batch-progress`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the route**

```typescript
// src/app/api/shops/[shopId]/batch-progress/route.ts
import { NextRequest } from "next/server";

import { batchRepository, shopRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;

    const shop = await shopRepository.findById(shopId, {
      select: { batch_min_order_value: true },
    });
    if (!shop) {
      return jsonResponse(createErrorResponse("Shop not found"), 404);
    }

    const openBatch = await batchRepository.findOpenBatchByShopId(shopId, {
      select: {
        id: true,
        status: true,
        collective_total: true,
        min_order_value_snapshot: true,
        cutoff_time: true,
      },
    });

    const minRequired =
      openBatch?.min_order_value_snapshot != null
        ? Number(openBatch.min_order_value_snapshot)
        : shop.batch_min_order_value != null
          ? Number(shop.batch_min_order_value)
          : null;
    const collectiveTotal = openBatch ? Number(openBatch.collective_total) : 0;

    return jsonResponse(
      createSuccessResponse(
        {
          batchId: openBatch?.id ?? null,
          status: openBatch?.status ?? null,
          collectiveTotal,
          minRequired,
          isMet: minRequired === null || collectiveTotal >= minRequired,
          cutoffTime: openBatch?.cutoff_time?.toISOString() ?? null,
        },
        "Batch progress retrieved"
      ),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET batch progress error:");
    return jsonResponse(
      createErrorResponse(
        error instanceof Error ? error.message : "Failed to get batch progress"
      ),
      500
    );
  }
}
```

(Uses `shop.batch_min_order_value` as a fallback `minRequired` when there's no open batch yet, so the UI can still show "this shop has a ₹X collective minimum" before the next batch opens — falls back to the batch's own frozen snapshot once one exists, per the Global Constraint that a batch's requirement is fixed at creation.)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:integration -- batch-progress`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/shops/[shopId]/batch-progress/route.ts src/lib/query-keys.ts tests/integration/api/batch-progress.test.ts
git commit -m "feat: add GET /api/shops/[shopId]/batch-progress endpoint"
```

---

## Task 15: Publish `BATCH_PROGRESS_UPDATED` after every `collective_total` change

**Files:**
- Create: `src/lib/batch-progress-publisher.ts`
- Modify: `src/services/order/order.service.ts` (`createOrderFromCart`, using `updatedBatch` from Task 4)
- Modify: `src/actions/orders/order-actions.ts` (`cancelOrderAction`, `updateOrderStatusAction`, `bulkUpdateOrderStatusAction`)
- Modify: `src/actions/shop/order-management-actions.ts` (`rejectOrderAction`)
- Test: `tests/unit/lib/batch-progress-publisher.test.ts`

**Interfaces:**
- Produces: `publishBatchProgress(payload: { batchId: string; shopId: string; status: string; collectiveTotal: number; minRequired: number | null }): Promise<void>` — never throws (catches and logs internally, matching the codebase's existing "don't fail the request over a notification" idiom at `order.service.ts:526-538`).

- [ ] **Step 1: Write the failing unit test**

```typescript
// tests/unit/lib/batch-progress-publisher.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  redisPublisher: { publish: vi.fn() },
}));

import { redisPublisher } from "@/lib/redis";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";

describe("publishBatchProgress", () => {
  it("publishes to the shop-scoped channel with a JSON payload", async () => {
    await publishBatchProgress({
      batchId: "batch-1",
      shopId: "shop-1",
      status: "OPEN",
      collectiveTotal: 200,
      minRequired: 500,
    });

    expect(redisPublisher.publish).toHaveBeenCalledWith(
      "shop:shop-1:batch-progress",
      JSON.stringify({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 200,
        minRequired: 500,
      })
    );
  });

  it("swallows publish errors instead of throwing", async () => {
    (redisPublisher.publish as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("redis down")
    );

    await expect(
      publishBatchProgress({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 200,
        minRequired: 500,
      })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit -- batch-progress-publisher`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the publisher**

```typescript
// src/lib/batch-progress-publisher.ts
import { createLogger } from "@/lib/logger";
import { redisPublisher } from "@/lib/redis";

const log = createLogger("batch-progress-publisher");

export interface BatchProgressPayload {
  batchId: string;
  shopId: string;
  status: string;
  collectiveTotal: number;
  minRequired: number | null;
}

export function batchProgressChannel(shopId: string): string {
  return `shop:${shopId}:batch-progress`;
}

export async function publishBatchProgress(
  payload: BatchProgressPayload
): Promise<void> {
  try {
    await redisPublisher.publish(
      batchProgressChannel(payload.shopId),
      JSON.stringify(payload)
    );
  } catch (error) {
    log.error({ err: error }, "Failed to publish batch progress update");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:unit -- batch-progress-publisher`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire it into `createOrderFromCart`**

In `src/services/order/order.service.ts`, after the transaction resolves (currently `const { order, shopOwnerId } = await this.prismaClient.$transaction(...)` at line 265, updated in Task 4 to also destructure `updatedBatch`), add a publish call next to the existing post-commit notification block (lines 526-538):

```typescript
    if (shopOwnerId) {
      try {
        await this.notificationService.publishNotification(shopOwnerId, {
          title: NEW_ORDER_NOTIFICATION_TITLE,
          message: `You have received a new order with ID: ${order.display_id}`,
          action_url: getShopOrderUrl(order.id),
          type: "INFO",
          category: "ORDER",
        });
      } catch (error) {
        log.error({ err: error }, "Notification Error:");
      }
    }

    if (updatedBatch) {
      await publishBatchProgress({
        batchId: updatedBatch.id,
        shopId: updatedBatch.shop_id,
        status: updatedBatch.status,
        collectiveTotal: updatedBatch.collective_total,
        minRequired: updatedBatch.min_order_value_snapshot,
      });
    }

    return order;
```

Add the import at the top of the file: `import { publishBatchProgress } from "@/lib/batch-progress-publisher";`.

- [ ] **Step 6: Wire it into the four cancellation/rejection call sites**

In each of `cancelOrderAction` (Task 5), `rejectOrderAction` (Task 6), and `updateOrderStatusAction`/`bulkUpdateOrderStatusAction` (Task 7), after the transaction that calls `batchRepository.adjustCollectiveTotal` (or, for `bulkUpdateOrderStatusAction`'s array form, the direct `prisma.batch.update` with `decrement`) resolves, publish the fresh state. For the three single-order cases, since `adjustCollectiveTotal` already returns the updated `Batch` row, use it directly:

```typescript
    // cancelOrderAction, after: const cancelledOrder = await prisma.$transaction(...)
    if (cancelledOrder) {
      await publishBatchProgress({
        batchId: cancelledOrder.id,
        shopId: cancelledOrder.shop_id,
        status: cancelledOrder.status,
        collectiveTotal: Number(cancelledOrder.collective_total),
        minRequired:
          cancelledOrder.min_order_value_snapshot != null
            ? Number(cancelledOrder.min_order_value_snapshot)
            : null,
      });
    }
```

(Name the local variable something clearer than `cancelledOrder` for the returned batch in the actual edit, e.g. `updatedBatch`, to avoid confusion with the order being cancelled — this snippet reuses the transaction's return value from Task 5's `const cancelledOrder = await prisma.$transaction(...)`, which should be renamed to `const updatedBatchAfterCancel = ...` when implementing this step.)

Apply the same pattern in `rejectOrderAction` (capture `adjustCollectiveTotal`'s return value from inside its transaction, per Task 6, and publish after) and in `updateOrderStatusAction` (same, per Task 7). For `bulkUpdateOrderStatusAction`, since the transaction is an array of `PrismaPromise`s rather than an async callback, re-fetch the affected batches' fresh totals after the transaction resolves and publish one event per distinct `batch_id`:

```typescript
    if (status === "CANCELLED") {
      const affectedBatchIds = [
        ...new Set(
          ordersToUpdate.filter((o) => o.batch_id).map((o) => o.batch_id!)
        ),
      ];
      if (affectedBatchIds.length > 0) {
        const freshBatches = await prisma.batch.findMany({
          where: { id: { in: affectedBatchIds } },
          select: {
            id: true,
            shop_id: true,
            status: true,
            collective_total: true,
            min_order_value_snapshot: true,
          },
        });
        await Promise.all(
          freshBatches.map((b) =>
            publishBatchProgress({
              batchId: b.id,
              shopId: b.shop_id,
              status: b.status,
              collectiveTotal: Number(b.collective_total),
              minRequired:
                b.min_order_value_snapshot != null
                  ? Number(b.min_order_value_snapshot)
                  : null,
            })
          )
        );
      }
    }
```

Add `import { publishBatchProgress } from "@/lib/batch-progress-publisher";` to both `src/actions/orders/order-actions.ts` and `src/actions/shop/order-management-actions.ts`.

- [ ] **Step 7: Run the full order/batch integration suites to confirm no regression**

Run: `pnpm test:integration -- orders`
Run: `pnpm test:integration -- batch`
Expected: all PASS — publish failures are swallowed internally (Step 4's test already covers that), so they can't break these tests even without mocking Redis, provided the test environment's Redis is reachable (it already must be, for `redisSubscriber`/SSE-dependent code elsewhere in the suite).

- [ ] **Step 8: Commit**

```bash
git add src/lib/batch-progress-publisher.ts src/services/order/order.service.ts src/actions/orders/order-actions.ts src/actions/shop/order-management-actions.ts tests/unit/lib/batch-progress-publisher.test.ts
git commit -m "feat: publish BATCH_PROGRESS_UPDATED whenever collective_total changes"
```

---

## Task 16: Per-shop SSE route for live batch progress

**Files:**
- Create: `src/app/api/shops/[shopId]/batch-progress/stream/route.ts`

**Interfaces:**
- Produces: `GET /api/shops/:shopId/batch-progress/stream` — an SSE endpoint emitting a `batch_progress` event with the `BatchProgressPayload` JSON body whenever `publishBatchProgress` fires for that shop.
- Consumes: `notificationEmitter` (`src/lib/notification-emitter.ts`, already channel-agnostic — no changes needed there) and `batchProgressChannel` from Task 15.

- [ ] **Step 1: Implement the route**

This mirrors `src/app/api/notifications/stream/route.ts` but deliberately simpler: no DB-backed replay/cursor logic (batch progress is ephemeral — a client that reconnects should just re-fetch via Task 14's REST endpoint, not replay missed deltas), no per-user connection limits (this is a public, per-shop broadcast, not a personal channel).

```typescript
// src/app/api/shops/[shopId]/batch-progress/stream/route.ts
import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import notificationEmitter from "@/lib/notification-emitter";
import { batchProgressChannel } from "@/lib/batch-progress-publisher";

const log = createLogger("route");

export const runtime = "nodejs";

const HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const channel = batchProgressChannel(shopId);

  let heartbeatInterval: NodeJS.Timeout | undefined;
  let handler: ((message: string) => void) | undefined;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (handler) notificationEmitter.unsubscribe(channel, handler);
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Ignore if already closed/cancelled
        }
      });

      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ shopId })}\n\n`)
      );

      handler = (message: string) => {
        try {
          const sseData = `event: batch_progress\ndata: ${message}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          log.error({ err: error }, "batch-progress SSE handler error:");
        }
      };
      notificationEmitter.subscribe(channel, handler);

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`)
          );
        } catch (error) {
          log.error({ err: error }, "Failed to send batch-progress heartbeat");
          cleanup();
          try {
            controller.close();
          } catch {
            // Ignore if already closed/cancelled
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    async cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
```

- [ ] **Step 2: Manual verification**

Run: `pnpm dev`, then from a browser console on any page run:
```js
const es = new EventSource("/api/shops/<a real shop id>/batch-progress/stream");
es.addEventListener("batch_progress", (e) => console.log(JSON.parse(e.data)));
```
Place an order against that shop's batch from another tab and confirm the event fires with the updated `collectiveTotal`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/shops/[shopId]/batch-progress/stream/route.ts
git commit -m "feat: add per-shop SSE route for live batch progress"
```

---

## Task 17: `useBatchProgress` client hook

**Files:**
- Create: `src/hooks/utils/useBatchProgress.ts`

**Interfaces:**
- Produces: `useBatchProgress(shopId: string): { data: BatchProgressState | undefined; isLoading: boolean }` where `BatchProgressState = { batchId: string | null; status: string | null; collectiveTotal: number; minRequired: number | null; isMet: boolean; cutoffTime: string | null }`.
- Consumes: `queryKeys.batch.progress` (Task 14), `GET /api/shops/[shopId]/batch-progress` (Task 14), the SSE route (Task 16).

- [ ] **Step 1: Implement the hook**

```typescript
// src/hooks/utils/useBatchProgress.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import axiosInstance from "@/lib/axios";
import { queryKeys } from "@/lib/query-keys";
import { ActionResponse } from "@/types";

export interface BatchProgressState {
  batchId: string | null;
  status: string | null;
  collectiveTotal: number;
  minRequired: number | null;
  isMet: boolean;
  cutoffTime: string | null;
}

interface BatchProgressEvent {
  batchId: string;
  shopId: string;
  status: string;
  collectiveTotal: number;
  minRequired: number | null;
}

async function fetchBatchProgress(shopId: string): Promise<BatchProgressState> {
  const response = await axiosInstance.get<ActionResponse<BatchProgressState>>(
    `/shops/${shopId}/batch-progress`
  );
  return response.data.data;
}

export function useBatchProgress(shopId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.batch.progress(shopId ?? ""),
    queryFn: () => fetchBatchProgress(shopId as string),
    enabled: !!shopId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!shopId) return;

    const eventSource = new EventSource(`/api/shops/${shopId}/batch-progress/stream`);

    const handleProgress = (event: MessageEvent) => {
      try {
        const payload: BatchProgressEvent = JSON.parse(event.data);
        queryClient.setQueryData<BatchProgressState>(
          queryKeys.batch.progress(shopId),
          (old) => ({
            batchId: payload.batchId,
            status: payload.status,
            collectiveTotal: payload.collectiveTotal,
            minRequired: payload.minRequired,
            isMet:
              payload.minRequired === null ||
              payload.collectiveTotal >= payload.minRequired,
            cutoffTime: old?.cutoffTime ?? null,
          })
        );
      } catch {
        // Ignore malformed events.
      }
    };

    eventSource.addEventListener("batch_progress", handleProgress);
    eventSource.onerror = () => {
      // The browser auto-reconnects EventSource; on reconnect the batch may
      // have rolled over, so invalidate to force a fresh REST read rather
      // than trusting stale in-memory state.
      queryClient.invalidateQueries({ queryKey: queryKeys.batch.progress(shopId) });
    };

    return () => {
      eventSource.removeEventListener("batch_progress", handleProgress);
      eventSource.close();
    };
  }, [shopId, queryClient]);

  return { data: query.data, isLoading: query.isLoading };
}
```

- [ ] **Step 2: Manual verification**

Add a temporary `console.log` consumer of this hook in any client page during dev, confirm it logs the initial REST value and then live updates as orders are placed — remove the temporary log before committing.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/utils/useBatchProgress.ts
git commit -m "feat: add useBatchProgress client hook"
```

---

## Task 18: `BatchProgress` UI component and cart-drawer wiring

**Files:**
- Create: `src/components/cart-drawer/batch-progress.tsx`
- Modify: `src/components/cart-drawer/cart-footer.tsx`
- Modify: `src/components/cart-drawer/cart-content.tsx`
- Modify: `src/components/cart-drawer/cart-items.tsx`

**Interfaces:**
- Produces: `<BatchProgress shopId={string} />` — renders nothing when the shop has no collective minimum configured (`minRequired === null`).
- Consumes: `useBatchProgress` (Task 17).

- [ ] **Step 1: Implement `BatchProgress`**

```tsx
// src/components/cart-drawer/batch-progress.tsx
"use client";

import React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { useBatchProgress } from "@/hooks/utils/useBatchProgress";

interface BatchProgressProps {
  shopId: string;
}

export function BatchProgress({ shopId }: BatchProgressProps) {
  const { data } = useBatchProgress(shopId);

  if (!data || data.minRequired === null) {
    return null;
  }

  const { collectiveTotal, minRequired, isMet } = data;
  const percentage = Math.min((collectiveTotal / minRequired) * 100, 100);
  const remaining = Math.max(minRequired - collectiveTotal, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Batch Progress (all students)
        </span>
        <span
          className={cn(
            "text-sm font-semibold",
            isMet ? "text-green-600" : "text-amber-600"
          )}
        >
          {isMet ? "✓ Batch confirmed" : `₹${remaining.toFixed(0)} more needed`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          ₹{collectiveTotal.toFixed(0)}/₹{minRequired.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
```

(Structurally mirrors `mov-progress.tsx` exactly, per the design spec's requirement that both bars read as one visual system.)

- [ ] **Step 2: Thread `shop_id` down to `CartFooter`**

`CartItemData` (used to build `ShopCart`/`CartSummary` in `src/lib/utils/cart.utils.ts:34`) already carries `shop_id` per item. In `src/components/cart-drawer/cart-content.tsx`, `CartItems` is rendered with `items={cart.items}` (line 21) — add a `shop_id` prop derived from the cart's items:

```tsx
      content: (
        <CartItems
          cart_id={cart.id}
          items={cart.items}
          shop_id={cart.items[0]?.shop_id}
          min_order_value={cart.min_order_value}
          shop_accepting_orders={cart.shop_accepting_orders}
        />
      ),
```

In `src/components/cart-drawer/cart-items.tsx`, add `shop_id: string | undefined` to `CartItems`'s props type and pass it through to wherever it renders `CartFooter` (find that render call in this file and add `shop_id={shop_id}`).

In `src/components/cart-drawer/cart-footer.tsx`, add `shop_id?: string` to `Props` (currently lines 8-13) and render `BatchProgress` above the existing `MOVProgress` (lines 25-30):

```tsx
type Props = {
  total_price: number;
  min_order_value: number;
  shop_accepting_orders: boolean;
  shop_id?: string;
  onProceed: () => void;
};

export function CartFooter({
  total_price,
  min_order_value,
  shop_accepting_orders,
  shop_id,
  onProceed,
}: Props) {
  const isMOVMet = total_price >= min_order_value;
  const canProceed = isMOVMet && shop_accepting_orders;

  return (
    <div className="border-t bg-background p-4 sticky bottom-0 z-10">
      <div className="space-y-4">
        {shop_id && <BatchProgress shopId={shop_id} />}
        <MOVProgress
          currentTotal={total_price}
          minOrderValue={min_order_value}
        />
        ...
```

Add the import: `import { BatchProgress } from "@/components/cart-drawer/batch-progress";`.

- [ ] **Step 3: Manual verification**

Run: `pnpm dev`. Open the cart drawer for a shop with `batch_min_order_value` configured — confirm the batch progress bar appears above the personal MOV bar and updates live (open a second browser/incognito session, add items to that shop's cart from the second session, and watch the first session's bar move without a refresh). Confirm shops without the field configured show no batch progress bar.

- [ ] **Step 4: Commit**

```bash
git add src/components/cart-drawer/batch-progress.tsx src/components/cart-drawer/cart-footer.tsx src/components/cart-drawer/cart-content.tsx src/components/cart-drawer/cart-items.tsx
git commit -m "feat: show live collective batch progress in the cart drawer"
```

---

## Task 19: Shop details page and checkout live progress

**Files:**
- Create: `src/components/shops/batch/batch-progress-banner.tsx`
- Modify: `src/components/shops/shop-details.tsx`
- Modify: `src/page-components/checkout/checkout-page.tsx`

**Interfaces:**
- Produces: `<BatchProgressBanner shopId={string} />` — a client component wrapping `BatchProgress` (Task 18) for use inside server components, following the exact pattern already established by `BatchCountdownBanner` (`src/components/shops/batch/batch-countdown-banner.tsx`, already used identically in `checkout-page.tsx`).

- [ ] **Step 1: Implement `BatchProgressBanner`**

```tsx
// src/components/shops/batch/batch-progress-banner.tsx
"use client";

import React from "react";

import { BatchProgress } from "@/components/cart-drawer/batch-progress";

interface BatchProgressBannerProps {
  shopId: string;
}

export function BatchProgressBanner({ shopId }: BatchProgressBannerProps) {
  return (
    <div className="rounded-xl border border-border/20 bg-muted/15 p-4">
      <BatchProgress shopId={shopId} />
    </div>
  );
}
```

(If `BatchCountdownBanner` uses a different wrapper structure/styling convention, open it first and match its container markup instead of the generic card above, so the two banners look consistent when they appear next to each other in `checkout-page.tsx`.)

- [ ] **Step 2: Add it to `shop-details.tsx`**

In `src/components/shops/shop-details.tsx`, near the existing "Minimum Order" stat card (lines 153-166), add the banner after the stats grid (after line 180's closing of the fee-card grid, before the `Separator`/whatever follows):

```tsx
            </div>

            <BatchProgressBanner shopId={shop.id} />
```

Add the import: `import { BatchProgressBanner } from "@/components/shops/batch/batch-progress-banner";`. Since `ShopDetails` is an `async function` server component, this is fine — `BatchProgressBanner` itself is the client boundary.

- [ ] **Step 3: Add it to `checkout-page.tsx`**

In `src/page-components/checkout/checkout-page.tsx`, next to the existing `<BatchCountdownBanner shopId={shop_id} />`, add:

```tsx
      <BatchCountdownBanner shopId={shop_id} />
      <BatchProgressBanner shopId={shop_id} />
```

Add the import alongside the existing `BatchCountdownBanner` import.

- [ ] **Step 4: Manual verification**

Run: `pnpm dev`. Visit a shop's detail page and the checkout page for a shop with `batch_min_order_value` configured — confirm the banner renders and updates live in both locations.

- [ ] **Step 5: Commit**

```bash
git add src/components/shops/batch/batch-progress-banner.tsx src/components/shops/shop-details.tsx src/page-components/checkout/checkout-page.tsx
git commit -m "feat: show live batch progress on shop details and checkout pages"
```

---

## Task 20: Order confirmation/history batch status text

**Files:**
- Modify: `src/lib/utils/order.utils.ts` (`serializeOrderWithDetails`, lines 127-144)
- Modify: `src/types/*` (wherever `SerializedOrderWithDetails`'s `batch` shape is typed — find it alongside `OrderWithDetails`/`SerializedOrder` in `src/types`)
- Modify: `src/components/orders/order-card.tsx` (lines 67-95)
- Modify: `src/components/orders/order-details-info.tsx` (lines 118-133)

**Interfaces:**
- Produces: `order.batch.collective_total: number` and `order.batch.min_order_value_snapshot: number | null` available on every serialized order, and a new `PENDING_REVIEW`/`CANCELLED` branch in both components' existing status-label ternaries.

- [ ] **Step 1: Extend `serializeOrderWithDetails`**

In `src/lib/utils/order.utils.ts`, the `batch` mapping (currently lines 127-144) is:

```typescript
    batch: order.batch
      ? {
          id: order.batch.id,
          cutoff_time: transformDateToLocaleString(order.batch.cutoff_time),
          status: order.batch.status,
          delivery_status: order.batch.delivery_status
            ? { ... }
            : null,
        }
      : null,
```

Add the two new fields:

```typescript
    batch: order.batch
      ? {
          id: order.batch.id,
          cutoff_time: transformDateToLocaleString(order.batch.cutoff_time),
          status: order.batch.status,
          collective_total: Number(order.batch.collective_total),
          min_order_value_snapshot:
            order.batch.min_order_value_snapshot != null
              ? Number(order.batch.min_order_value_snapshot)
              : null,
          delivery_status: order.batch.delivery_status
            ? { ... }
            : null,
        }
      : null,
```

(`orderWithDetailsInclude`'s `batch: { include: { delivery_status: true } }`, lines 104-108, already returns every scalar column including the two new ones — no include change needed, matching Task 11 Step 2's finding for `include` vs `select`.)

- [ ] **Step 2: Extend the `SerializedOrderWithDetails` batch type**

Find the type definition for the `batch` field on `SerializedOrderWithDetails` (search `src/types` for wherever the shape matching `serializeOrderWithDetails`'s `batch` object is declared — likely alongside `SerializedOrder`) and add:

```typescript
  batch: {
    id: string;
    cutoff_time: string;
    status: BatchStatus;
    collective_total: number;
    min_order_value_snapshot: number | null;
    delivery_status: { ... } | null;
  } | null;
```

- [ ] **Step 3: Extend `order-card.tsx`'s status label**

In `src/components/orders/order-card.tsx`, the existing ternary chain (lines 81-89):

```tsx
                    {order.batch.status === "OPEN"
                      ? "Collecting orders"
                      : order.batch.status === "LOCKED"
                        ? "Batch confirmed"
                        : order.batch.status === "IN_TRANSIT"
                          ? "On the way"
                          : order.batch.status === "COMPLETED"
                            ? "Delivered"
                            : order.batch.status}
```

Extend it with the two new statuses:

```tsx
                    {order.batch.status === "OPEN"
                      ? "Collecting orders"
                      : order.batch.status === "PENDING_REVIEW"
                        ? "Awaiting shop decision"
                        : order.batch.status === "LOCKED"
                          ? "Batch confirmed"
                          : order.batch.status === "IN_TRANSIT"
                            ? "On the way"
                            : order.batch.status === "COMPLETED"
                              ? "Delivered"
                              : order.batch.status === "CANCELLED"
                                ? "Batch cancelled"
                                : order.batch.status}
```

Directly below this badge (still inside the `order.batch ? (...) : (...)` block, after the closing `</Badge>` at line 90), add a shortfall line shown only while `OPEN`:

```tsx
                  {order.batch.status === "OPEN" &&
                    order.batch.min_order_value_snapshot !== null && (
                      <span className="text-muted-foreground/80 font-medium">
                        ₹
                        {Math.max(
                          0,
                          order.batch.min_order_value_snapshot -
                            order.batch.collective_total
                        ).toFixed(0)}{" "}
                        more needed to confirm this batch
                      </span>
                    )}
```

- [ ] **Step 4: Extend `order-details-info.tsx`'s status display**

In `src/components/orders/order-details-info.tsx`, the existing block (lines 118-133):

```tsx
          <InfoRow Icon={Package} label="Batch Slot">
            {batch ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-orange-600">
                  <DateDisplay date={batch.cutoff_time} />
                </span>
                <Badge variant="secondary" className="uppercase">
                  {batch.status}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Not assigned yet (waiting for batching)
              </span>
            )}
          </InfoRow>
```

Extend to show the same shortfall text:

```tsx
          <InfoRow Icon={Package} label="Batch Slot">
            {batch ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-orange-600">
                    <DateDisplay date={batch.cutoff_time} />
                  </span>
                  <Badge variant="secondary" className="uppercase">
                    {batch.status === "PENDING_REVIEW"
                      ? "Awaiting shop decision"
                      : batch.status}
                  </Badge>
                </div>
                {batch.status === "OPEN" && batch.min_order_value_snapshot !== null && (
                  <span className="text-xs text-muted-foreground">
                    ₹
                    {Math.max(
                      0,
                      batch.min_order_value_snapshot - batch.collective_total
                    ).toFixed(0)}{" "}
                    more needed to confirm this batch
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Not assigned yet (waiting for batching)
              </span>
            )}
          </InfoRow>
```

- [ ] **Step 5: Manual verification**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors.

Run: `pnpm dev`, place an order against a shop with a collective minimum configured, and confirm the order card and order detail page both show the shortfall text while the batch is `OPEN`, and the correct label once it transitions to `PENDING_REVIEW`/`LOCKED`/`CANCELLED`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils/order.utils.ts src/types src/components/orders/order-card.tsx src/components/orders/order-details-info.tsx
git commit -m "feat: show collective batch progress and status in order history"
```

---

## Self-Review

**Spec coverage** — every section of `docs/superpowers/specs/2026-09-14-batch-collective-minimum-order-design.md` maps to a task:
- Data model → Task 1.
- Service logic (order placement/cancellation, batch creation, cutoff handling) → Tasks 3, 4, 5, 6, 7, 8.
- Owner resolution actions → Tasks 9, 10, 11.
- Realtime progress → Tasks 15, 16, 17.
- UI (cart drawer/checkout, shop details, order history, owner dashboard, shop settings) → Tasks 11, 13, 18, 19, 20.
- Error handling & correctness (concurrency, symmetric decrement, snapshot immutability, no new orders on non-OPEN batches, channel isolation, backward compatibility) → covered by Tasks 2-9's atomic-update design, Task 3's snapshot, and the existing `batch_id`-status check already in `order.service.ts` (untouched, still gates on `status !== "OPEN"`).
- Testing → a dedicated test precedes every behavioral task (2, 3, 4, 5, 6, 7, 8, 9, 14, 15).

**Placeholder scan** — no "TBD"/"TODO" remain; the few steps that say "check the existing X and match its pattern" (Tasks 5 Step 3, 10 Steps 1/3, 19 Step 1) are deliberate low-risk lookups of code this plan couldn't fully pre-read without recursive exploration, each scoped to a single named function/file rather than an open-ended search, and each still carries a concrete fallback snippet to adapt.

**Type consistency** — `BatchProgressPayload`/`BatchProgressState` field names (`batchId`, `shopId`, `status`, `collectiveTotal`, `minRequired`) are identical across Task 15 (publisher), Task 16 (SSE route, passthrough), and Task 17 (hook); `adjustCollectiveTotal`'s signature (`batchId, delta, tx?`) is used identically in Tasks 5, 6, 7; `SerializedBatch`'s new fields (`collective_total: string`, `min_order_value_snapshot: string | null`) match the raw-Prisma-passthrough behavior confirmed in Task 11 Step 1, while the order-history serializer (Task 20) intentionally converts to `number` at serialization time, matching the rest of `serializeOrderWithDetails`'s existing `Number(...)` conventions elsewhere in that file.

---

Plan complete and saved to `docs/superpowers/plans/2026-09-14-batch-collective-minimum-order.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
