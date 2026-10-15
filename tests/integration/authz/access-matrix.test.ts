// Access matrix: who may call which route / action at all.
import { describe, expect, it } from "vitest";

import { NotificationCategory } from "@/types/prisma.types";

import {
  addShopDeliveryBuildingAction,
  createBuildingAction,
  removeShopDeliveryBuildingAction,
} from "../../../src/actions/building/building-actions";
import {
  getNotificationsByCategoryAction,
  markAllNotificationsAsReadAction,
} from "../../../src/actions/notifications/notification-actions";
import {
  bulkCreateProductsAction,
  deleteProductAction,
  toggleProductStockAction,
  updateProductAction,
  updateProductPriceAction,
} from "../../../src/actions/product/product-actions";
import {
  createReviewAction,
  updateReviewAction,
} from "../../../src/actions/product/review-action";
import { toggleStockWatchAction } from "../../../src/actions/products/stock-watch-actions";
import {
  createShopAction,
  deleteShopAction,
  toggleAcceptingOrdersAction,
  updateShopAction,
} from "../../../src/actions/shop/shop-actions";
import { toggleFavoriteShopAction } from "../../../src/actions/shops/favorite-shops-actions";
import {
  addUserAddress,
  deleteUserAddress,
  updateUser,
  updateUserAddress,
} from "../../../src/actions/user";
import { updateProfileImageAction } from "../../../src/actions/user/profile-image-action";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "../../../src/actions/user-addresses/user-address-actions";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  getShopAnnouncementsAction,
} from "../../../src/actions/vendor/announcement-actions";
import {
  createBatchSlotAction,
  deleteBatchSlotAction,
  listBatchSlotsAction,
  updateBatchSlotAction,
} from "../../../src/actions/vendor/batch-slot-actions";
import { GET as GET_ALL_CARTS } from "../../../src/app/api/cart/all/route";
import { GET as GET_NOTIF_HISTORY } from "../../../src/app/api/notifications/history/route";
import { PATCH as PATCH_MARK_READ } from "../../../src/app/api/notifications/mark-as-read/route";
import {
  DELETE as DELETE_PUSH,
  POST as POST_PUSH,
} from "../../../src/app/api/notifications/push-subscribe/route";
import {
  GET as GET_NOTIFS,
  PATCH as PATCH_NOTIFS,
} from "../../../src/app/api/notifications/route";
import { GET as GET_NOTIF_STREAM } from "../../../src/app/api/notifications/stream/route";
import { GET as GET_NOTIF_SUMMARY } from "../../../src/app/api/notifications/summary/route";
import { GET as GET_PRODUCT } from "../../../src/app/api/products/[product_id]/route";
import { GET as GET_PRODUCTS } from "../../../src/app/api/products/route";
import { GET as GET_STOCK_WATCH } from "../../../src/app/api/products/stock-watch/route";
import { GET as GET_REVIEWS } from "../../../src/app/api/reviews/[product_id]/route";
import { GET as GET_REVIEW_FOR_ITEM } from "../../../src/app/api/reviews/order-item/[order_item_id]/route";
import { GET as GET_SEARCH_ORDERS } from "../../../src/app/api/search/orders/route";
import { GET as GET_SELLER_ORDERS } from "../../../src/app/api/seller/orders/route";
import { GET as GET_SHOP_PRODUCTS } from "../../../src/app/api/shops/[shop_id]/products/route";
import { GET as GET_SHOP } from "../../../src/app/api/shops/[shop_id]/route";
import { GET as GET_ALL_SHOPS } from "../../../src/app/api/shops/all/route";
import { GET as GET_FAVORITES } from "../../../src/app/api/shops/favorites/route";
import { GET as GET_MY_SHOP } from "../../../src/app/api/shops/route";
import { POST as POST_UPLOAD } from "../../../src/app/api/upload/route";
import { GET as GET_ADDRESSES } from "../../../src/app/api/users/addresses/route";
import {
  GET as GET_ME,
  PUT as PUT_ME,
} from "../../../src/app/api/users/me/route";
import { GET as GET_USER_ORDERS } from "../../../src/app/api/users/orders/route";
import { GET as GET_VENDOR_ANNOUNCEMENTS } from "../../../src/app/api/vendor/announcements/route";
import { GET as GET_VENDOR_ACTIVE_BATCH } from "../../../src/app/api/vendor/batch/active/route";
import { GET as GET_VENDOR_DELIVERY_RUN } from "../../../src/app/api/vendor/batch/delivery-run/route";
import { GET as GET_VENDOR_DIRECT } from "../../../src/app/api/vendor/batch/direct-deliveries/route";
import { GET as GET_VENDOR_BUILDINGS } from "../../../src/app/api/vendor/delivery-buildings/route";
import { GET as GET_VENDOR_EARNINGS } from "../../../src/app/api/vendor/earnings/route";
import { GET as GET_VENDOR_CONSOLE } from "../../../src/app/api/vendor/orders/console/route";
import { GET as GET_VENDOR_HISTORY } from "../../../src/app/api/vendor/orders/history/route";
import { createUser, seedShopWithProducts } from "../../factories";
import {
  expectRejectedWith,
  FORBIDDEN_ERRORS,
  jsonReq,
  params,
  req,
  SIGNED_OUT_ERRORS,
} from "../../helpers/authz";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

/** Status of a route call; a handler that throws counts as a 500. */
async function statusOf(run: () => Promise<Response>): Promise<number> {
  try {
    const res = await run();
    return res.status;
  } catch {
    return 500;
  }
}

const UPLOAD_BODY = {
  fileName: "photo.png",
  fileType: "image/png",
  fileSize: 1024,
};

const protectedRoutes: Array<[string, () => Promise<Response>]> = [
  ["GET /api/notifications", () => GET_NOTIFS(req("/api/notifications"))],
  [
    "PATCH /api/notifications",
    () =>
      PATCH_NOTIFS(
        jsonReq("/api/notifications", "PATCH", { notification_ids: [] })
      ),
  ],
  [
    "PATCH /api/notifications/mark-as-read",
    () =>
      PATCH_MARK_READ(jsonReq("/api/notifications/mark-as-read", "PATCH", {})),
  ],
  ["GET /api/notifications/summary", () => GET_NOTIF_SUMMARY()],
  [
    "GET /api/notifications/history",
    () => GET_NOTIF_HISTORY(req("/api/notifications/history")),
  ],
  [
    "GET /api/notifications/stream",
    () => GET_NOTIF_STREAM(req("/api/notifications/stream")),
  ],
  [
    "POST /api/notifications/push-subscribe",
    () =>
      POST_PUSH(
        jsonReq("/api/notifications/push-subscribe", "POST", {
          endpoint: "https://push.example/x",
          keys: { p256dh: "a", auth: "b" },
        })
      ),
  ],
  [
    "DELETE /api/notifications/push-subscribe",
    () =>
      DELETE_PUSH(
        req(
          "/api/notifications/push-subscribe?endpoint=https://push.example/x",
          { method: "DELETE" }
        )
      ),
  ],
  ["GET /api/users/me", () => GET_ME()],
  [
    "PUT /api/users/me",
    () => PUT_ME(jsonReq("/api/users/me", "PUT", { name: "Someone Else" })),
  ],
  ["GET /api/users/addresses", () => GET_ADDRESSES()],
  ["GET /api/shops (my shop)", () => GET_MY_SHOP()],
  [
    "GET /api/shops/favorites",
    () => GET_FAVORITES(req("/api/shops/favorites")),
  ],
  [
    "GET /api/products/stock-watch",
    () => GET_STOCK_WATCH(req("/api/products/stock-watch")),
  ],
  [
    "GET /api/reviews/order-item/[id]",
    () =>
      GET_REVIEW_FOR_ITEM(
        new Request("http://localhost/api/reviews/order-item/x"),
        params({ order_item_id: "x" })
      ),
  ],
  [
    "POST /api/upload",
    () => POST_UPLOAD(jsonReq("/api/upload", "POST", UPLOAD_BODY)),
  ],
  ["GET /api/cart/all", () => GET_ALL_CARTS()],
  ["GET /api/seller/orders", () => GET_SELLER_ORDERS()],
  [
    "GET /api/search/orders",
    () => GET_SEARCH_ORDERS(req("/api/search/orders")),
  ],
  [
    "GET /api/vendor/announcements",
    () => GET_VENDOR_ANNOUNCEMENTS(req("/api/vendor/announcements")),
  ],
  ["GET /api/vendor/delivery-buildings", () => GET_VENDOR_BUILDINGS()],
  [
    "GET /api/vendor/earnings",
    () => GET_VENDOR_EARNINGS(req("/api/vendor/earnings")),
  ],
  ["GET /api/vendor/orders/console", () => GET_VENDOR_CONSOLE()],
  [
    "GET /api/vendor/orders/history",
    () => GET_VENDOR_HISTORY(req("/api/vendor/orders/history")),
  ],
  ["GET /api/vendor/batch/active", () => GET_VENDOR_ACTIVE_BATCH()],
  ["GET /api/vendor/batch/delivery-run", () => GET_VENDOR_DELIVERY_RUN()],
  ["GET /api/vendor/batch/direct-deliveries", () => GET_VENDOR_DIRECT()],
  ["GET /api/users/orders", () => GET_USER_ORDERS()],
];

describe("protected route handlers answer a signed-out caller with 401", () => {
  for (const [name, run] of protectedRoutes) {
    it(`${name} -> 401 when signed out`, async () => {
      asAnonymous();
      expect(await statusOf(run)).toBe(401);
    });
  }
});

const ADDRESS = {
  label: "Home",
  building: "Test Hostel",
  room_number: "1",
  is_default: false,
};
const PRODUCT_FORM = { name: "x", price: 1, stock_quantity: 1, discount: 0 };

const userActions: Array<[string, () => Promise<unknown>]> = [
  [
    "markAllNotificationsAsReadAction",
    () => markAllNotificationsAsReadAction(),
  ],
  [
    "getNotificationsByCategoryAction",
    () => getNotificationsByCategoryAction(NotificationCategory.GENERAL),
  ],
  ["toggleStockWatchAction", () => toggleStockWatchAction("p")],
  ["toggleFavoriteShopAction", () => toggleFavoriteShopAction("s")],
  ["createAddressAction", () => createAddressAction(ADDRESS)],
  [
    "updateAddressAction",
    () => updateAddressAction({ id: "a", data: ADDRESS }),
  ],
  ["deleteAddressAction", () => deleteAddressAction("a")],
  ["setDefaultAddressAction", () => setDefaultAddressAction("a")],
  ["updateUser", () => updateUser({ name: "Somebody" })],
  ["addUserAddress", () => addUserAddress(ADDRESS)],
  ["updateUserAddress", () => updateUserAddress({ id: "a", ...ADDRESS })],
  ["deleteUserAddress", () => deleteUserAddress("a")],
  [
    "updateProfileImageAction",
    () => updateProfileImageAction(new File(["x"], "a.png")),
  ],
  [
    "createReviewAction",
    () =>
      createReviewAction({
        product_id: "p",
        order_item_id: "o",
        rating: 5,
        comment: "c",
      }),
  ],
  [
    "updateReviewAction",
    () =>
      updateReviewAction({
        review_id: "r",
        product_id: "p",
        rating: 5,
        comment: "c",
      }),
  ],
  ["createBuildingAction", () => createBuildingAction({ name: "B" })],
];

const vendorActions: Array<[string, () => Promise<unknown>]> = [
  ["addShopDeliveryBuildingAction", () => addShopDeliveryBuildingAction("b")],
  [
    "removeShopDeliveryBuildingAction",
    () => removeShopDeliveryBuildingAction("b"),
  ],
  ["updateProductAction", () => updateProductAction("p", PRODUCT_FORM)],
  ["deleteProductAction", () => deleteProductAction("p")],
  ["toggleProductStockAction", () => toggleProductStockAction("p", true)],
  ["updateProductPriceAction", () => updateProductPriceAction("p", 5)],
  [
    "bulkCreateProductsAction",
    () =>
      bulkCreateProductsAction([{ name: "abc", price: 1, stock_quantity: 1 }]),
  ],
  [
    "createShopAction",
    () => createShopAction({} as Parameters<typeof createShopAction>[0]),
  ],
  [
    "updateShopAction",
    () => updateShopAction({} as Parameters<typeof updateShopAction>[0]),
  ],
  ["deleteShopAction", () => deleteShopAction()],
  ["toggleAcceptingOrdersAction", () => toggleAcceptingOrdersAction(false)],
  [
    "createAnnouncementAction",
    () =>
      createAnnouncementAction({
        title: "t",
        message: "m",
        expires_at: new Date(Date.now() + 3_600_000),
      }),
  ],
  ["deleteAnnouncementAction", () => deleteAnnouncementAction("a")],
  ["getShopAnnouncementsAction", () => getShopAnnouncementsAction()],
  ["listBatchSlotsAction", () => listBatchSlotsAction()],
  [
    "createBatchSlotAction",
    () => createBatchSlotAction({ cutoff_time_minutes: 600 }),
  ],
  [
    "updateBatchSlotAction",
    () => updateBatchSlotAction({ id: "s", cutoff_time_minutes: 600 }),
  ],
  ["deleteBatchSlotAction", () => deleteBatchSlotAction("s")],
];

describe("protected server actions reject a signed-out caller with an auth error and no side effect", () => {
  for (const [name, run] of [...userActions, ...vendorActions]) {
    it(`${name} rejects a signed-out caller with an auth error`, async () => {
      asAnonymous();
      await expectRejectedWith(run, SIGNED_OUT_ERRORS, name);
    });
  }

  it("signed-out calls create no rows (addresses, buildings, favorites, watches, slots, announcements)", async () => {
    const { shop, products } = await seedShopWithProducts({ productCount: 1 });
    asAnonymous();
    for (const [, run] of [...userActions, ...vendorActions]) {
      await run().catch(() => undefined);
    }
    await toggleFavoriteShopAction(shop.id).catch(() => undefined);
    await toggleStockWatchAction(products[0].id).catch(() => undefined);

    expect(await testPrisma.userAddress.count()).toBe(0);
    expect(await testPrisma.favoriteShop.count()).toBe(0);
    expect(await testPrisma.stockWatch.count()).toBe(0);
    expect(await testPrisma.shopAnnouncement.count()).toBe(0);
    expect(await testPrisma.batchSlot.count()).toBe(0);
    expect(await testPrisma.building.count({ where: { name: "B" } })).toBe(0);
  });
});

describe("vendor-only routes answer a signed-in non-vendor with 403", () => {
  const vendorRoutes: Array<[string, () => Promise<Response>]> = [
    [
      "GET /api/search/orders",
      () => GET_SEARCH_ORDERS(req("/api/search/orders")),
    ],
    [
      "GET /api/vendor/announcements",
      () => GET_VENDOR_ANNOUNCEMENTS(req("/api/vendor/announcements")),
    ],
    [
      "GET /api/vendor/earnings",
      () => GET_VENDOR_EARNINGS(req("/api/vendor/earnings")),
    ],
    [
      "GET /api/vendor/orders/history",
      () => GET_VENDOR_HISTORY(req("/api/vendor/orders/history")),
    ],
    ["GET /api/vendor/delivery-buildings", () => GET_VENDOR_BUILDINGS()],
    ["GET /api/vendor/orders/console", () => GET_VENDOR_CONSOLE()],
    ["GET /api/vendor/batch/active", () => GET_VENDOR_ACTIVE_BATCH()],
    ["GET /api/vendor/batch/delivery-run", () => GET_VENDOR_DELIVERY_RUN()],
    ["GET /api/vendor/batch/direct-deliveries", () => GET_VENDOR_DIRECT()],
  ];
  for (const [name, run] of vendorRoutes) {
    it(`${name} -> 403 for a plain user`, async () => {
      asUser(await createUser());
      expect(await statusOf(run)).toBe(403);
    });
  }
});

describe("vendor-only actions reject a signed-in non-vendor and change nothing", () => {
  it("product, announcement, delivery-building, slot and shop-settings actions reject a plain user with a 403-class error", async () => {
    const { shop, products } = await seedShopWithProducts({ productCount: 1 });
    const product = products[0];
    asUser(await createUser());

    const calls: Array<[string, () => Promise<unknown>]> = [
      [
        "updateProductAction",
        () =>
          updateProductAction(product.id, {
            name: "Hijack",
            price: 1,
            stock_quantity: 1,
            discount: 0,
          }),
      ],
      ["deleteProductAction", () => deleteProductAction(product.id)],
      [
        "toggleProductStockAction",
        () => toggleProductStockAction(product.id, false),
      ],
      [
        "updateProductPriceAction",
        () => updateProductPriceAction(product.id, 1),
      ],
      [
        "createAnnouncementAction",
        () =>
          createAnnouncementAction({
            title: "t",
            message: "m",
            expires_at: new Date(Date.now() + 3_600_000),
          }),
      ],
      ["getShopAnnouncementsAction", () => getShopAnnouncementsAction()],
      [
        "addShopDeliveryBuildingAction",
        () => addShopDeliveryBuildingAction("bld-test-1"),
      ],
      [
        "removeShopDeliveryBuildingAction",
        () => removeShopDeliveryBuildingAction("bld-test-1"),
      ],
      ["listBatchSlotsAction", () => listBatchSlotsAction()],
      [
        "createBatchSlotAction",
        () => createBatchSlotAction({ cutoff_time_minutes: 600 }),
      ],
      [
        "updateShopAction",
        () => updateShopAction({} as Parameters<typeof updateShopAction>[0]),
      ],
      ["deleteShopAction", () => deleteShopAction()],
      ["toggleAcceptingOrdersAction", () => toggleAcceptingOrdersAction(true)],
      [
        "bulkCreateProductsAction",
        () =>
          bulkCreateProductsAction([
            { name: "abc", price: 1, stock_quantity: 1 },
          ]),
      ],
    ];
    for (const [name, run] of calls) {
      await expectRejectedWith(run, FORBIDDEN_ERRORS, name);
    }

    const after = await testPrisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(after.name).toBe(product.name);
    expect(after.stock_quantity).toBe(product.stock_quantity);
    expect(after.price.toString()).toBe(product.price.toString());
    expect(await testPrisma.shopAnnouncement.count()).toBe(0);
    expect(await testPrisma.batchSlot.count()).toBe(0);
    expect(
      await testPrisma.product.count({ where: { shop_id: shop.id } })
    ).toBe(1);
  });
});

describe("public catalogue routes are readable without a session", () => {
  it("shops, shop detail, shop products, products, product detail and reviews return 200 to an anonymous caller", async () => {
    const { shop, products } = await seedShopWithProducts({ productCount: 1 });
    asAnonymous();

    const checks: Array<[string, () => Promise<Response>]> = [
      [
        "GET /api/shops/all",
        () => GET_ALL_SHOPS(new Request("http://localhost/api/shops/all")),
      ],
      [
        "GET /api/shops/[id]",
        () =>
          GET_SHOP(req(`/api/shops/${shop.id}`), params({ shop_id: shop.id })),
      ],
      [
        "GET /api/shops/[id]/products",
        () =>
          GET_SHOP_PRODUCTS(
            new Request(`http://localhost/api/shops/${shop.id}/products`),
            params({ shop_id: shop.id })
          ),
      ],
      ["GET /api/products", () => GET_PRODUCTS(req("/api/products"))],
      [
        "GET /api/products/[id]",
        () =>
          GET_PRODUCT(
            req(`/api/products/${products[0].id}`),
            params({ product_id: products[0].id })
          ),
      ],
      [
        "GET /api/reviews/[product_id]",
        () =>
          GET_REVIEWS(
            req(`/api/reviews/${products[0].id}`),
            params({ product_id: products[0].id })
          ),
      ],
    ];
    for (const [name, run] of checks) {
      expect(await statusOf(run), name).toBe(200);
    }
  });
});

describe("public shop endpoints never expose the owner's e-mail address", () => {
  it("GET /api/shops/all and GET /api/shops/[id] carry no owner e-mail for an anonymous caller", async () => {
    const { shop, owner } = await seedShopWithProducts({ productCount: 1 });
    asAnonymous();

    const list = await GET_ALL_SHOPS(
      new Request("http://localhost/api/shops/all")
    );
    expect(list.status).toBe(200);
    expect(await list.text()).not.toContain(owner.email);

    const detail = await GET_SHOP(
      req(`/api/shops/${shop.id}`),
      params({ shop_id: shop.id })
    );
    expect(detail.status).toBe(200);
    expect(await detail.text()).not.toContain(owner.email);
  });

  it("the owner still sees their own e-mail on GET /api/shops (my shop)", async () => {
    const { owner } = await seedShopWithProducts({ productCount: 1 });
    asUser(owner);
    const res = await GET_MY_SHOP();
    expect(res.status).toBe(200);
    expect(await res.text()).toContain(owner.email);
  });
});
