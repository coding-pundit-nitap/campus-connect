// Fixture builders shared by the src/actions/** (non-admin) unit tests.

export const USER_ID = "user-1";
export const SHOP_ID = "shop-1";

export const buildUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_ID,
  shop_id: SHOP_ID,
  ...overrides,
});

export const buildBatch = (overrides: Record<string, unknown> = {}) => ({
  id: "batch-1",
  shop_id: SHOP_ID,
  status: "OPEN",
  collective_total: 100,
  min_order_value_snapshot: 50,
  cutoff_time: new Date("2026-01-01T10:00:00.000Z"),
  ...overrides,
});

export const buildOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "order-1",
  display_id: "ORD-1",
  shop_id: SHOP_ID,
  user_id: USER_ID,
  order_status: "NEW",
  payment_method: "CASH",
  payment_status: "PENDING",
  batch_id: null as string | null,
  item_total: 200,
  total_price: 250,
  customer_notes: null as string | null,
  delivery_otp: null as string | null,
  is_direct_delivery: false,
  ...overrides,
});

export const buildProduct = (overrides: Record<string, unknown> = {}) => ({
  id: "product-1",
  name: "Chips",
  shop_id: SHOP_ID,
  stock_quantity: 5,
  image_key: "old-key",
  category_id: "cat-1",
  brand_id: "brand-1",
  shop: { id: SHOP_ID, name: "Shop" },
  ...overrides,
});

export const buildFile = (name = "pic.png", type = "image/png") =>
  new File([new Uint8Array([1, 2, 3])], name, { type });
