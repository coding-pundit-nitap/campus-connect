"use server";

import { OrderStatus, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils-functions";
import orderRepository from "@/repositories/order.repository";
import orderService from "@/services/order.service";
import { createSuccessResponse } from "@/types/response.types";

export async function createOrderAction({
  shop_id,
  payment_method,
  delivery_address_id,
}: {
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }
    const pg_payment_id =
      payment_method === "ONLINE" ? `txn_${new Date().getTime()}` : "offline";

    const order = await orderService.createOrderFromCart(
      user_id,
      shop_id,
      payment_method,
      delivery_address_id,
      pg_payment_id
    );

    revalidatePath(`/shop/${shop_id}/cart`);
    return createSuccessResponse(order, "Order placed successfully!");
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    throw new InternalServerError("Failed to create order.");
  }
}

export async function updateOrderStatusAction({
  order_id,
  status,
}: {
  order_id: string;
  status: OrderStatus;
}) {
  try {
    const shop_id = await authUtils.getShopId();

    const order = await orderRepository.getOrderById(order_id, {
      select: { shop_id: true },
    });
    if (!order || order.shop_id !== shop_id) {
      throw new UnauthorizedError(
        "Unauthorized: Order does not belong to your shop."
      );
    }

    const updatedOrder = await orderRepository.updateStatus(order_id, status);

    // TODO:revalidate
    return createSuccessResponse(
      updatedOrder,
      `Order status updated to ${status}`
    );
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    throw new InternalServerError("Failed to update order status.");
  }
}
