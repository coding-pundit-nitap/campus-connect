import { Prisma, type Product, type Shop } from "@/generated/client";
import type { ShopWithOwner } from "@/types";
import type { SerializedProduct } from "@/types/product.types";

const { Decimal } = Prisma;

const FIXED_DATE = new Date("2026-01-01T00:00:00.000Z");

/** A Prisma `Product` row with Decimal money fields. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Masala Dosa",
    description: "Crispy",
    price: new Decimal("100.00"),
    discount: null,
    stock_quantity: 5,
    rating_sum: 0,
    review_count: 0,
    image_key: "products/dosa.jpg",
    is_veg: true,
    is_preorder: false,
    deleted_at: null,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
    shop_id: "shop-1",
    category_id: null,
    brand_id: null,
    ...overrides,
  } as Product;
}

/** A client-side serialized product (numbers instead of Decimals). */
export function makeSerializedProduct(
  overrides: Partial<SerializedProduct> = {}
): SerializedProduct {
  return {
    id: "product-1",
    name: "Masala Dosa",
    description: "Crispy",
    price: 100,
    discount: null,
    stock_quantity: 5,
    rating: 0,
    image_key: "products/dosa.jpg",
    is_veg: true,
    is_preorder: false,
    deleted_at: null,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
    shop_id: "shop-1",
    category_id: null,
    brand_id: null,
    category: null,
    brand: null,
    shop: { id: "shop-1", name: "Canteen" },
    ...overrides,
  } as SerializedProduct;
}

/** A Prisma `Shop` row with Decimal money fields. */
export function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: "shop-1",
    name: "Canteen",
    description: "Hot food",
    location: "Block A",
    opening: "09:00",
    closing: "21:00",
    image_key: "shops/canteen.jpg",
    upi_id: "canteen@upi",
    qr_image_key: "shops/qr.png",
    is_active: true,
    accepting_orders: true,
    pg_seller_id: null,
    verification_status: "VERIFIED",
    shop_type: "CANTEEN",
    deleted_at: null,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
    min_order_value: new Decimal("50.00"),
    batch_min_order_value: null,
    default_delivery_fee: new Decimal("10.00"),
    direct_delivery_fee: new Decimal("20.00"),
    ...overrides,
  } as Shop;
}

export function makeShopWithOwner(
  overrides: Partial<ShopWithOwner> = {}
): ShopWithOwner {
  return {
    ...makeShop(),
    user: { name: "Owner", email: "owner@example.com" },
    ...overrides,
  } as ShopWithOwner;
}

/** Copy of `obj` without `keys` (for "field is optional" schema cases). */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) delete copy[key];
  return copy;
}
