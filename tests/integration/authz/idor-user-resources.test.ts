// IDOR on user-owned resources that tests/integration/authz/idor.test.ts
// does not cover: notifications, addresses (update/delete action + list),
// favorites, stock watches, reviews, push subscriptions.
import { describe, expect, it } from "vitest";

import {
  getNotificationsByCategoryAction,
  markAllNotificationsAsReadAction,
} from "../../../src/actions/notifications/notification-actions";
import { updateReviewAction } from "../../../src/actions/product/review-action";
import { toggleStockWatchAction } from "../../../src/actions/products/stock-watch-actions";
import { toggleFavoriteShopAction } from "../../../src/actions/shops/favorite-shops-actions";
import {
  deleteAddressAction,
  updateAddressAction,
} from "../../../src/actions/user-addresses/user-address-actions";
import { PATCH as PATCH_MARK_READ } from "../../../src/app/api/notifications/mark-as-read/route";
import { POST as POST_PUSH } from "../../../src/app/api/notifications/push-subscribe/route";
import {
  GET as GET_NOTIFS,
  PATCH as PATCH_NOTIFS,
} from "../../../src/app/api/notifications/route";
import { GET as GET_STOCK_WATCH } from "../../../src/app/api/products/stock-watch/route";
import { GET as GET_REVIEW_FOR_ITEM } from "../../../src/app/api/reviews/order-item/[order_item_id]/route";
import { GET as GET_FAVORITES } from "../../../src/app/api/shops/favorites/route";
import { GET as GET_ADDRESSES } from "../../../src/app/api/users/addresses/route";
import { GET as GET_ME } from "../../../src/app/api/users/me/route";
import { NotificationCategory } from "../../../src/types/prisma.types";
import {
  createOrderAtStatus,
  createUser,
  createUserAddress,
  seedShopWithProducts,
} from "../../factories";
import { expectDenied, jsonReq, params, req } from "../../helpers/authz";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

// The mark-as-read route validates ids as cuids.
const cuidLike = (n: number) => `c${String(n).padStart(24, "0")}`;

async function notificationFor(user_id: string, n: number) {
  return testPrisma.notification.create({
    data: {
      id: cuidLike(n),
      user_id,
      title: `secret title ${user_id}`,
      message: `secret message ${user_id}`,
      read: false,
    },
  });
}

describe("a user can neither read nor mark another user's notifications", () => {
  it("GET /api/notifications lists only the caller's own notifications", async () => {
    const victim = await createUser();
    const attacker = await createUser();
    await notificationFor(victim.id, 1);
    await notificationFor(attacker.id, 2);
    asUser(attacker);

    const res = await GET_NOTIFS(req("/api/notifications"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(`secret title ${victim.id}`);
    expect(text).toContain(`secret title ${attacker.id}`);
  });

  it("PATCH /api/notifications and /api/notifications/mark-as-read with a victim's notification id leave it unread", async () => {
    const victim = await createUser();
    const attacker = await createUser();
    const victimNote = await notificationFor(victim.id, 3);
    asUser(attacker);

    await PATCH_NOTIFS(
      jsonReq("/api/notifications", "PATCH", {
        notification_ids: [victimNote.id],
      })
    );
    await PATCH_MARK_READ(
      jsonReq("/api/notifications/mark-as-read", "PATCH", {
        notificationIds: [victimNote.id],
      })
    );

    const after = await testPrisma.notification.findUniqueOrThrow({
      where: { id: victimNote.id },
    });
    expect(after.read).toBe(false);
  });

  it("markAllNotificationsAsReadAction and getNotificationsByCategoryAction only touch the caller's rows", async () => {
    const victim = await createUser();
    const attacker = await createUser();
    const victimNote = await notificationFor(victim.id, 4);
    await notificationFor(attacker.id, 5);
    asUser(attacker);

    const list = await getNotificationsByCategoryAction(
      NotificationCategory.GENERAL
    );
    expect(JSON.stringify(list)).not.toContain(victimNote.id);

    await markAllNotificationsAsReadAction();
    const after = await testPrisma.notification.findUniqueOrThrow({
      where: { id: victimNote.id },
    });
    expect(after.read).toBe(false);
  });
});

describe("a user can neither read nor change another user's addresses", () => {
  it("updateAddressAction on a victim's address is rejected and the row is unchanged", async () => {
    const victim = await createUser();
    const address = await createUserAddress({
      user_id: victim.id,
      label: "Victim Room",
      room_number: "101",
    });
    asUser(await createUser());

    await expectDenied(
      () =>
        updateAddressAction({
          id: address.id,
          data: {
            label: "Hijacked",
            building_id: "bld-test-1",
            room_number: "999",
            is_default: true,
          },
        }),
      [victim.id]
    );

    const after = await testPrisma.userAddress.findUniqueOrThrow({
      where: { id: address.id },
    });
    expect(after.label).toBe("Victim Room");
    expect(after.room_number).toBe("101");
    expect(after.user_id).toBe(victim.id);
  });

  it("deleteAddressAction on a victim's address is rejected and the row still exists", async () => {
    const victim = await createUser();
    const address = await createUserAddress({ user_id: victim.id });
    asUser(await createUser());

    await expectDenied(() => deleteAddressAction(address.id), [victim.id]);

    expect(
      await testPrisma.userAddress.findUnique({ where: { id: address.id } })
    ).not.toBeNull();
  });

  it("GET /api/users/addresses and GET /api/users/me return only the caller's addresses", async () => {
    const victim = await createUser();
    const victimAddress = await createUserAddress({ user_id: victim.id });
    const attacker = await createUser();
    const ownAddress = await createUserAddress({ user_id: attacker.id });
    asUser(attacker);

    const list = await (await GET_ADDRESSES()).text();
    expect(list).toContain(ownAddress.id);
    expect(list).not.toContain(victimAddress.id);

    const me = await (await GET_ME()).text();
    expect(me).not.toContain(victimAddress.id);
    expect(me).not.toContain(victim.email);
  });
});

describe("favorites and stock watches are private to their owner", () => {
  it("toggling a shop the victim favorited only creates the caller's own favorite, and the victim's survives", async () => {
    const { shop } = await seedShopWithProducts({ productCount: 1 });
    const victim = await createUser();
    await testPrisma.favoriteShop.create({
      data: { user_id: victim.id, shop_id: shop.id },
    });
    const attacker = await createUser();
    asUser(attacker);

    await toggleFavoriteShopAction(shop.id);

    const rows = await testPrisma.favoriteShop.findMany({
      where: { shop_id: shop.id },
    });
    expect(rows.map((r) => r.user_id).sort()).toEqual(
      [attacker.id, victim.id].sort()
    );

    const res = await GET_FAVORITES(req("/api/shops/favorites"));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("toggling a product the victim watches leaves the victim's watch in place; GET /api/products/stock-watch lists only the caller's", async () => {
    const { products } = await seedShopWithProducts({ productCount: 1 });
    const victim = await createUser();
    const victimWatch = await testPrisma.stockWatch.create({
      data: { user_id: victim.id, product_id: products[0].id },
    });
    const attacker = await createUser();
    asUser(attacker);

    const res = await GET_STOCK_WATCH(req("/api/products/stock-watch"));
    expect((await res.json()).data).toEqual([]);

    await toggleStockWatchAction(products[0].id);
    await toggleStockWatchAction(products[0].id);

    expect(
      await testPrisma.stockWatch.findUnique({ where: { id: victimWatch.id } })
    ).not.toBeNull();
  });
});

async function seedReview() {
  const { shop, products } = await seedShopWithProducts({ productCount: 2 });
  const [product, other] = products;
  const author = await createUser();
  const order = await createOrderAtStatus({
    shop_id: shop.id,
    order_status: "COMPLETED",
    user_id: author.id,
  });
  const orderItem = await testPrisma.orderItem.create({
    data: {
      order_id: order.id,
      product_id: product.id,
      quantity: 1,
      price: 100,
    },
  });
  const review = await testPrisma.review.create({
    data: {
      rating: 4,
      comment: "author's own words",
      user_id: author.id,
      product_id: product.id,
      order_item_id: orderItem.id,
    },
  });
  await testPrisma.product.update({
    where: { id: product.id },
    data: { rating_sum: 4, review_count: 1 },
  });
  return { author, product, other, orderItem, review };
}

describe("a user can neither read nor edit another user's review by id", () => {
  it("updateReviewAction on someone else's review is rejected and the review and ratings are unchanged", async () => {
    const { author, product, review } = await seedReview();
    asUser(await createUser());

    await expectDenied(
      () =>
        updateReviewAction({
          review_id: review.id,
          product_id: product.id,
          rating: 1,
          comment: "defaced",
        }),
      [author.id]
    );

    const after = await testPrisma.review.findUniqueOrThrow({
      where: { id: review.id },
    });
    expect(after.rating).toBe(4);
    expect(after.comment).toBe("author's own words");
    const p = await testPrisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(p.rating_sum).toBe(4);
  });

  it("GET /api/reviews/order-item/[id] for someone else's order item is a 404 with no review data", async () => {
    const { orderItem } = await seedReview();
    asUser(await createUser());

    const res = await GET_REVIEW_FOR_ITEM(
      new Request(`http://localhost/api/reviews/order-item/${orderItem.id}`),
      params({ order_item_id: orderItem.id })
    );
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("author's own words");
  });
});

describe("editing a review cannot move rating totals of a product the review is not about", () => {
  it("the author passing another product_id still only changes the reviewed product's rating_sum", async () => {
    const { author, product, other, review } = await seedReview();
    const otherBefore = await testPrisma.product.findUniqueOrThrow({
      where: { id: other.id },
    });
    asUser(author);

    await updateReviewAction({
      review_id: review.id,
      product_id: other.id,
      rating: 1,
      comment: "changed my mind",
    });

    const otherAfter = await testPrisma.product.findUniqueOrThrow({
      where: { id: other.id },
    });
    expect(otherAfter.rating_sum).toBe(otherBefore.rating_sum);
    const reviewed = await testPrisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(reviewed.rating_sum).toBe(1);
  });
});

describe("push subscriptions", () => {
  it("subscribing stores the endpoint for the caller", async () => {
    const user = await createUser();
    asUser(user);
    const res = await POST_PUSH(
      jsonReq("/api/notifications/push-subscribe", "POST", {
        endpoint: "https://push.example/mine",
        keys: { p256dh: "k", auth: "a" },
      })
    );
    expect(res.status).toBe(200);
    const row = await testPrisma.pushSubscription.findFirstOrThrow({
      where: { endpoint: "https://push.example/mine" },
    });
    expect(row.user_id).toBe(user.id);
  });

  it("an endpoint moves to whoever subscribes with it last (one browser switching accounts), so the previous user no longer gets pushes there", async () => {
    const previous = await createUser();
    const current = await createUser();
    const body = {
      endpoint: "https://push.example/shared-browser",
      keys: { p256dh: "k", auth: "a" },
    };
    asUser(previous);
    await POST_PUSH(jsonReq("/api/notifications/push-subscribe", "POST", body));
    asUser(current);
    await POST_PUSH(jsonReq("/api/notifications/push-subscribe", "POST", body));

    const rows = await testPrisma.pushSubscription.findMany({
      where: { endpoint: body.endpoint },
    });
    expect(rows.map((r) => r.user_id)).toEqual([current.id]);
  });
});
