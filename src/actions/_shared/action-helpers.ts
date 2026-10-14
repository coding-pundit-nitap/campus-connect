// Internal helpers shared by the (non-admin) server actions.
// NOTE: deliberately NOT a "use server" module: nothing here may become a
// client-callable endpoint.

import { randomInt } from "node:crypto";

import { notificationService, shopRepository } from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import {
  BadRequestError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import type { createLogger } from "@/lib/logger";
import authUtils from "@/lib/utils/auth.utils.server";

type Logger = Pick<ReturnType<typeof createLogger>, "error">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorClass = new (...args: any[]) => Error;

/** Authentication/authorization errors most actions rethrow untouched. */
export const AUTH_ERRORS: readonly ErrorClass[] = [
  UnauthorizedError,
  UnauthenticatedError,
];

export interface ActionErrorPolicy {
  /** Message logged together with the caught error. */
  label: string;
  /** Message of the InternalServerError thrown for unexpected errors. */
  fallback: string;
  /** Error classes rethrown as-is instead of being wrapped. */
  passthrough?: readonly ErrorClass[];
}

/**
 * Runs `fn` and maps failures: every error is logged, errors that are an
 * instance of a `passthrough` class are rethrown, anything else is replaced
 * by an InternalServerError(`fallback`).
 */
export async function runAction<T>(
  log: Logger,
  { label, fallback, passthrough = [] }: ActionErrorPolicy,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    log.error({ err: error }, label);
    if (passthrough.some((E) => error instanceof E)) {
      throw error;
    }
    throw new InternalServerError(fallback);
  }
}

/** Current user's id, or UnauthorizedError(`message`) when there is none. */
export async function requireUserId(
  message = "Unauthorized: Please log in."
): Promise<string> {
  const userId = await authUtils.getUserId();
  if (!userId) throw new UnauthorizedError(message);
  return userId;
}

/** Shop id from the session, or UnauthorizedError when the user owns none. */
export async function requireOwnedShopId(
  message = "Unauthorized: You do not own a shop."
): Promise<string> {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) throw new UnauthorizedError(message);
  return shopId;
}

/**
 * Shop id of the current vendor looked up by owner:
 * UnauthorizedError("Not authorized") without a user,
 * BadRequestError("Shop not found") when the user owns no shop.
 */
export async function requireVendorShopId(): Promise<string> {
  const user = await authUtils.getUserData();
  if (!user.id) throw new UnauthorizedError("Not authorized");

  const shop = await shopRepository.findByOwnerId(user.id, {
    select: { id: true },
  });
  if (!shop) throw new BadRequestError("Shop not found");
  return shop.id;
}

export type NotificationPayload = Parameters<
  typeof notificationService.publishNotification
>[1];

/**
 * Publishes a notification to `userId` (when set); a failure is logged with
 * `label` and swallowed so it never fails the surrounding action.
 */
export async function notifyUserSafely(
  log: Logger,
  userId: string | null | undefined,
  payload: NotificationPayload,
  label: string
): Promise<void> {
  if (!userId) return;
  try {
    await notificationService.publishNotification(userId, payload);
  } catch (error) {
    log.error({ err: error }, label);
  }
}

export interface BatchProgressRow {
  id: string;
  shop_id: string;
  status: string;
  collective_total: unknown;
  min_order_value_snapshot: unknown;
}

/** Publishes the live progress of `batch`; no-op when it is null. */
export async function publishBatchRowProgress(
  batch: BatchProgressRow | null | undefined
): Promise<void> {
  if (!batch) return;
  await publishBatchProgress({
    batchId: batch.id,
    shopId: batch.shop_id,
    status: batch.status,
    collectiveTotal: Number(batch.collective_total),
    minRequired:
      batch.min_order_value_snapshot !== null
        ? Number(batch.min_order_value_snapshot)
        : null,
  });
}

/** Cryptographically random 4-digit delivery OTP ("1000"-"9999"). */
export function generateDeliveryOtp(): string {
  return randomInt(1000, 10000).toString();
}
