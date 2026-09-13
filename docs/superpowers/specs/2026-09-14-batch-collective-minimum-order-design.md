# Collective batch minimum order value with live progress

## Goal

Shops today only enforce a per-user, per-cart minimum order value (`Shop.min_order_value`) at checkout. This adds a second, independent threshold: a **collective minimum order value across all orders in a shop's currently open batch**. If the group doesn't collectively reach the threshold by the batch's cutoff time, the batch doesn't auto-lock — the shop owner is notified and decides whether to proceed anyway or cancel/refund the batch. Users see live progress toward this collective threshold in the cart drawer/checkout, on the shop page, and on order confirmation/history.

## Non-goals

- No change to the existing per-user MOV check (`order.service.ts:409-415`) — it keeps gating individual checkout exactly as today.
- No per-batch-slot configuration of the collective threshold — one flat `batch_min_order_value` per shop, applied to every batch that shop opens.
- No automatic cutoff extension and no automatic cancellation on under-threshold batches — the owner always makes the call (see "Under-threshold batches" below).
- No changes to delivery-milestone tracking (`BatchDeliveryStatus`/`BatchMilestone`) — orthogonal to this feature.

## Data model

`prisma/schema.prisma` changes:

- `Shop.batch_min_order_value: Decimal? @db.Decimal(10, 2)` — nullable, default `null`. `null` (or unset) means the feature is off for that shop; existing shops are unaffected until an owner opts in via shop settings (same form/validation pattern as `min_order_value`, reusing `minOrderValueSchema`-style validation).
- `Batch.collective_total: Decimal @default(0) @db.Decimal(10, 2)` — running sum of `item_total` across every order currently attached to the batch. Denormalized so progress reads don't require summing orders on every request.
- `Batch.min_order_value_snapshot: Decimal? @db.Decimal(10, 2)` — copied from `Shop.batch_min_order_value` at the moment the batch is created (in `ensureNextOpenBatch` / wherever a `Batch` row is first inserted). A batch's requirement is fixed for its lifetime; an owner changing the shop's threshold later only affects batches created after the change. Without this snapshot, an owner raising the threshold mid-batch would retroactively fail an already-in-progress batch, which is confusing and unfair to users who already ordered against the old number.
- New `BatchStatus` value: `PENDING_REVIEW` — reached when the cutoff passes with `collective_total < min_order_value_snapshot`. Distinct from `OPEN` (still accepting orders) and `LOCKED` (confirmed, proceeding). Owner resolves a `PENDING_REVIEW` batch into either `LOCKED` (force-lock) or `CANCELLED` (existing cancel/refund path).

Migration:
- New columns are additive and nullable/defaulted — no backfill required for `Shop.batch_min_order_value` (defaults to disabled).
- One-time backfill for any currently-`OPEN` batches: compute `collective_total` from the sum of their existing orders' `item_total` so in-flight batches don't start at a stale 0.

## Service logic

### Order placement / cancellation (`order.service.ts`, `batch.service.ts`)

- Inside the same transaction that creates an order and attaches it to a batch, atomically increment `Batch.collective_total` by the order's `item_total` (use a DB-level increment, e.g. Prisma's `{ increment: itemTotal }`, not read-then-write — matches the concurrency approach already validated by `batch-race.test.ts`).
- Every path that cancels or refunds an order after it was counted (user cancellation, owner cancellation, payment failure reconciliation) must symmetrically decrement `collective_total` by that order's `item_total` in the same transaction as the status change. Audit all existing cancellation/refund call sites in `order.service.ts` and `batch.service.ts` to ensure none bypass this — a missed path causes `collective_total` to drift upward permanently, permanently misrepresenting progress.
- After any change to `collective_total`, publish a `BATCH_PROGRESS_UPDATED` event (see Realtime below) with the batch's new totals.

### Batch creation (`ensureNextOpenBatch`)

- When a new `Batch` row is created, snapshot `min_order_value_snapshot = shop.batch_min_order_value` and initialize `collective_total = 0`.

### Cutoff handling (`autoCloseExpiredBatches` / `autoLockExpiredBatches`)

- At cutoff, branch on the snapshot:
  - `min_order_value_snapshot` is `null` → behave exactly as today (auto-lock unconditionally).
  - `min_order_value_snapshot` is set and `collective_total >= min_order_value_snapshot` → auto-lock as today.
  - `min_order_value_snapshot` is set and `collective_total < min_order_value_snapshot` → set status to `PENDING_REVIEW` instead of `LOCKED`; send the shop owner a notification via the existing notification pipeline (reusing the "Batch Ready!" notification pattern at `batch.service.ts:894-903`) stating the shortfall (e.g. "Batch at ₹3,200 of ₹5,000 — decide to proceed or cancel").
- New owner actions on a `PENDING_REVIEW` batch:
  - `forceLockBatch(batchId)` — transitions `PENDING_REVIEW → LOCKED`, proceeds exactly like a normal lock (same downstream delivery flow).
  - `cancelBatch(batchId)` — reuses the existing cancel path, which must handle `PENDING_REVIEW` as a valid source status (currently likely only handles `OPEN`/`LOCKED`; verify and extend).
- A `PENDING_REVIEW` batch does not accept new orders (same as `LOCKED`) — freezing the collective total while the owner decides avoids the totals shifting mid-decision.

## Realtime progress

Reuses the existing BullMQ → Redis pub/sub → SSE pipeline (`notification-producer.ts`, `workers/notification/consumer.ts`, `src/app/api/notifications/stream/route.ts`, `useLiveNotifications`), rather than building new infrastructure:

- New event type `BATCH_PROGRESS_UPDATED` published on a **per-shop** Redis channel (e.g. `shop:{shop_id}:batch-progress`), separate from the per-user notification channel — this is shop-scoped broadcast data, not a personal notification, so it must not be piped through the personal `user:{user_id}:notifications` channel or the toast/push-notification UI.
- New lightweight client hook (or an extension of `useLiveNotifications`'s channel subscription, kept structurally separate to avoid coupling progress updates to toast/sound side effects) that subscribes to the shop's progress channel while the cart drawer, checkout, or shop page for that shop is open, and patches a React Query cache entry (e.g. `queryKeys.batch.progress(shopId)`) directly rather than just invalidating — avoids a refetch waterfall on every order placed by any user.
- Initial load (before any SSE event arrives): `GET /api/shops/:shopId/batch-progress` → `{ batchId, status, collectiveTotal, minRequired, isMet, cutoffTime }` for the shop's current non-`CANCELLED`/non-`COMPLETED` batch. Returns `minRequired: null, isMet: true` when the shop has no `batch_min_order_value` configured, so the UI can render nothing for shops without the feature enabled.
- Channel scoping and lifecycle: subscriptions are per-`shop_id`, not per-batch, so a client doesn't need to resubscribe when the shop's open batch rolls over — the server-side publisher always publishes under the shop's channel regardless of which batch is currently open. Clients must re-fetch `batch-progress` (not just trust stale SSE state) whenever the subscription reconnects, so a batch rollover (old batch locked, new one opened) is picked up correctly instead of showing a frozen total from the just-closed batch.

## UI

- **`BatchProgress` component** (new, sibling to `MOVProgress` in `src/components/cart-drawer/`): same visual language (progress bar, "✓ met" / "₹X more needed" text) but sourced from the shop-level collective query instead of the user's own cart total. Renders nothing when `minRequired` is `null`.
- **Cart drawer / checkout** (`cart-footer.tsx`, checkout page): show `BatchProgress` alongside the existing personal `MOVProgress`. Checkout button gating is unchanged — it still only depends on the personal MOV being met; the collective threshold never blocks an individual user from checking out, it only gates whether the *batch* proceeds at cutoff.
- **Shop details page** (`shop-details.tsx`): read-only `BatchProgress` for the shop's current open batch, shown near the existing static "Minimum Order" display.
- **Order confirmation / order history**: surface the batch's status in plain language once an order is placed — "Batch confirmed", "₹X more needed to confirm this batch" (while `OPEN`), "Awaiting shop decision" (while `PENDING_REVIEW`), or "Batch cancelled — refunded" (`CANCELLED`).
- **Owner vendor dashboard** (`getVendorDashboard` view): a `PENDING_REVIEW` batch card gets two actions, "Proceed anyway" (force-lock) and "Cancel & refund" (existing cancel flow), plus the shortfall amount.
- **Shop settings**: add a `batch_min_order_value` field next to the existing `min_order_value` field in the shop settings/create forms (`pricing-step.tsx`, `shop-settings-form.tsx`, etc.), reusing the existing zod validation pattern, optional/nullable.

## Error handling & correctness

- **Concurrency**: concurrent checkouts against the same batch must not lose increments — use atomic DB increments inside the order-creation transaction, following the existing pattern validated in `batch-race.test.ts`.
- **Symmetric decrement**: every cancellation/refund path must decrement `collective_total`; add a shared helper (e.g. `adjustBatchCollectiveTotal(batchId, delta, tx)`) called from all order-status-change sites rather than duplicating the increment/decrement logic, so no path is missed.
- **Threshold snapshot immutability**: `min_order_value_snapshot` is set once at batch creation and never re-read from `Shop` afterward, preventing goalpost-moving bugs.
- **No new orders on `PENDING_REVIEW`/`LOCKED`**: order creation must check batch status and reject (with a clear error) if the target batch isn't `OPEN`, consistent with existing behavior for `LOCKED`.
- **Channel/data isolation**: the per-shop progress channel must never leak another shop's data, and stale SSE state from a just-closed batch must not linger — verified by requiring a fresh `batch-progress` fetch on reconnect (see Realtime).
- **Backward compatibility**: shops without `batch_min_order_value` set see no UI change and no behavior change at cutoff (unconditional auto-lock, as today).

## Testing

- Unit: `adjustBatchCollectiveTotal` increment/decrement correctness; threshold-met boolean logic; snapshot-immutability (changing `Shop.batch_min_order_value` mid-batch doesn't affect an open batch's `min_order_value_snapshot`).
- Integration: concurrent order placement against one batch (extend `batch-race.test.ts` pattern) — final `collective_total` must equal the sum of all successfully placed orders' `item_total`, with no lost updates.
- Integration: cancel-after-partial-lock — cancelling an order decrements the total; cancelling a `PENDING_REVIEW` batch refunds all its orders via the existing cancel path.
- Integration: cutoff behavior — batch below threshold transitions to `PENDING_REVIEW` and fires the owner notification; batch at/above threshold auto-locks as today; shop with no threshold configured auto-locks unconditionally.
- Manual: verify live progress updates in the cart drawer across two browser sessions (two users adding to the same shop's cart concurrently) without a page refresh; verify shop page and order history reflect correct batch status text at each stage.

## Files touched (expected)

- Schema: `prisma/schema.prisma` (+migration) — `Shop.batch_min_order_value`, `Batch.collective_total`, `Batch.min_order_value_snapshot`, `BatchStatus.PENDING_REVIEW`.
- Services: `src/services/batch/batch.service.ts` (cutoff branching, `forceLockBatch`, `adjustBatchCollectiveTotal`, snapshot on creation, publish progress event), `src/services/order/order.service.ts` (increment/decrement hookup on order create/cancel).
- Realtime: new publisher call for `BATCH_PROGRESS_UPDATED` (extends `notification-producer.ts` or a small sibling module), new SSE/subscription handling for the per-shop channel (extends `src/app/api/notifications/stream/route.ts` or a new lightweight endpoint), new/extended client hook alongside `useLiveNotifications`.
- API: new `GET /api/shops/[shopId]/batch-progress` route.
- Validation: extend `src/validations/shop.ts` with `batchMinOrderValueSchema`.
- UI: new `src/components/cart-drawer/batch-progress.tsx`; edits to `cart-footer.tsx`, `shop-details.tsx`, checkout page, order confirmation/history components, vendor dashboard batch card, shop settings/create forms (`pricing-step.tsx`, `shop-settings-form.tsx`, `shop-settings-card.tsx`, `shop-profile-content.tsx`, `review-step.tsx`, `shop-preview-card.tsx`).
- Repository: `src/repositories/batch.repository.ts` (fetch/update helpers for the new fields), `src/repositories/cart.repository.ts` if the initial-load endpoint reuses cart-adjacent queries.
- Tests: extend `tests/integration/batch/batch-race.test.ts`; new tests for cutoff/`PENDING_REVIEW` transition and cancel-refund symmetry.
