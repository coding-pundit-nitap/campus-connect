import { beforeEach,describe, expect, it } from "vitest";

import {
  acceptOrderAction,
  markDeliveryFailedAction,
  rejectOrderAction,
  startDirectDeliveryAction,
  verifyDeliveryOtpAction,
} from "@/actions/shop/order-management-actions";

import {
  createOrderAtStatus,
  createUser,
  createUserAddress,
  seedOpenBatch,
  seedShopWithProducts,
} from "../../factories";
import { asAnonymous,asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("Order Management Actions Integration", () => {
  let shop: any;
  let owner: any;
  let buyer: any;
  let address: any;

  beforeEach(async () => {
    const seed = await seedShopWithProducts({ productCount: 1 });
    shop = seed.shop;
    owner = seed.owner;
    
    buyer = await createUser();
    address = await createUserAddress({ user_id: buyer.id });
  });

  describe("acceptOrderAction", () => {
    it("should accept order and transition to BATCHED when batch exists", async () => {
      await asUser(owner);
      const batch = await seedOpenBatch({ shop_id: shop.id, cutoffAt: new Date(Date.now() + 30 * 60000) });
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await acceptOrderAction(order.id);
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("BATCHED");
    });

    it("should throw if order not NEW", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "COMPLETED",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(acceptOrderAction(order.id)).rejects.toThrow();
    });

    it("should throw if non-owner", async () => {
      await asUser(buyer);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(acceptOrderAction(order.id)).rejects.toThrow();
    });

    it("should throw if anonymous", async () => {
      asAnonymous();
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(acceptOrderAction(order.id)).rejects.toThrow();
    });
  });

  describe("startDirectDeliveryAction", () => {
    it("should transition to OUT_FOR_DELIVERY and set OTP", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "BATCHED",
        shop_id: shop.id,
        user_id: buyer.id,
      });
      await testPrisma.order.update({ where: { id: order.id }, data: { is_direct_delivery: true } });

      await startDirectDeliveryAction(order.id);
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("OUT_FOR_DELIVERY");
      expect(updated?.delivery_otp).toBeDefined();
      expect(updated?.delivery_otp?.length).toBe(4);
    });

    it("should throw if order not BATCHED", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(startDirectDeliveryAction(order.id)).rejects.toThrow();
    });
  });

  describe("rejectOrderAction", () => {
    it("should reject CASH order and set payment CANCELLED", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
        payment_method: "CASH",
      });

      await rejectOrderAction(order.id, "Out of stock");
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("CANCELLED");
      expect(updated?.payment_status).toBe("CANCELLED");
      expect(updated?.cancellation_reason).toBe("Out of stock");
    });

    it("should reject ONLINE order and set payment REFUNDED", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
        payment_method: "ONLINE",
        payment_status: "COMPLETED",
      });

      await rejectOrderAction(order.id);
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("CANCELLED");
      expect(updated?.payment_status).toBe("REFUNDED");
    });

    it("should throw if already COMPLETED", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "COMPLETED",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(rejectOrderAction(order.id)).rejects.toThrow();
    });

    it("should throw if already CANCELLED", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "CANCELLED",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(rejectOrderAction(order.id)).rejects.toThrow();
    });
  });

  describe("verifyDeliveryOtpAction", () => {
    it("should complete order with correct OTP", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "OUT_FOR_DELIVERY",
        shop_id: shop.id,
        user_id: buyer.id,
      });
      
      // Manually set OTP for test
      await testPrisma.order.update({
        where: { id: order.id },
        data: { delivery_otp: "1234" }
      });

      await verifyDeliveryOtpAction(order.id, "1234");
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("COMPLETED");
      expect(updated?.delivery_otp).toBeNull();
      expect(updated?.actual_delivery_time).toBeDefined();
    });

    it("should throw BadRequestError with wrong OTP", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "OUT_FOR_DELIVERY",
        shop_id: shop.id,
        user_id: buyer.id,
      });
      
      await testPrisma.order.update({
        where: { id: order.id },
        data: { delivery_otp: "1234" }
      });

      await expect(verifyDeliveryOtpAction(order.id, "9999")).rejects.toThrow();
    });

    it("should throw if order not OUT_FOR_DELIVERY", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(verifyDeliveryOtpAction(order.id, "1234")).rejects.toThrow();
    });
  });

  describe("markDeliveryFailedAction", () => {
    it("should mark delivery failed", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "OUT_FOR_DELIVERY",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await markDeliveryFailedAction(order.id, "Customer not available");
      
      const updated = await testPrisma.order.findUnique({ where: { id: order.id } });
      expect(updated?.order_status).toBe("DELIVERY_FAILED");
      expect(updated?.customer_notes).toBe("[Delivery Failed: Customer not available]");
    });

    it("should throw if order not OUT_FOR_DELIVERY", async () => {
      await asUser(owner);
      const order = await createOrderAtStatus({
        order_status: "NEW",
        shop_id: shop.id,
        user_id: buyer.id,
      });

      await expect(markDeliveryFailedAction(order.id, "No Answer")).rejects.toThrow();
    });
  });
});
