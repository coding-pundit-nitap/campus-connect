// Shared scenario builders for the rule-based ("spec") order tests.
// Relative imports, not the "@/" alias (see tests/factories/index.ts).
import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createProduct,
  createShop,
  createUser,
  createUserAddress,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

export const services = () => createContainer({ prisma: testPrisma });

type ShopOverrides = Partial<
  Parameters<typeof testPrisma.shop.create>[0]["data"]
>;

export type LineSpec = {
  price: number;
  discount?: number | null;
  quantity: number;
  stock?: number;
};

/**
 * A shop (with owner), a buyer with an address, and a cart holding one
 * product per `lines` entry. Shop hours span the whole day so any requested
 * delivery time is inside shop hours.
 */
export async function seedCheckout(opts: {
  lines: LineSpec[];
  shop?: ShopOverrides;
}) {
  const shop = await createShop({
    opening: "00:00",
    closing: "23:59",
    min_order_value: 0,
    ...opts.shop,
  });
  const owner = await createUser({ shop_id: shop.id });
  const buyer = await createUser();
  const address = await createUserAddress({ user_id: buyer.id });
  const products = [];
  for (const line of opts.lines) {
    products.push(
      await createProduct({
        shop_id: shop.id,
        price: line.price,
        discount: line.discount ?? null,
        stock_quantity: line.stock ?? 100,
      })
    );
  }
  const cart = await testPrisma.cart.create({
    data: {
      user_id: buyer.id,
      shop_id: shop.id,
      items: {
        create: products.map((p, i) => ({
          product_id: p.id,
          quantity: opts.lines[i].quantity,
        })),
      },
    },
  });
  return { shop, owner, buyer, address, products, cart };
}

/** Place a direct-delivery order through the service (no action-level checks). */
export function placeDirectOrder(
  s: { buyer: { id: string }; shop: { id: string }; address: { id: string } },
  payment_method: PaymentMethod = "CASH"
) {
  return services().orderService.createOrderFromCart(
    s.buyer.id,
    s.shop.id,
    payment_method,
    s.address.id,
    undefined,
    undefined,
    payment_method === "ONLINE" ? "UPI1234567890" : undefined,
    undefined,
    true,
    undefined
  );
}

/** Place a batch-delivery order into `batch_id` through the service. */
export function placeBatchOrder(
  s: { buyer: { id: string }; shop: { id: string }; address: { id: string } },
  batch_id: string,
  payment_method: PaymentMethod = "CASH"
) {
  return services().orderService.createOrderFromCart(
    s.buyer.id,
    s.shop.id,
    payment_method,
    s.address.id,
    undefined,
    undefined,
    payment_method === "ONLINE" ? "UPI1234567890" : undefined,
    undefined,
    false,
    batch_id
  );
}

export const paise = (v: unknown) => Math.round(Number(v) * 100);

/** An order row with explicit money and status, for lifecycle/earnings tests. */
export async function createOrderRow(o: {
  shop_id: string;
  user_id?: string;
  order_status?: Parameters<
    typeof testPrisma.order.create
  >[0]["data"]["order_status"];
  payment_method?: PaymentMethod;
  payment_status?: Parameters<
    typeof testPrisma.order.create
  >[0]["data"]["payment_status"];
  item_total?: number;
  delivery_fee?: number;
  platform_fee?: number;
  actual_delivery_time?: Date | null;
  is_direct_delivery?: boolean;
  delivery_otp?: string | null;
  batch_id?: string;
}) {
  const item_total = o.item_total ?? 100;
  const delivery_fee = o.delivery_fee ?? 0;
  const platform_fee = o.platform_fee ?? 0;
  const n = Math.random().toString(36).slice(2, 10);
  return testPrisma.order.create({
    data: {
      display_id: `SPEC-${n}`,
      shop_id: o.shop_id,
      user_id: o.user_id,
      order_status: o.order_status ?? "NEW",
      payment_method: o.payment_method ?? "CASH",
      payment_status: o.payment_status,
      item_total,
      delivery_fee,
      platform_fee,
      total_price: item_total + delivery_fee + platform_fee,
      delivery_address_snapshot: {},
      actual_delivery_time: o.actual_delivery_time ?? undefined,
      is_direct_delivery: o.is_direct_delivery ?? false,
      delivery_otp: o.delivery_otp ?? undefined,
      batch_id: o.batch_id,
    },
  });
}
