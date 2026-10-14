/**
 * Plain-object fixtures for service unit tests. Each builder returns a fresh
 * object so tests can mutate freely; pass overrides for the fields under test.
 */

export const buildProduct = (overrides: Record<string, unknown> = {}) => ({
  id: "prod-1",
  name: "Notebook",
  price: 100,
  discount: 0,
  stock_quantity: 10,
  deleted_at: null,
  shop_id: "shop-1",
  ...overrides,
});

export const buildCartItem = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  product_id: "prod-1",
  quantity: 2,
  product: buildProduct(),
  ...overrides,
});

export const buildCart = (overrides: Record<string, unknown> = {}) => ({
  id: "cart-1",
  user_id: "user-1",
  shop_id: "shop-1",
  items: [buildCartItem()],
  user: { name: "Ada", phone: "999" },
  ...overrides,
});

export const buildShop = (overrides: Record<string, unknown> = {}) => ({
  id: "shop-1",
  name: "Campus Store",
  is_active: true,
  accepting_orders: true,
  min_order_value: 0,
  batch_min_order_value: null as number | null,
  default_delivery_fee: 10,
  direct_delivery_fee: 25,
  user: { id: "owner-1" } as { id: string } | null,
  ...overrides,
});

export const buildAddress = (overrides: Record<string, unknown> = {}) => ({
  id: "addr-1",
  user_id: "user-1",
  hostel_block: "A",
  building: "Hostel A",
  building_id: "bld-1" as string | null,
  room_number: "101",
  notes: null,
  ...overrides,
});

export const buildBatchRow = (overrides: Record<string, unknown> = {}) => ({
  id: "batch-1",
  shop_id: "shop-1",
  status: "LOCKED",
  cutoff_time: new Date("2030-01-01T12:00:00Z"),
  collective_total: "150",
  min_order_value_snapshot: "100" as string | null,
  ...overrides,
});
