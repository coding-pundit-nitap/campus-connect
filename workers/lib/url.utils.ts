export const getOrderUrl = (orderId: string) => `/orders/${orderId}`;

export const getShopOrderUrl = (orderId: string) =>
  `/owner-shops/orders/${orderId}`;

export const getProductUrl = (productId: string) => `/product/${productId}`;

/**
 * Resolves a notification action_url (usually an app-relative path such as
 * "/orders/123") against the app's base URL so it works outside the browser,
 * e.g. in emails. Returns null for anything that isn't http(s), such as a
 * `javascript:` URL.
 */
export function toAbsoluteUrl(
  url: string | null | undefined,
  baseUrl: string
): string | null {
  if (!url) return null;
  try {
    const resolved = new URL(url, baseUrl);
    return resolved.protocol === "http:" || resolved.protocol === "https:"
      ? resolved.toString()
      : null;
  } catch {
    return null;
  }
}
