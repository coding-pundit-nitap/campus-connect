import { describe, expect, it } from "vitest";

import {
  createReviewAction,
  updateReviewAction,
} from "@/actions/product/review-action";
import { ForbiddenError } from "@/lib/custom-error";

import {
  createOrderAtStatus,
  createProduct,
  createShop,
  createUser,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("Review Actions", () => {
  describe("createReviewAction", () => {
    it("throws if anonymous", async () => {
      await asAnonymous();
      await expect(
        createReviewAction({
          product_id: "prod-1",
          order_item_id: "item-1",
          rating: 5,
          comment: "Great!",
        })
      ).rejects.toThrow();
    });

    it("creates a review for a purchased product", async () => {
      const user = await createUser();
      const shop = await createShop();
      const product = await createProduct({ shop_id: shop.id });

      const order = await createOrderAtStatus({
        shop_id: shop.id,
        user_id: user.id,
        order_status: "COMPLETED",
      });

      const orderItem = await testPrisma.orderItem.create({
        data: {
          order_id: order.id,
          product_id: product.id,

          quantity: 1,

          price: 100,
        },
      });

      await asUser(user);

      const res = await createReviewAction({
        product_id: product.id,
        order_item_id: orderItem.id,
        rating: 4,
        comment: "Very good",
      });

      expect(res.data).toBeDefined();
      expect(res.data?.rating).toBe(4);
      expect(res.data?.comment).toBe("Very good");

      const dbReview = await testPrisma.review.findFirst({
        where: { order_item_id: orderItem.id },
      });
      expect(dbReview).toBeDefined();
      expect(dbReview?.rating).toBe(4);
    });

    it("throws Forbidden if user didn't purchase the item", async () => {
      const user = await createUser();
      const otherUser = await createUser();
      const shop = await createShop();
      const product = await createProduct({ shop_id: shop.id });

      const order = await createOrderAtStatus({
        shop_id: shop.id,
        user_id: otherUser.id, // different user
        order_status: "COMPLETED",
      });

      const orderItem = await testPrisma.orderItem.create({
        data: {
          order_id: order.id,
          product_id: product.id,

          quantity: 1,

          price: 100,
        },
      });

      await asUser(user);

      await expect(
        createReviewAction({
          product_id: product.id,
          order_item_id: orderItem.id,
          rating: 4,
          comment: "Nice",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateReviewAction", () => {
    it("updates an existing review as the owner", async () => {
      const user = await createUser();
      const shop = await createShop();
      const product = await createProduct({ shop_id: shop.id });

      const order = await createOrderAtStatus({
        shop_id: shop.id,
        user_id: user.id,
        order_status: "COMPLETED",
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
          user_id: user.id,
          product_id: product.id,
          order_item_id: orderItem.id,
          rating: 3,
          comment: "Okay",
        },
      });

      await asUser(user);

      const res = await updateReviewAction({
        review_id: review.id,
        product_id: product.id,
        rating: 5,
        comment: "Changed my mind, excellent!",
      });

      expect(res.data?.rating).toBe(5);

      const dbReview = await testPrisma.review.findUnique({
        where: { id: review.id },
      });
      expect(dbReview?.rating).toBe(5);
      expect(dbReview?.comment).toContain("Changed");
    });
  });
});
