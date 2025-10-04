"use server";

import notificationService from "@/services/notification.service";

export async function sendOrderStatusUpdateNotification(
  user_id: string,
  display_id: string,
  status: string
) {
  await notificationService.publishNotification(user_id, {
    title: "Order Status Updated",
    message: `Your order with ID: ${display_id} has been updated to ${status}`,
    action_url: `/orders`,
    type: "INFO",
  });
}
