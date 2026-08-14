
import { APP_TIME_ZONE, getZonedParts } from "../../src/lib/utils/timezone";
import { testPrisma } from "../setup/integration-setup";

let seq = 0;
export const nextSeq = (): number => ++seq;


export function buildUser(
  o: Partial<Parameters<typeof testPrisma.user.create>[0]["data"]> = {}
) {
  const n = nextSeq();
  return {
    id: `user-${n}`,
    name: `User ${n}`,
    email: `user-${n}@test.local`,
    emailVerified: true,
    ...o,
  };
}

export const createUser = (
  o: Partial<Parameters<typeof testPrisma.user.create>[0]["data"]> = {}
) => testPrisma.user.create({ data: buildUser(o) });


export function buildShop(
  o: Partial<Parameters<typeof testPrisma.shop.create>[0]["data"]> = {}
) {
  const n = nextSeq();
  return {
    id: `shop-${n}`,
    name: `Shop ${n}`,
    description: `Test shop ${n}`,
    location: "Test Campus Block",
    opening: "08:00",
    closing: "22:00",
    image_key: `shop-image-${n}`,
    upi_id: `shop-${n}@upi`,
    qr_image_key: `shop-qr-${n}`,
    is_active: true,
    accepting_orders: true,
    ...o,
  };
}

export const createShop = (
  o: Partial<Parameters<typeof testPrisma.shop.create>[0]["data"]> = {}
) => testPrisma.shop.create({ data: buildShop(o) });


type ProductOverrides = Partial<
  Parameters<typeof testPrisma.product.create>[0]["data"]
> & { shop_id: string };

export function buildProduct(o: ProductOverrides) {
  const n = nextSeq();
  return {
    id: `product-${n}`,
    name: `Product ${n}`,
    price: 100,
    stock_quantity: 10,
    image_key: `product-image-${n}`,
    ...o,
  };
}

export const createProduct = (o: ProductOverrides) =>
  testPrisma.product.create({ data: buildProduct(o) });


type UserAddressOverrides = Partial<
  Parameters<typeof testPrisma.userAddress.create>[0]["data"]
> & { user_id: string };

export function buildUserAddress(o: UserAddressOverrides) {
  const n = nextSeq();
  return {
    id: `address-${n}`,
    label: `Address ${n}`,
    building: "Test Hostel",
    room_number: `${100 + n}`,
    building_id: "bld-test-1",
    ...o,
  };
}

export const createUserAddress = (o: UserAddressOverrides) =>
  testPrisma.userAddress.create({ data: buildUserAddress(o) });


type BatchSlotOverrides = Partial<
  Parameters<typeof testPrisma.batchSlot.create>[0]["data"]
> & { shop_id: string; cutoff_time_minutes: number };

export function buildBatchSlot(o: BatchSlotOverrides) {
  const n = nextSeq();
  return {
    id: `batch-slot-${n}`,
    is_active: true,
    ...o,
  };
}

export const createBatchSlot = (o: BatchSlotOverrides) =>
  testPrisma.batchSlot.create({ data: buildBatchSlot(o) });


export async function seedShopWithProducts(opts?: {
  productCount?: number;
  shopOverrides?: Partial<Parameters<typeof testPrisma.shop.create>[0]["data"]>;
}) {
  const productCount = opts?.productCount ?? 2;

  const shop = await createShop({
    accepting_orders: true,
    ...opts?.shopOverrides,
  });
  const owner = await createUser({ shop_id: shop.id });
  const products = await Promise.all(
    Array.from({ length: productCount }, () =>
      createProduct({ shop_id: shop.id, price: 100 })
    )
  );

  return { shop, owner, products };
}


export async function seedCartReadyForCheckout(opts?: {
  itemCount?: number;
  quantity?: number;
}) {
  const itemCount = opts?.itemCount ?? 2;
  const quantity = opts?.quantity ?? 1;

  const { shop, owner, products } = await seedShopWithProducts({
    productCount: itemCount,
  });

  const user = await createUser();
  const address = await createUserAddress({
    user_id: user.id,
    building_id: "bld-test-1",
  });

  const cart = await testPrisma.cart.create({
    data: {
      user_id: user.id,
      shop_id: shop.id,
      items: {
        create: products.map((p) => ({ product_id: p.id, quantity })),
      },
    },
    include: { items: true },
  });

  return { user, owner, shop, products, cart, address };
}

export async function seedCartForShop(shop: { id: string }) {
  const user = await createUser();
  const address = await createUserAddress({
    user_id: user.id,
    building_id: "bld-test-1",
  });
  const product = await createProduct({ shop_id: shop.id, price: 100 });
  const cart = await testPrisma.cart.create({
    data: {
      user_id: user.id,
      shop_id: shop.id,
      items: { create: [{ product_id: product.id, quantity: 1 }] },
    },
    include: { items: true },
  });
  return { user, cart, address, product };
}


export async function seedOpenBatch(opts: {
  cutoffAt: Date;
  shop_id?: string;
}) {
  const shop_id = opts.shop_id ?? (await createShop()).id;

  const cutoff_time = new Date(opts.cutoffAt);
  cutoff_time.setSeconds(0, 0);

  const { hour, minute } = getZonedParts(cutoff_time, APP_TIME_ZONE);
  const cutoff_time_minutes = hour * 60 + minute;

  const slot = await createBatchSlot({ shop_id, cutoff_time_minutes });

  return testPrisma.batch.create({
    data: {
      shop_id,
      slot_id: slot.id,
      cutoff_time,
      status: "OPEN",
    },
  });
}


export function futureSlotTime(offsetMinutes = 120): {
  at: Date;
  cutoffMinutes: number;
} {
  const at = new Date(Date.now() + offsetMinutes * 60_000);
  at.setSeconds(0, 0);
  const { hour, minute } = getZonedParts(at, APP_TIME_ZONE);
  return { at, cutoffMinutes: hour * 60 + minute };
}
