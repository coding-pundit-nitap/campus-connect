import { notificationService } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const log = createLogger("stock-watch-notification-service");

/**
 * Notifies every user watching a product that it is back in stock, then
 * clears the watch list for that product.
 *
 * This is an internal helper invoked from trusted server-side product
 * mutation flows once stock transitions from zero to positive. It accepts
 * fully-formed display text and touches every watcher's notifications plus
 * deletes stock-watch rows, so it must never be reachable directly by a
 * client — it must not live in a "use server" module, since every export
 * of such a module becomes a callable endpoint.
 *
 * @param product_id - The product that came back into stock.
 * @param product_name - Display name used in the notification message.
 * @param shop_name - Display name used in the notification message.
 * @returns The number of watchers notified (0 on failure or no watchers).
 */
export async function notifyStockWatchers(
  product_id: string,
  product_name: string,
  shop_name: string
): Promise<number> {
  try {
    const watchers = await prisma.stockWatch.findMany({
      where: { product_id: product_id },
      select: { user_id: true, id: true },
    });

    if (watchers.length === 0) return 0;

    await Promise.allSettled(
      watchers.map((w) =>
        notificationService.publishNotification(w.user_id, {
          title: "Back in Stock!",
          message: `"${product_name}" at ${shop_name} is now back in stock.`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: `/product/${product_id}`,
        })
      )
    );

    await prisma.stockWatch.deleteMany({
      where: { product_id: product_id },
    });

    return watchers.length;
  } catch (error) {
    log.error({ err: error }, "NOTIFY STOCK WATCHERS ERROR:");
    return 0;
  }
}
