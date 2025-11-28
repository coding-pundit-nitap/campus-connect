export const getOrderUrl = (orderId: string) => `/orders/${orderId}`;

export const getShopOrderUrl = (orderId: string) =>
  `/owner-shops/orders/${orderId}`;

export const getProductUrl = (productId: string) => `/products/${productId}`;
